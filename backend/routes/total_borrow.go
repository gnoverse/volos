package routes

import (
	"net/http"
	"volos-backend/services/dbfetcher"

	"cloud.google.com/go/firestore"
)

func TotalBorrowHistoryHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		marketId := r.URL.Query().Get("marketId")
		if marketId == "" {
			http.Error(w, "marketId is required", http.StatusBadRequest)
			return
		}

		jsonData, err := dbfetcher.FetchMarketData(client, marketId, "total_borrow")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Write([]byte(jsonData))
	}
}
