package dbupdater

import (
	"context"
	"log/slog"
	"time"
	"volos-backend/model"

	"cloud.google.com/go/firestore"
)

// SetDAOMemberStatus updates the DAO membership status for a user
func SetDAOMemberStatus(client *firestore.Client, userAddress string, isMember bool) error {
	ctx := context.Background()

	_, err := client.Collection("users").Doc(userAddress).Get(ctx)
	userExists := err == nil

	now := time.Now()
	user := model.UserData{
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
		slog.Error("Error updating DAO member status",
			"user_address", userAddress,
			"is_member", isMember,
			"error", err,
		)
		return err
	}

	status := "added to"
	if !isMember {
		status = "removed from"
	}
	slog.Info("Successfully updated DAO membership",
		"user_address", userAddress,
		"action", status,
		"dao", "DAO",
	)
	return nil
}

// AddDAOMember adds a user to the DAO by setting dao_member to true
func AddDAOMember(client *firestore.Client, userAddress string) error {
	return SetDAOMemberStatus(client, userAddress, true)
}

// RemoveDAOMember removes a user from the DAO by setting dao_member to false
func RemoveDAOMember(client *firestore.Client, userAddress string) error {
	return SetDAOMemberStatus(client, userAddress, false)
}

// UpdateUserStakedVLS updates the staked VLS delegation map for a user.
// This function maintains a mapping of delegatee addresses to staked VLS amounts,
// keeping the database in sync with the on-chain AVL tree that tracks the same delegation data.
// The staked_vls field maps delegatee addresses to VLS token amounts. Positive amounts
// represent staking operations while negative amounts represent unstaking. Delegatee
// entries are removed when amounts reach zero or become negative.
func UpdateUserStakedVLS(client *firestore.Client, userAddress, delegatee string, amount int64, timestamp int64) error {
	ctx := context.Background()

	userRef := client.Collection("users").Doc(userAddress)
	doc, err := userRef.Get(ctx)

	var user model.UserData
	userExists := err == nil

	if userExists {
		if err := doc.DataTo(&user); err != nil {
			slog.Error("Error parsing user data",
				"user_address", userAddress,
				"error", err,
			)
			return err
		}
	} else {
		user = model.UserData{
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
		slog.Info("Removed delegation",
			"user_address", userAddress,
			"delegatee", delegatee,
			"final_amount", newAmount,
		)
	} else {
		user.StakedVLS[delegatee] = newAmount
		slog.Info("Updated delegation",
			"user_address", userAddress,
			"delegatee", delegatee,
			"new_amount", newAmount,
			"amount_change", amount,
		)
	}

	_, err = userRef.Set(ctx, user)
	if err != nil {
		slog.Error("Error updating staked VLS for user",
			"user_address", userAddress,
			"delegatee", delegatee,
			"error", err,
		)
		return err
	}

	return nil
}

// AddPendingUnstake creates a new pending unstake document in the user's pendingUnstakes subcollection.
// This function is called when a BeginUnstake event is processed to track the unstaking operation
// until it can be completed after the cooldown period.
func AddPendingUnstake(client *firestore.Client, userAddress, delegatee, unstakeId string, amount, unlockAt int64) error {
	ctx := context.Background()

	pendingUnstake := model.PendingUnstakeData{
		Amount:    amount,
		Delegatee: delegatee,
		UnlockAt:  time.Unix(unlockAt, 0),
	}

	_, err := client.Collection("users").Doc(userAddress).Collection("pendingUnstakes").Doc(unstakeId).Set(ctx, pendingUnstake)
	if err != nil {
		slog.Error("Error creating pending unstake",
			"user_address", userAddress,
			"delegatee", delegatee,
			"unstake_id", unstakeId,
			"amount", amount,
			"unlock_at", unlockAt,
			"error", err,
		)
		return err
	}

	slog.Info("Created pending unstake",
		"user_address", userAddress,
		"delegatee", delegatee,
		"unstake_id", unstakeId,
		"amount", amount,
		"unlock_at", unlockAt,
	)
	return nil
}

// DeletePendingUnstakesByIDs deletes pending unstake documents by their IDs for a given user.
// Uses a transaction to delete all documents atomically.
func DeletePendingUnstakesByIDs(client *firestore.Client, userAddress string, unstakeIDs []string) error {
	if len(unstakeIDs) == 0 {
		return nil
	}

	ctx := context.Background()
	sub := client.Collection("users").Doc(userAddress).Collection("pendingUnstakes")

	return client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		for _, id := range unstakeIDs {
			if err := tx.Delete(sub.Doc(id)); err != nil {
				return err
			}
		}
		slog.Info("Deleted pending unstakes",
			"user_address", userAddress,
			"unstake_ids", unstakeIDs,
		)
		return nil
	})
}
