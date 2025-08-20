package dbupdater

import (
	"context"
	"log"
	"strconv"
	"time"
	"volos-backend/model"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
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

// AddVote stores an individual vote and updates aggregate counters transactionally.
// Safe under concurrency and handles users changing their vote/amount by applying deltas.
func AddVote(client *firestore.Client, proposalID, voter, voteChoice, reason, timestampStr string, xvlsAmount int64) error {
	ctx := context.Background()

	voteTimeUnix, err := strconv.ParseInt(timestampStr, 10, 64)
	if err != nil {
		log.Printf("Error parsing vote timestamp: %v", err)
		return err
	}
	voteTime := time.Unix(voteTimeUnix, 0)

	proposalRef := client.Collection("proposals").Doc(proposalID)
	voteDocRef := proposalRef.Collection("votes").Doc(voter)

	return client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		var prevChoice string
		var prevAmount int64
		vSnap, err := tx.Get(voteDocRef)
		if err != nil {
			if status.Code(err) != codes.NotFound {
				return err
			}
		} else if vSnap.Exists() {
			var existing model.VoteData
			if err := vSnap.DataTo(&existing); err == nil {
				prevChoice = existing.VoteChoice
				prevAmount = existing.XVLSAmount
			}
		}

		incYes, incNo, incAbstain, incTotal := int64(0), int64(0), int64(0), int64(0)
		switch prevChoice {
		case "YES":
			incYes -= prevAmount
		case "NO":
			incNo -= prevAmount
		case "ABSTAIN":
			incAbstain -= prevAmount
		}
		incTotal -= prevAmount

		switch voteChoice {
		case "YES":
			incYes += xvlsAmount
		case "NO":
			incNo += xvlsAmount
		case "ABSTAIN":
			incAbstain += xvlsAmount
		}
		incTotal += xvlsAmount

		updates := []firestore.Update{
			{Path: "last_vote", Value: voteTime},
		}
		if incYes != 0 {
			updates = append(updates, firestore.Update{Path: "yes_votes", Value: firestore.Increment(incYes)})
		}
		if incNo != 0 {
			updates = append(updates, firestore.Update{Path: "no_votes", Value: firestore.Increment(incNo)})
		}
		if incAbstain != 0 {
			updates = append(updates, firestore.Update{Path: "abstain_votes", Value: firestore.Increment(incAbstain)})
		}
		if incTotal != 0 {
			updates = append(updates, firestore.Update{Path: "total_votes", Value: firestore.Increment(incTotal)})
		}

		if len(updates) > 0 {
			if err := tx.Update(proposalRef, updates); err != nil {
				return err
			}
		}

		voteData := model.VoteData{
			ProposalID: proposalID,
			Voter:      voter,
			VoteChoice: voteChoice,
			Reason:     reason,
			XVLSAmount: xvlsAmount,
			Timestamp:  voteTime,
		}
		if err := tx.Set(voteDocRef, voteData); err != nil {
			return err
		}

		return nil
	})
}
