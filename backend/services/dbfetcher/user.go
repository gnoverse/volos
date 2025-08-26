package dbfetcher

import (
	"context"
	"time"

	"volos-backend/model"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
)

// GetUser retrieves user data from Firestore by user address
func GetUser(client *firestore.Client, userAddress string) (*model.User, error) {
	ctx := context.Background()

	doc, err := client.Collection("users").Doc(userAddress).Get(ctx)
	if err != nil {
		// If user doesn't exist, return default user data - failsafe
		if err.Error() == "not found" {
			return &model.User{
				Address:   userAddress,
				DAOMember: false,
				StakedVLS: make(map[string]int64),
				CreatedAt: time.Time{},
			}, nil
		}
		return nil, err
	}

	var user model.User
	if err := doc.DataTo(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

// GetUserPendingUnstakes retrieves all pending unstake documents from a user's pendingUnstakes subcollection
func GetUserPendingUnstakes(client *firestore.Client, userAddress string) ([]model.PendingUnstake, error) {
	ctx := context.Background()

	var pendingUnstakes []model.PendingUnstake

	iter := client.Collection("users").Doc(userAddress).Collection("pendingUnstakes").Documents(ctx)
	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		var pendingUnstake model.PendingUnstake
		if err := doc.DataTo(&pendingUnstake); err != nil {
			continue
		}

		pendingUnstakes = append(pendingUnstakes, pendingUnstake)
	}

	return pendingUnstakes, nil
}

// GetUserBorrowRepayHistory retrieves all borrow/repay events for a user across all markets
// Returns value-timestamp objects suitable for charting
func GetUserBorrowRepayHistory(client *firestore.Client, userAddress string) ([]model.UserLoan, error) {
	ctx := context.Background()
	var results []model.UserLoan

	// Get all markets
	marketsIter := client.Collection("markets").Documents(ctx)
	defer marketsIter.Stop()

	for {
		marketDoc, err := marketsIter.Next()
		if err != nil {
			break
		}

		marketID := marketDoc.Ref.ID

		// Query market_history subcollection for this user's borrow/repay events
		query := client.Collection("markets").Doc(marketID).Collection("market_history").
			Where("caller", "==", userAddress).
			Where("event_type", "in", []string{"Borrow", "Repay"})

		historyIter := query.Documents(ctx)
		defer historyIter.Stop()

		for {
			historyDoc, err := historyIter.Next()
			if err != nil {
				break
			}

			var history model.MarketHistory
			if err := historyDoc.DataTo(&history); err != nil {
				continue
			}

			// Convert uint256 string value to float64 for charting
			amount := utils.ParseAmount(history.Value, "GetUserBorrowRepayHistory")
			if amount.Sign() == 0 {
				continue // Skip invalid values
			}

			// Convert to chart point
			point := model.UserLoan{
				Value:     float64(amount.Int64()),
				Timestamp: history.Timestamp,
				MarketID:  marketID,
				EventType: history.EventType,
				Operation: history.Operation,
			}

			results = append(results, point)
		}
	}

	return results, nil
}
