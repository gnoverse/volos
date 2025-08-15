package routes

import (
	"net/http"
	"strconv"
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

		jsonData, err := dbfetcher.GetProposals(client, limit, lastID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Write([]byte(jsonData))
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

		jsonData, err := dbfetcher.GetActiveProposals(client, limit, lastID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Write([]byte(jsonData))
	}
}
