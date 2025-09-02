package dbupdater

import (
	"context"
	"log/slog"
	"strings"
	"time"
	"volos-backend/model"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// SetDAOMemberStatus updates the DAO membership status for a user
func SetDAOMemberStatus(client *firestore.Client, userAddress string, isMember bool) {
	ctx := context.Background()

	_, err := client.Collection("users").Doc(userAddress).Get(ctx)
	userExists := err == nil

	now := time.Now()
	user := model.User{
		Address:   userAddress,
		DAOMember: isMember,
		StakedVLS: make(map[string]int64),
		CreatedAt: now,
	}

	if userExists {
		updates := []firestore.Update{
			{Path: "dao_member", Value: isMember},
		}
		_, err = client.Collection("users").Doc(userAddress).Update(ctx, updates)
	} else {
		_, err = client.Collection("users").Doc(userAddress).Set(ctx, user)
	}
	if err != nil {
		slog.Error("failed to update DAO membership status", "user_address", userAddress, "is_member", isMember, "error", err)
		return
	}

	status := "added to DAO"
	if !isMember {
		status = "removed from DAO"
	}
	slog.Info("successfully updated DAO membership", "user_address", userAddress, "action", status)
}

// AddDAOMember adds a user to the DAO by setting dao_member to true
func AddDAOMember(client *firestore.Client, userAddress string) {
	SetDAOMemberStatus(client, userAddress, true)
}

// RemoveDAOMember removes a user from the DAO by setting dao_member to false
func RemoveDAOMember(client *firestore.Client, userAddress string) {
	SetDAOMemberStatus(client, userAddress, false)
}

// UpdateUserStakedVLS updates the staked VLS delegation map for a user.
// This function maintains a mapping of delegatee addresses to staked VLS amounts,
// keeping the database in sync with the on-chain AVL tree that tracks the same delegation data.
// The staked_vls field maps delegatee addresses to VLS token amounts. Positive amounts
// represent staking operations while negative amounts represent unstaking. Delegatee
// entries are removed when amounts reach zero or become negative.
func UpdateUserStakedVLS(client *firestore.Client, userAddress, delegatee string, amount int64, timestamp int64) {
	ctx := context.Background()

	userRef := client.Collection("users").Doc(userAddress)
	doc, err := userRef.Get(ctx)

	var user model.User
	userExists := err == nil

	if userExists {
		if err := doc.DataTo(&user); err != nil {
			slog.Error("failed to parse user data", "user_address", userAddress, "error", err)
			return
		}
	} else {
		user = model.User{
			Address:   userAddress,
			DAOMember: false,
			StakedVLS: make(map[string]int64),
			CreatedAt: time.Unix(timestamp, 0),
		}
	}

	if user.StakedVLS == nil {
		user.StakedVLS = make(map[string]int64)
	}

	currentAmount := user.StakedVLS[delegatee]
	newAmount := currentAmount + amount

	if newAmount <= 0 {
		delete(user.StakedVLS, delegatee)
		slog.Info("removed delegation", "user_address", userAddress, "delegatee", delegatee, "final_amount", newAmount)

	} else {
		user.StakedVLS[delegatee] = newAmount
		slog.Info("updated delegation", "user_address", userAddress, "delegatee", delegatee, "new_amount", newAmount, "amount_change", amount)

	}

	_, err = userRef.Set(ctx, user)
	if err != nil {
		slog.Error("failed to update user staked VLS", "user_address", userAddress, "delegatee", delegatee, "amount", amount, "error", err)

		return
	}
}

// AddPendingUnstake creates a new pending unstake document in the user's pendingUnstakes subcollection.
// This function is called when a BeginUnstake event is processed to track the unstaking operation
// until it can be completed after the cooldown period.
func AddPendingUnstake(client *firestore.Client, userAddress, delegatee, unstakeId string, amount, unlockAt int64) {
	ctx := context.Background()

	pendingUnstake := model.PendingUnstake{
		Amount:    amount,
		Delegatee: delegatee,
		UnlockAt:  time.Unix(unlockAt, 0),
	}

	_, err := client.Collection("users").Doc(userAddress).Collection("pendingUnstakes").Doc(unstakeId).Set(ctx, pendingUnstake)
	if err != nil {
		slog.Error("failed to create pending unstake", "user_address", userAddress, "delegatee", delegatee, "unstake_id", unstakeId, "error", err)
		return
	}

	slog.Info("created pending unstake", "user_address", userAddress, "delegatee", delegatee, "unstake_id", unstakeId, "amount", amount, "unlock_at", unlockAt)
}

// DeletePendingUnstakesByIDs deletes pending unstake documents by their IDs for a given user.
// Uses a transaction to delete all documents atomically.
func DeletePendingUnstakesByIDs(client *firestore.Client, userAddress string, unstakeIDs []string) {
	if len(unstakeIDs) == 0 {
		return
	}

	ctx := context.Background()
	sub := client.Collection("users").Doc(userAddress).Collection("pendingUnstakes")

	if err := client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		for _, id := range unstakeIDs {
			if err := tx.Delete(sub.Doc(id)); err != nil {
				return err
			}
		}
		slog.Info("deleted pending unstakes", "user_address", userAddress, "unstake_ids", unstakeIDs)
		return nil
	}); err != nil {
		slog.Error("failed to delete pending unstakes", "user_address", userAddress, "unstake_ids", unstakeIDs, "error", err)
		return
	}
}

