package dbfetcher

import (
	"context"
	"encoding/json"
	"log"

	"volos-backend/model"

	"cloud.google.com/go/firestore"
)

// GetUser retrieves user data from Firestore by user address
func GetUser(client *firestore.Client, userAddress string) (string, error) {
	ctx := context.Background()

	doc, err := client.Collection("users").Doc(userAddress).Get(ctx)
	if err != nil {
		// If user doesn't exist, return default user data - failsafe
		if err.Error() == "not found" {
			defaultUser := map[string]interface{}{
				"address":    userAddress,
				"dao_member": false,
				"created_at": nil,
			}
			jsonData, _ := json.Marshal(defaultUser)
			return string(jsonData), nil
		}
		log.Printf("Error fetching user %s: %v", userAddress, err)
		return "", err
	}

	var user model.UserData
	if err := doc.DataTo(&user); err != nil {
		log.Printf("Error parsing user data: %v", err)
		return "", err
	}

	userMap := map[string]interface{}{
		"address":    user.Address,
		"dao_member": user.DAOMember,
		"created_at": user.CreatedAt,
	}

	jsonData, err := json.Marshal(userMap)
	if err != nil {
		log.Printf("Error marshaling user to JSON: %v", err)
		return "", err
	}

	return string(jsonData), nil
}
