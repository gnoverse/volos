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

// GetMarketAPRHistoryHandler handles GET /market/apr?marketId=ID&startTime=X&endTime=Y - returns APR history for a specific market
func GetMarketAPRHistoryHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		marketID := r.URL.Query().Get("marketId")
		if marketID == "" {
			http.Error(w, "marketId query parameter is required", http.StatusBadRequest)
			return
		}

		startTimeStr := r.URL.Query().Get("startTime")
		endTimeStr := r.URL.Query().Get("endTime")

		aprHistory, err := dbfetcher.GetMarketAPRHistory(client, marketID, startTimeStr, endTimeStr)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(aprHistory)
	}
}

// GetMarketTotalBorrowHistoryHandler handles GET /market/total-borrow-history?marketId=ID&startTime=X&endTime=Y - returns total borrow history for a specific market
func GetMarketTotalBorrowHistoryHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		marketID := r.URL.Query().Get("marketId")
		if marketID == "" {
			http.Error(w, "marketId query parameter is required", http.StatusBadRequest)
			return
		}

		startTimeStr := r.URL.Query().Get("startTime")
		endTimeStr := r.URL.Query().Get("endTime")

		borrowHistory, err := dbfetcher.GetMarketTotalBorrowHistory(client, marketID, startTimeStr, endTimeStr)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(borrowHistory)
	}
}

// GetMarketTotalSupplyHistoryHandler handles GET /market/total-supply-history?marketId=ID&startTime=X&endTime=Y - returns total supply history for a specific market
func GetMarketTotalSupplyHistoryHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		marketID := r.URL.Query().Get("marketId")
		if marketID == "" {
			http.Error(w, "marketId query parameter is required", http.StatusBadRequest)
			return
		}

		startTimeStr := r.URL.Query().Get("startTime")
		endTimeStr := r.URL.Query().Get("endTime")

		supplyHistory, err := dbfetcher.GetMarketTotalSupplyHistory(client, marketID, startTimeStr, endTimeStr)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(supplyHistory)
	}
}

// GetMarketTotalCollateralSupplyHistoryHandler handles GET /market/total-collateral-supply-history?marketId=ID&startTime=X&endTime=Y - returns total collateral supply history for a specific market
func GetMarketTotalCollateralSupplyHistoryHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		marketID := r.URL.Query().Get("marketId")
		if marketID == "" {
			http.Error(w, "marketId query parameter is required", http.StatusBadRequest)
			return
		}

		startTimeStr := r.URL.Query().Get("startTime")
		endTimeStr := r.URL.Query().Get("endTime")

		history, err := dbfetcher.GetMarketTotalCollateralSupplyHistory(client, marketID, startTimeStr, endTimeStr)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(history)
	}
}

// GetMarketUtilizationHistoryHandler handles GET /market/utilization-history?marketId=ID&startTime=X&endTime=Y - returns utilization history for a specific market
func GetMarketUtilizationHistoryHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		marketID := r.URL.Query().Get("marketId")
		if marketID == "" {
			http.Error(w, "marketId query parameter is required", http.StatusBadRequest)
			return
		}

		startTimeStr := r.URL.Query().Get("startTime")
		endTimeStr := r.URL.Query().Get("endTime")

		utilizationHistory, err := dbfetcher.GetMarketUtilizationHistory(client, marketID, startTimeStr, endTimeStr)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(utilizationHistory)
	}
}

// GetMarketSnapshotsHandler handles GET /market/snapshots?marketId=ID&resolution=4hour&startTime=X&endTime=Y
func GetMarketSnapshotsHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		marketID := r.URL.Query().Get("marketId")
		if marketID == "" {
			http.Error(w, "marketId query parameter is required", http.StatusBadRequest)
			return
		}

		resolution := r.URL.Query().Get("resolution")
		if resolution == "" {
			resolution = "4hour" // Default to 4hour
		}

		startTimeStr := r.URL.Query().Get("startTime")
		endTimeStr := r.URL.Query().Get("endTime")

		snapshots, err := dbfetcher.GetMarketSnapshots(client, marketID, resolution, startTimeStr, endTimeStr)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(snapshots)
	}
}

// GetMarketActivityHandler handles GET /market-activity?marketId=ID&limit=X&last_id=Y - returns market activity for a specific market with cursor-based pagination
func GetMarketActivityHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		marketID := r.URL.Query().Get("marketId")
		if marketID == "" {
			http.Error(w, "marketId query parameter is required", http.StatusBadRequest)
			return
		}

		limitStr := r.URL.Query().Get("limit")
		limit := 0
		if limitStr != "" {
			if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
				limit = parsedLimit
			}
		}

		lastID := r.URL.Query().Get("last_id")

		activities, err := dbfetcher.GetMarketActivity(client, marketID, limit, lastID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(activities)
	}
}
