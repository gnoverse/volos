package routes

import (
	"encoding/json"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"volos-backend/services/dbfetcher"

	"cloud.google.com/go/firestore"
)

// GetMarketsHandler handles GET /markets - returns all markets with cursor-based pagination
func GetMarketsHandler(client *firestore.Client) http.HandlerFunc {
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

		markets, err := dbfetcher.GetMarkets(client, limit, lastID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(markets)
	}
}

// GetMarketHandler handles GET /market/{id} - returns a single market by ID
func GetMarketHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		const prefix = "/api/market/"
		path := r.URL.Path
		if !strings.HasPrefix(path, prefix) || len(path) <= len(prefix) {
			http.Error(w, "Market ID is required", http.StatusBadRequest)
			return
		}

		rawID := path[len(prefix):]
		marketID, err := url.PathUnescape(rawID)
		if err != nil || marketID == "" {
			http.Error(w, "Invalid market ID", http.StatusBadRequest)
			return
		}

		market, err := dbfetcher.GetMarket(client, marketID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(market)
	}
}
