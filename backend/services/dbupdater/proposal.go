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
		ID:           proposalID,
		Title:        title,
		Body:         body,
		Proposer:     proposer,
		Deadline:     deadline,
		Status:       "active",
		CreatedAt:    createdAt,
		LastVote:     createdAt, // Initialize LastVote to creation time
		YesVotes:     0,
		NoVotes:      0,
		AbstainVotes: 0,
		TotalVotes:   0,
		Quorum:       quorum,
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

// AddVote updates the proposal with a new vote, recalculates vote totals, and stores individual vote in subcollection
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

	// Use voter address as document ID to ensure one vote per user per proposal
	voteDocRef := client.Collection("proposals").Doc(proposalID).Collection("votes").Doc(voter)

	existingVote, err := voteDocRef.Get(ctx)
	if err != nil && !existingVote.Exists() {
		// No existing vote, proceed normally
	} else if existingVote.Exists() {
		// User has already voted, we need to subtract their previous vote from totals
		var previousVote model.VoteData
		if err := existingVote.DataTo(&previousVote); err != nil {
			log.Printf("Error parsing previous vote data: %v", err)
			return err
		}

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

		switch previousVote.VoteChoice {
		case "YES":
			proposal.YesVotes -= previousVote.XVLSAmount
		case "NO":
			proposal.NoVotes -= previousVote.XVLSAmount
		case "ABSTAIN":
			proposal.AbstainVotes -= previousVote.XVLSAmount
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
		proposal.LastVote = voteTime

		_, err = client.Collection("proposals").Doc(proposalID).Set(ctx, proposal)
		if err != nil {
			log.Printf("Error updating proposal with vote: %v", err)
			return err
		}

		_, err = voteDocRef.Set(ctx, voteData)
		if err != nil {
			log.Printf("Error updating vote document: %v", err)
			return err
		}

		log.Printf("Successfully updated vote for proposal %s: %s changed vote to %s with %d xVLS", proposalID, voter, voteChoice, xvlsAmount)
		return nil
	}

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
	proposal.LastVote = voteTime

	// Use a transaction to ensure both proposal and vote are updated atomically
	err = client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		proposalRef := client.Collection("proposals").Doc(proposalID)
		if err := tx.Set(proposalRef, proposal); err != nil {
			return fmt.Errorf("failed to update proposal: %v", err)
		}

		if err := tx.Set(voteDocRef, voteData); err != nil {
			return fmt.Errorf("failed to create vote document: %v", err)
		}

		return nil
	})

	if err != nil {
		log.Printf("Error in transaction for proposal %s: %v", proposalID, err)
		return err
	}

	log.Printf("Successfully added vote for proposal %s: %s voted %s with %d xVLS", proposalID, voter, voteChoice, xvlsAmount)
	return nil
}

// GetProposalVotes retrieves all individual votes for a specific proposal from the votes subcollection
func GetProposalVotes(client *firestore.Client, proposalID string) ([]model.VoteData, error) {
	ctx := context.Background()

	docs, err := client.Collection("proposals").Doc(proposalID).Collection("votes").Documents(ctx).GetAll()
	if err != nil {
		log.Printf("Error fetching votes for proposal %s: %v", proposalID, err)
		return nil, err
	}

	var votes []model.VoteData
	for _, doc := range docs {
		var vote model.VoteData
		if err := doc.DataTo(&vote); err != nil {
			log.Printf("Error parsing vote data: %v", err)
			continue
		}
		votes = append(votes, vote)
	}

	log.Printf("Successfully fetched %d votes for proposal %s", len(votes), proposalID)
	return votes, nil
}

// GetUserVoteOnProposal retrieves a specific user's vote on a proposal, returns nil if no vote exists
func GetUserVoteOnProposal(client *firestore.Client, proposalID, userAddress string) (*model.VoteData, error) {
	ctx := context.Background()

	doc, err := client.Collection("proposals").Doc(proposalID).Collection("votes").Doc(userAddress).Get(ctx)
	if err != nil {
		if doc != nil && !doc.Exists() {
			// User hasn't voted on this proposal
			return nil, nil
		}
		log.Printf("Error fetching user vote for proposal %s, user %s: %v", proposalID, userAddress, err)
		return nil, err
	}

	var vote model.VoteData
	if err := doc.DataTo(&vote); err != nil {
		log.Printf("Error parsing user vote data: %v", err)
		return nil, err
	}

	return &vote, nil
}
