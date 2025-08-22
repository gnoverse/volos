package dbfetcher

import (
	"context"
	"log/slog"

	"volos-backend/model"

	"cloud.google.com/go/firestore"
)

// ProposalsResponse represents the response structure for proposal listings
type ProposalsResponse struct {
	Proposals []model.ProposalData `json:"proposals"`
	HasMore   bool                 `json:"has_more"`
	LastID    string               `json:"last_id"`
}

// GetProposals retrieves all proposals from Firestore with cursor-based pagination
func GetProposals(client *firestore.Client, limit int, lastDocID string) (*ProposalsResponse, error) {
	ctx := context.Background()

	query := client.Collection("proposals").OrderBy("created_at", firestore.Desc)

	if lastDocID != "" {
		lastDoc, err := client.Collection("proposals").Doc(lastDocID).Get(ctx)
		if err != nil {
			slog.Error("Error fetching last document for pagination", "last_doc_id", lastDocID, "error", err)
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
		slog.Error("Error fetching proposals", "limit", limit, "last_doc_id", lastDocID, "error", err)
		return nil, err
	}

	var proposals []model.ProposalData
	for _, doc := range docs {
		var proposal model.ProposalData
		if err := doc.DataTo(&proposal); err != nil {
			slog.Error("Error parsing proposal data", "doc_id", doc.Ref.ID, "error", err)
			continue
		}

		yesVotes, noVotes, abstainVotes, totalVotes, err := calculateVoteTotals(client, proposal.ID)
		if err != nil {
			slog.Error("Error calculating vote totals for proposal", "proposal_id", proposal.ID, "error", err)
			yesVotes, noVotes, abstainVotes, totalVotes = 0, 0, 0, 0
		}

		proposal.YesVotes = yesVotes
		proposal.NoVotes = noVotes
		proposal.AbstainVotes = abstainVotes
		proposal.TotalVotes = totalVotes

		proposals = append(proposals, proposal)
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
			slog.Error("Error fetching last document for pagination", "last_doc_id", lastDocID, "error", err)
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
		slog.Error("Error fetching active proposals", "limit", limit, "last_doc_id", lastDocID, "error", err)
		return nil, err
	}

	var proposals []model.ProposalData
	for _, doc := range docs {
		var proposal model.ProposalData
		if err := doc.DataTo(&proposal); err != nil {
			slog.Error("Error parsing proposal data", "doc_id", doc.Ref.ID, "error", err)
			continue
		}

		yesVotes, noVotes, abstainVotes, totalVotes, err := calculateVoteTotals(client, proposal.ID)
		if err != nil {
			slog.Error("Error calculating vote totals for proposal", "proposal_id", proposal.ID, "error", err)
			yesVotes, noVotes, abstainVotes, totalVotes = 0, 0, 0, 0
		}

		proposal.YesVotes = yesVotes
		proposal.NoVotes = noVotes
		proposal.AbstainVotes = abstainVotes
		proposal.TotalVotes = totalVotes

		proposals = append(proposals, proposal)
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
func GetProposal(client *firestore.Client, proposalID string) (*model.ProposalData, error) {
	ctx := context.Background()

	doc, err := client.Collection("proposals").Doc(proposalID).Get(ctx)
	if err != nil {
		slog.Error("Error fetching proposal", "proposal_id", proposalID, "error", err)
		return nil, err
	}

	var proposal model.ProposalData
	if err := doc.DataTo(&proposal); err != nil {
		slog.Error("Error parsing proposal data", "proposal_id", proposalID, "error", err)
		return nil, err
	}

	yesVotes, noVotes, abstainVotes, totalVotes, err := calculateVoteTotals(client, proposal.ID)
	if err != nil {
		slog.Error("Error calculating vote totals for proposal", "proposal_id", proposal.ID, "error", err)
		yesVotes, noVotes, abstainVotes, totalVotes = 0, 0, 0, 0
	}

	proposal.YesVotes = yesVotes
	proposal.NoVotes = noVotes
	proposal.AbstainVotes = abstainVotes
	proposal.TotalVotes = totalVotes

	return &proposal, nil
}

// GetProposalVotes retrieves all individual votes for a specific proposal from the votes subcollection
func GetProposalVotes(client *firestore.Client, proposalID string) ([]model.VoteData, error) {
	ctx := context.Background()

	docs, err := client.Collection("proposals").Doc(proposalID).Collection("votes").Documents(ctx).GetAll()
	if err != nil {
		slog.Error("Error fetching votes for proposal", "proposal_id", proposalID, "error", err)
		return nil, err
	}

	var votes []model.VoteData
	for _, doc := range docs {
		var vote model.VoteData
		if err := doc.DataTo(&vote); err != nil {
			slog.Error("Error parsing vote data", "proposal_id", proposalID, "vote_doc_id", doc.Ref.ID, "error", err)
			continue
		}
		votes = append(votes, vote)
	}

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
		slog.Error("Error fetching user vote for proposal", "proposal_id", proposalID, "user_address", userAddress, "error", err)
		return nil, err
	}

	var vote model.VoteData
	if err := doc.DataTo(&vote); err != nil {
		slog.Error("Error parsing user vote data", "proposal_id", proposalID, "user_address", userAddress, "error", err)
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
