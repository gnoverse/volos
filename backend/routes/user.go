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

// GetUserPendingUnstakesHandler handles GET /user-pending-unstakes?userAddress=ADDRESS - returns user's pending unstakes
func GetUserPendingUnstakesHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		userAddress := r.URL.Query().Get("userAddress")
		if userAddress == "" {
			http.Error(w, "userAddress parameter is required", http.StatusBadRequest)
			return
		}

		pendingUnstakes, err := dbfetcher.GetUserPendingUnstakes(client, userAddress)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(pendingUnstakes)
	}
}

// GetUserLoanHistoryHandler handles GET /user-loan-history?userAddress=ADDRESS - returns user's borrow/repay history across all markets
func GetUserLoanHistoryHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		user := r.URL.Query().Get("user")
		if user == "" {
			http.Error(w, "user parameter is required", http.StatusBadRequest)
			return
		}

		loanHistory, err := dbfetcher.GetUserLoanHistory(client, user)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(loanHistory)
	}
}

// GetUserMarketPositionHandler handles GET /user-market-position?user=ADDRESS&marketId=ID
func GetUserMarketPositionHandler(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		user := r.URL.Query().Get("user")
		marketID := r.URL.Query().Get("marketId")
		if user == "" || marketID == "" {
			http.Error(w, "user and marketId parameters are required", http.StatusBadRequest)
			return
		}

		pos, err := dbfetcher.GetUserMarketPosition(client, user, marketID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(pos)
	}
}
