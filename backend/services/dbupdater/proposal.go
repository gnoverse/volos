package dbupdater

import (
	"context"
	"log"
	"strconv"
	"time"
	"volos-backend/model"

	"cloud.google.com/go/firestore"
)

func CreateProposal(client *firestore.Client, proposalID, title, body, caller, deadlineStr string) error {
	ctx := context.Background()

	deadlineUnix, err := strconv.ParseInt(deadlineStr, 10, 64)
	if err != nil {
		log.Printf("Error parsing deadline timestamp: %v", err)
		return err
	}
	deadline := time.Unix(deadlineUnix, 0)

	now := time.Now()

	proposal := model.ProposalData{
		ID:           proposalID,
		Title:        title,
		Body:         body,
		Caller:       caller,
		Deadline:     deadline,
		Status:       "active", 
		CreatedAt:    now,
		UpdatedAt:    now,
		YesVotes:     0,
		NoVotes:      0,
		AbstainVotes: 0,
		TotalVotes:   0,
	}

	_, err = client.Collection("proposals").Doc(proposalID).Set(ctx, proposal)
	if err != nil {
		log.Printf("Error writing proposal to Firestore: %v", err)
		return err
	}

	log.Printf("Successfully created proposal %s in Firestore", proposalID)
	return nil
}
