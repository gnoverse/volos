package dbfetcher

import (
	"context"
	"time"

	"volos-backend/model"

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
