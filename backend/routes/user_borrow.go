package routes

import (
	"encoding/json"
	"net/http"
	"volos-backend/services/polling/user_specific"

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

		result, err := user_specific.GetOrUpdateUserBorrowHistory(client, caller, marketId)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	}
}
