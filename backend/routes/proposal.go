package routes

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"volos-backend/services/dbfetcher"

	"cloud.google.com/go/firestore"
)

// GetProposalsHandler handles GET /proposals - returns all proposals with cursor-based pagination
func GetProposalsHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		limitStr := r.URL.Query().Get("limit")
		limit := 0
		if limitStr != "" {
			if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
				limit = parsedLimit
			}
		}

		lastID := r.URL.Query().Get("last_id")

		proposals, err := dbfetcher.GetProposals(client, limit, lastID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(proposals)
	}
}

// GetActiveProposalsHandler handles GET /proposals/active - returns only active proposals with cursor-based pagination
func GetActiveProposalsHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		limitStr := r.URL.Query().Get("limit")
		limit := 0
		if limitStr != "" {
			if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
				limit = parsedLimit
			}
		}

		lastID := r.URL.Query().Get("last_id")

		proposals, err := dbfetcher.GetActiveProposals(client, limit, lastID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(proposals)
	}
}

// GetProposalHandler handles GET /proposals/{id} - returns a single proposal by ID
func GetProposalHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		// Parse proposal ID from URL path
		// Expected path: /api/proposals/{id}
		pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
		if len(pathParts) < 3 || pathParts[0] != "api" || pathParts[1] != "proposal" {
			http.Error(w, "Invalid URL path", http.StatusBadRequest)
			return
		}

		proposalID := pathParts[2]
		if proposalID == "" || proposalID == "active" {
			http.Error(w, "Proposal ID is required", http.StatusBadRequest)
			return
		}

		proposal, err := dbfetcher.GetProposal(client, proposalID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(proposal)
	}
}
