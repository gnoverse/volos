package routes

import (
	"encoding/json"
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

		user, err := dbfetcher.GetUser(client, userAddress)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(user)
	}
}

// GetUserVoteHandler handles GET /user-vote?proposalId=ID&userAddress=ADDRESS - returns user's vote on a proposal
func GetUserVoteHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		proposalID := r.URL.Query().Get("proposalId")
		userAddress := r.URL.Query().Get("userAddress")

		if proposalID == "" {
			http.Error(w, "Proposal ID parameter 'proposalId' is required", http.StatusBadRequest)
			return
		}

		if userAddress == "" {
			http.Error(w, "User address parameter 'userAddress' is required", http.StatusBadRequest)
			return
		}

		vote, err := dbfetcher.GetUserVoteOnProposal(client, proposalID, userAddress)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		if vote == nil {
			w.Write([]byte("null"))
		} else {
			json.NewEncoder(w).Encode(vote)
		}
	}
}
