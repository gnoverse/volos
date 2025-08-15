package dbupdater

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"
	"volos-backend/model"

	"cloud.google.com/go/firestore"
)

func CreateProposal(client *firestore.Client, proposalID, title, body, proposer, deadlineStr, thresholdStr string) error {
	ctx := context.Background()

	deadlineUnix, err := strconv.ParseInt(deadlineStr, 10, 64)
	if err != nil {
		log.Printf("Error parsing deadline timestamp: %v", err)
		return err
	}
	deadline := time.Unix(deadlineUnix, 0)

	threshold, err := strconv.ParseInt(thresholdStr, 10, 64)
	if err != nil {
		log.Printf("Error parsing threshold: %v", err)
		return err
	}

	now := time.Now()

	proposal := model.ProposalData{
		ID:           proposalID,
		Title:        title,
		Body:         body,
		Proposer:     proposer,
		Deadline:     deadline,
		Status:       "active",
		CreatedAt:    now,
		LastVote:     now,
		YesVotes:     0,
		NoVotes:      0,
		AbstainVotes: 0,
		TotalVotes:   0,
		Threshold:    threshold,
	}

	_, err = client.Collection("proposals").Doc(proposalID).Set(ctx, proposal)
	if err != nil {
		log.Printf("Error writing proposal to Firestore: %v", err)
		return err
	}

	log.Printf("Successfully created proposal %s in Firestore", proposalID)
	return nil
}

// UpdateProposal updates specific fields of a proposal in Firestore.
// Only the provided fields will be updated, leaving other fields unchanged.
func UpdateProposal(client *firestore.Client, proposalID string, updates map[string]interface{}) error {
	ctx := context.Background()

	var firestoreUpdates []firestore.Update
	for field, value := range updates {
		firestoreUpdates = append(firestoreUpdates, firestore.Update{
			Path:  field,
			Value: value,
		})
	}

	_, err := client.Collection("proposals").Doc(proposalID).Update(ctx, firestoreUpdates)
	if err != nil {
		log.Printf("Error updating proposal %s in Firestore: %v", proposalID, err)
		return err
	}

	log.Printf("Successfully updated proposal %s in Firestore", proposalID)
	return nil
}

// AddVote updates the proposal with a new vote and recalculates vote totals
func AddVote(client *firestore.Client, proposalID, voter, voteChoice, reason string, xvlsAmount int64) error {
	ctx := context.Background()

	doc, err := client.Collection("proposals").Doc(proposalID).Get(ctx)
	if err != nil {
		log.Printf("Error fetching proposal %s: %v", proposalID, err)
		return err
	}

	var proposal model.ProposalData
	if err := doc.DataTo(&proposal); err != nil {
		log.Printf("Error parsing proposal data: %v", err)
		return err
	}

	switch voteChoice {
	case "YES":
		proposal.YesVotes += xvlsAmount
	case "NO":
		proposal.NoVotes += xvlsAmount
	case "ABSTAIN":
		proposal.AbstainVotes += xvlsAmount
	default:
		log.Printf("Unknown vote choice: %s", voteChoice)
		return fmt.Errorf("unknown vote choice: %s", voteChoice)
	}

	proposal.TotalVotes = proposal.YesVotes + proposal.NoVotes + proposal.AbstainVotes
	proposal.LastVote = time.Now()

	_, err = client.Collection("proposals").Doc(proposalID).Set(ctx, proposal)
	if err != nil {
		log.Printf("Error updating proposal with vote: %v", err)
		return err
	}

	log.Printf("Successfully added vote for proposal %s: %s voted %s with %d xVLS", proposalID, voter, voteChoice, xvlsAmount)
	return nil
}
