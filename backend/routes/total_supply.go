package routes

import (
	"net/http"
	"volos-backend/services"

	"cloud.google.com/go/firestore"
)

func TotalSupplyHistoryHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		marketId := r.URL.Query().Get("marketId")
		if marketId == "" {
			http.Error(w, "marketId is required", http.StatusBadRequest)
			return
		}

		jsonData, err := services.FetchMarketData(client, marketId, "total_supply")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Write([]byte(jsonData))
	}
}
