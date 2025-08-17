package routes

import (
	"encoding/json"
	"net/http"
	"volos-backend/services/dbfetcher"

	"cloud.google.com/go/firestore"
)

func TotalUtilizationHistoryHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		marketId := r.URL.Query().Get("marketId")
		if marketId == "" {
			http.Error(w, "marketId is required", http.StatusBadRequest)
			return
		}

		data, err := dbfetcher.FetchMarketData(client, marketId, "total_utilization")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(data)
	}
}
