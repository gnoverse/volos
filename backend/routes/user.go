package routes

import (
	"net/http"
	"volos-backend/services/dbfetcher"

	"cloud.google.com/go/firestore"
)

// GetUserHandler handles GET /user?address=ADDRESS - returns user data
func GetUserHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		userAddress := r.URL.Query().Get("address")
		if userAddress == "" {
			http.Error(w, "User address parameter 'address' is required", http.StatusBadRequest)
			return
		}

		jsonData, err := dbfetcher.GetUser(client, userAddress)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Write([]byte(jsonData))
	}
}
