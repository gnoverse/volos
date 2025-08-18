package dbfetcher

import (
	"context"
	"log"
	"time"

	"volos-backend/model"

	"cloud.google.com/go/firestore"
)

// GetUser retrieves user data from Firestore by user address
func GetUser(client *firestore.Client, userAddress string) (*model.UserData, error) {
	ctx := context.Background()

	doc, err := client.Collection("users").Doc(userAddress).Get(ctx)
	if err != nil {
		// If user doesn't exist, return default user data - failsafe
		if err.Error() == "not found" {
			return &model.UserData{
				Address:   userAddress,
				DAOMember: false,
				CreatedAt: time.Time{},
			}, nil
		}
		log.Printf("Error fetching user %s: %v", userAddress, err)
		return nil, err
	}

	var user model.UserData
	if err := doc.DataTo(&user); err != nil {
		log.Printf("Error parsing user data: %v", err)
		return nil, err
	}

	return &user, nil
}
