package routes

import (
	"encoding/json"
	"net/http"

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

		// implement db fetch

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode("not yet implemented")
	}
}
