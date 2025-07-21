package routes

import (
	"encoding/json"
	"net/http"

	"cloud.google.com/go/firestore"
)

// Handler for GET /user-borrow?caller=ADDRESS&marketId=MARKETID
func UserBorrowHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		caller := r.URL.Query().Get("caller")
		marketId := r.URL.Query().Get("marketId")
		if caller == "" || marketId == "" {
			http.Error(w, "Missing 'caller' or 'marketId' query parameter", http.StatusBadRequest)
			return
		}

		// implement db fetch

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode("not yet implemented")
	}
}
