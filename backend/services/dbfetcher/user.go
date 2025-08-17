package dbfetcher

import (
	"context"
	"log"

	"volos-backend/model"

	"cloud.google.com/go/firestore"
)

// UserResponse represents the user data response structure
type UserResponse struct {
	Address   string      `json:"address"`
	DAOMember bool        `json:"dao_member"`
	CreatedAt interface{} `json:"created_at"`
}

// GetUser retrieves user data from Firestore by user address
func GetUser(client *firestore.Client, userAddress string) (*UserResponse, error) {
	ctx := context.Background()

	doc, err := client.Collection("users").Doc(userAddress).Get(ctx)
	if err != nil {
		// If user doesn't exist, return default user data - failsafe
		if err.Error() == "not found" {
			return &UserResponse{
				Address:   userAddress,
				DAOMember: false,
				CreatedAt: nil,
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

	return &UserResponse{
		Address:   user.Address,
		DAOMember: user.DAOMember,
		CreatedAt: user.CreatedAt,
	}, nil
}
