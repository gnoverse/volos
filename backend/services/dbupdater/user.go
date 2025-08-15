package dbupdater

import (
	"context"
	"log"
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
		log.Printf("Error updating DAO member status for user %s: %v", userAddress, err)
		return err
	}

	status := "added to"
	if !isMember {
		status = "removed from"
	}
	log.Printf("Successfully %s DAO for user %s", status, userAddress)
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
