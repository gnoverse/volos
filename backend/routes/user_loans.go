package routes

import (
	"encoding/json"
	"net/http"
	"volos-backend/services/polling/user_specific"

	"cloud.google.com/go/firestore"
)

// Handler for GET /user-loans?caller=ADDRESS
func UserLoansHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		caller := r.URL.Query().Get("caller")
		if caller == "" {
			http.Error(w, "Missing 'caller' query parameter", http.StatusBadRequest)
			return
		}

		result, err := user_specific.GetOrUpdateUserLoanHistory(client, caller)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(result)
	}
}
