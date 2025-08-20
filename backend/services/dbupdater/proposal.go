package dbupdater

import (
	"context"
	"log"
	"strconv"
	"time"
	"volos-backend/model"

	"cloud.google.com/go/firestore"
)

// CreateProposal creates a new proposal in the Firestore database
func CreateProposal(client *firestore.Client, proposalID, title, body, proposer, deadlineStr, quorumStr, timestampStr string) error {
	ctx := context.Background()

	deadlineUnix, err := strconv.ParseInt(deadlineStr, 10, 64)
	if err != nil {
		log.Printf("Error parsing deadline timestamp: %v", err)
		return err
	}
	deadline := time.Unix(deadlineUnix, 0)

	quorum, err := strconv.ParseInt(quorumStr, 10, 64)
	if err != nil {
		log.Printf("Error parsing quorum: %v", err)
		return err
	}

	createdAtUnix, err := strconv.ParseInt(timestampStr, 10, 64)
	if err != nil {
		log.Printf("Error parsing created timestamp: %v", err)
		return err
	}
	createdAt := time.Unix(createdAtUnix, 0)

	proposal := model.ProposalData{
		ID:        proposalID,
		Title:     title,
		Body:      body,
		Proposer:  proposer,
		Deadline:  deadline,
		Status:    "active",
		CreatedAt: createdAt,
		LastVote:  createdAt,
		Quorum:    quorum,
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

// AddVote stores an individual vote in the votes subcollection and updates the proposal's LastVote timestamp.
// Vote totals are calculated on-demand from the votes subcollection to avoid write conflicts.
func AddVote(client *firestore.Client, proposalID, voter, voteChoice, reason, timestampStr string, xvlsAmount int64) error {
	ctx := context.Background()

	voteTimeUnix, err := strconv.ParseInt(timestampStr, 10, 64)
	if err != nil {
		log.Printf("Error parsing vote timestamp: %v", err)
		return err
	}
	voteTime := time.Unix(voteTimeUnix, 0)

	voteData := model.VoteData{
		ProposalID: proposalID,
		Voter:      voter,
		VoteChoice: voteChoice,
		Reason:     reason,
		XVLSAmount: xvlsAmount,
		Timestamp:  voteTime,
	}

	voteDocRef := client.Collection("proposals").Doc(proposalID).Collection("votes").Doc(voter)

	existingVote, err := voteDocRef.Get(ctx)
	if err != nil && !existingVote.Exists() {
		// No existing vote, proceed normally
	} else if existingVote.Exists() {
		log.Printf("User %s has already voted on proposal %s, updating their vote", voter, proposalID)
	}

	_, err = voteDocRef.Set(ctx, voteData)
	if err != nil {
		log.Printf("Error updating vote document: %v", err)
		return err
	}

	proposalRef := client.Collection("proposals").Doc(proposalID)
	_, err = proposalRef.Update(ctx, []firestore.Update{
		{Path: "last_vote", Value: voteTime},
	})
	if err != nil {
		log.Printf("Error updating proposal last_vote timestamp: %v", err)
		// Don't fail the entire operation if this update fails
	}

	log.Printf("Successfully added vote for proposal %s: %s voted %s with %d xVLS", proposalID, voter, voteChoice, xvlsAmount)
	return nil
}
