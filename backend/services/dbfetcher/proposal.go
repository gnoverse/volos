package dbfetcher

import (
	"context"
	"log"

	"volos-backend/model"

	"cloud.google.com/go/firestore"
)

// ProposalsResponse represents the response structure for proposal listings
type ProposalsResponse struct {
	Proposals []map[string]interface{} `json:"proposals"`
	HasMore   bool                     `json:"has_more"`
	LastID    string                   `json:"last_id"`
}

// GetProposals retrieves all proposals from Firestore with cursor-based pagination
func GetProposals(client *firestore.Client, limit int, lastDocID string) (*ProposalsResponse, error) {
	ctx := context.Background()

	query := client.Collection("proposals").OrderBy("created_at", firestore.Desc)

	if lastDocID != "" {
		lastDoc, err := client.Collection("proposals").Doc(lastDocID).Get(ctx)
		if err != nil {
			log.Printf("Error fetching last document for pagination: %v", err)
			return nil, err
		}
		query = query.StartAfter(lastDoc)
	}

	if limit > 0 {
		query = query.Limit(limit)
	} else {
		query = query.Limit(20)
	}

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		log.Printf("Error fetching proposals: %v", err)
		return nil, err
	}

	var proposals []map[string]interface{}
	for _, doc := range docs {
		var proposal model.ProposalData
		if err := doc.DataTo(&proposal); err != nil {
			log.Printf("Error parsing proposal data: %v", err)
			continue
		}

		proposalMap := map[string]interface{}{
			"id":            proposal.ID,
			"title":         proposal.Title,
			"body":          proposal.Body,
			"proposer":      proposal.Proposer,
			"deadline":      proposal.Deadline,
			"status":        proposal.Status,
			"created_at":    proposal.CreatedAt,
			"last_vote":     proposal.LastVote,
			"yes_votes":     proposal.YesVotes,
			"no_votes":      proposal.NoVotes,
			"abstain_votes": proposal.AbstainVotes,
			"total_votes":   proposal.TotalVotes,
			"quorum":        proposal.Quorum,
		}

		proposals = append(proposals, proposalMap)
	}

	response := &ProposalsResponse{
		Proposals: proposals,
		HasMore:   len(docs) == limit,
		LastID:    "",
	}

	if len(docs) > 0 {
		response.LastID = docs[len(docs)-1].Ref.ID
	}

	return response, nil
}

// GetActiveProposals retrieves only active proposals from Firestore with cursor-based pagination
func GetActiveProposals(client *firestore.Client, limit int, lastDocID string) (*ProposalsResponse, error) {
	ctx := context.Background()
	query := client.Collection("proposals").Where("status", "==", "active").OrderBy("created_at", firestore.Desc)

	if lastDocID != "" {
		lastDoc, err := client.Collection("proposals").Doc(lastDocID).Get(ctx)
		if err != nil {
			log.Printf("Error fetching last document for pagination: %v", err)
			return nil, err
		}
		query = query.StartAfter(lastDoc)
	}

	if limit > 0 {
		query = query.Limit(limit)
	} else {
		query = query.Limit(20)
	}

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		log.Printf("Error fetching active proposals: %v", err)
		return nil, err
	}

	var proposals []map[string]interface{}
	for _, doc := range docs {
		var proposal model.ProposalData
		if err := doc.DataTo(&proposal); err != nil {
			log.Printf("Error parsing proposal data: %v", err)
			continue
		}

		proposalMap := map[string]interface{}{
			"id":            proposal.ID,
			"title":         proposal.Title,
			"body":          proposal.Body,
			"proposer":      proposal.Proposer,
			"deadline":      proposal.Deadline,
			"status":        proposal.Status,
			"created_at":    proposal.CreatedAt,
			"last_vote":     proposal.LastVote,
			"yes_votes":     proposal.YesVotes,
			"no_votes":      proposal.NoVotes,
			"abstain_votes": proposal.AbstainVotes,
			"total_votes":   proposal.TotalVotes,
			"quorum":        proposal.Quorum,
		}

		proposals = append(proposals, proposalMap)
	}

	response := &ProposalsResponse{
		Proposals: proposals,
		HasMore:   len(docs) == limit,
		LastID:    "",
	}

	if len(docs) > 0 {
		response.LastID = docs[len(docs)-1].Ref.ID
	}

	return response, nil
}

// GetProposal retrieves a single proposal by ID from Firestore
func GetProposal(client *firestore.Client, proposalID string) (map[string]interface{}, error) {
	ctx := context.Background()

	doc, err := client.Collection("proposals").Doc(proposalID).Get(ctx)
	if err != nil {
		log.Printf("Error fetching proposal %s: %v", proposalID, err)
		return nil, err
	}

	var proposal model.ProposalData
	if err := doc.DataTo(&proposal); err != nil {
		log.Printf("Error parsing proposal data: %v", err)
		return nil, err
	}

	proposalMap := map[string]interface{}{
		"id":            proposal.ID,
		"title":         proposal.Title,
		"body":          proposal.Body,
		"proposer":      proposal.Proposer,
		"deadline":      proposal.Deadline,
		"status":        proposal.Status,
		"created_at":    proposal.CreatedAt,
		"last_vote":     proposal.LastVote,
		"yes_votes":     proposal.YesVotes,
		"no_votes":      proposal.NoVotes,
		"abstain_votes": proposal.AbstainVotes,
		"total_votes":   proposal.TotalVotes,
		"quorum":        proposal.Quorum,
	}

	return proposalMap, nil
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
