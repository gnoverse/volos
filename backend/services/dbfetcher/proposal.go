package dbfetcher

import (
	"context"
	"encoding/json"
	"log"

	"volos-backend/model"

	"cloud.google.com/go/firestore"
)

// GetProposals retrieves all proposals from Firestore with cursor-based pagination
func GetProposals(client *firestore.Client, limit int, lastDocID string) (string, error) {
	ctx := context.Background()

	query := client.Collection("proposals").OrderBy("created_at", firestore.Desc)

	if lastDocID != "" {
		lastDoc, err := client.Collection("proposals").Doc(lastDocID).Get(ctx)
		if err != nil {
			log.Printf("Error fetching last document for pagination: %v", err)
			return "", err
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
		return "", err
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
		}

		proposals = append(proposals, proposalMap)
	}

	response := map[string]interface{}{
		"proposals": proposals,
		"has_more":  len(docs) == limit,
		"last_id":   "",
	}

	if len(docs) > 0 {
		response["last_id"] = docs[len(docs)-1].Ref.ID
	}

	jsonData, err := json.Marshal(response)
	if err != nil {
		log.Printf("Error marshaling proposals to JSON: %v", err)
		return "", err
	}

	return string(jsonData), nil
}

// GetActiveProposals retrieves only active proposals from Firestore with cursor-based pagination
func GetActiveProposals(client *firestore.Client, limit int, lastDocID string) (string, error) {
	ctx := context.Background()
	query := client.Collection("proposals").Where("status", "==", "active").OrderBy("created_at", firestore.Desc)

	if lastDocID != "" {
		lastDoc, err := client.Collection("proposals").Doc(lastDocID).Get(ctx)
		if err != nil {
			log.Printf("Error fetching last document for pagination: %v", err)
			return "", err
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
		return "", err
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
		}

		proposals = append(proposals, proposalMap)
	}

	response := map[string]interface{}{
		"proposals": proposals,
		"has_more":  len(docs) == limit,
		"last_id":   "",
	}

	if len(docs) > 0 {
		response["last_id"] = docs[len(docs)-1].Ref.ID
	}

	jsonData, err := json.Marshal(response)
	if err != nil {
		log.Printf("Error marshaling active proposals to JSON: %v", err)
		return "", err
	}

	return string(jsonData), nil
}