// UpdateUserMarketSupply updates users/{addr}/markets/{marketId}.supply
// eventType: "Supply" adds, "Withdraw" subtracts.
func UpdateUserMarketSupply(client *firestore.Client, userAddress, marketID, amount, eventType string) {
	isAddition := eventType == "Supply"
	updateUserMarketAmount(client, userAddress, marketID, "supply", amount, "user supply update", isAddition)
}

// UpdateUserMarketLoan updates users/{addr}/markets/{marketId}.loan
// eventType: "Borrow" adds, "Repay" subtracts, "Liquidate" subtracts.
func UpdateUserMarketLoan(client *firestore.Client, userAddress, marketID, amount, eventType string) {
	isAddition := eventType == "Borrow"
	updateUserMarketAmount(client, userAddress, marketID, "loan", amount, "user loan update", isAddition)
}

// UpdateUserMarketCollateralSupply updates users/{addr}/markets/{marketId}.collateral_supply
// eventType: "SupplyCollateral" adds, "WithdrawCollateral" subtracts.
func UpdateUserMarketCollateralSupply(client *firestore.Client, userAddress, marketID, amount, eventType string) {
	isAddition := eventType == "SupplyCollateral"
	updateUserMarketAmount(client, userAddress, marketID, "collateral_supply", amount, "user collateral supply update", isAddition)
}

// updateUserMarketAmount updates a single numeric aggregate field under users/{addr}/markets/{marketId}
// using a Firestore transaction. Creates intermediate documents if missing.
func updateUserMarketAmount(client *firestore.Client, userAddress, marketID, fieldName, amount, contextStr string, isAddition bool) {
	ctx := context.Background()
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")

	delta := utils.ParseAmount(amount, contextStr)
	if delta.Sign() == 0 {
		return
	}

	userRef := client.Collection("users").Doc(userAddress)
	marketRef := userRef.Collection("markets").Doc(sanitizedMarketID)

	if err := client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		usnap, err := tx.Get(userRef)
		if err != nil {
			if status.Code(err) != codes.NotFound {
				return err
			}
		}

		msnap, err := tx.Get(marketRef)
		if err != nil {
			if status.Code(err) != codes.NotFound {
				return err
			}
		}

		current := GetAmountFromDoc(msnap, fieldName)
		updated := UpdateAmountInDoc(current, delta, isAddition)

		if usnap == nil || !usnap.Exists() {
			base := map[string]interface{}{
				"address":    userAddress,
				"dao_member": false,
				"created_at": time.Now(),
			}
			if err := tx.Set(userRef, base, firestore.MergeAll); err != nil {
				return err
			}
		}

		updates := map[string]interface{}{
			fieldName: updated,
		}
		return tx.Set(marketRef, updates, firestore.MergeAll)
	}); err != nil {
		slog.Error("failed to update user market amount", "user_address", userAddress, "market_id", marketID, "field", fieldName, "amount", amount, "is_addition", isAddition, "error", err)
		return
	}

	op := "-"
	if isAddition {
		op = "+"
	}
	slog.Info("updated user market aggregate", "operation", op, "field", fieldName, "amount", amount, "user_address", userAddress, "market_id", marketID)
}
