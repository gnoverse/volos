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

		yesVotes, noVotes, abstainVotes, totalVotes, err := calculateVoteTotals(client, proposal.ID)
		if err != nil {
			log.Printf("Error calculating vote totals for proposal %s: %v", proposal.ID, err)
			yesVotes, noVotes, abstainVotes, totalVotes = 0, 0, 0, 0
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
			"yes_votes":     yesVotes,
			"no_votes":      noVotes,
			"abstain_votes": abstainVotes,
			"total_votes":   totalVotes,
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

		yesVotes, noVotes, abstainVotes, totalVotes, err := calculateVoteTotals(client, proposal.ID)
		if err != nil {
			log.Printf("Error calculating vote totals for proposal %s: %v", proposal.ID, err)
			yesVotes, noVotes, abstainVotes, totalVotes = 0, 0, 0, 0
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
			"yes_votes":     yesVotes,
			"no_votes":      noVotes,
			"abstain_votes": abstainVotes,
			"total_votes":   totalVotes,
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

	yesVotes, noVotes, abstainVotes, totalVotes, err := calculateVoteTotals(client, proposal.ID)
	if err != nil {
		log.Printf("Error calculating vote totals for proposal %s: %v", proposal.ID, err)
		yesVotes, noVotes, abstainVotes, totalVotes = 0, 0, 0, 0
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
		"yes_votes":     yesVotes,
		"no_votes":      noVotes,
		"abstain_votes": abstainVotes,
		"total_votes":   totalVotes,
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

// calculateVoteTotals calculates vote totals using filtered queries for efficiency
// This approach fetches only the necessary fields instead of full documents
//
// todo: when firebase supports aggregation queries for go sdk, use those intead
func calculateVoteTotals(client *firestore.Client, proposalID string) (int64, int64, int64, int64, error) {
	ctx := context.Background()
	votesRef := client.Collection("proposals").Doc(proposalID).Collection("votes")

	yesQuery := votesRef.Where("vote_choice", "==", "YES").Select("xvls_amount")
	yesDocs, err := yesQuery.Documents(ctx).GetAll()
	if err != nil {
		log.Printf("Error fetching YES votes for proposal %s: %v", proposalID, err)
		return 0, 0, 0, 0, err
	}

	var yesVotes int64
	for _, doc := range yesDocs {
		if amount, ok := doc.Data()["xvls_amount"].(int64); ok {
			yesVotes += amount
		}
	}

	noQuery := votesRef.Where("vote_choice", "==", "NO").Select("xvls_amount")
	noDocs, err := noQuery.Documents(ctx).GetAll()
	if err != nil {
		log.Printf("Error fetching NO votes for proposal %s: %v", proposalID, err)
		return 0, 0, 0, 0, err
	}

	var noVotes int64
	for _, doc := range noDocs {
		if amount, ok := doc.Data()["xvls_amount"].(int64); ok {
			noVotes += amount
		}
	}

	abstainQuery := votesRef.Where("vote_choice", "==", "ABSTAIN").Select("xvls_amount")
	abstainDocs, err := abstainQuery.Documents(ctx).GetAll()
	if err != nil {
		log.Printf("Error fetching ABSTAIN votes for proposal %s: %v", proposalID, err)
		return 0, 0, 0, 0, err
	}

	var abstainVotes int64
	for _, doc := range abstainDocs {
		if amount, ok := doc.Data()["xvls_amount"].(int64); ok {
			abstainVotes += amount
		}
	}

	totalVotes := yesVotes + noVotes + abstainVotes
	return yesVotes, noVotes, abstainVotes, totalVotes, nil
}
