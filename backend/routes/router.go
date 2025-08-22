package routes

import (
	"net/http"
	"strings"

	"cloud.google.com/go/firestore"
)

// APIRouter handles all API routes with path-based routing
func APIRouter(client *firestore.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := r.URL.Path

		switch path {
		case "/api/market-activity":
			MarketActivityHandler(client)(w, r)
		case "/api/user":
			GetUserHandler(client)(w, r)
		case "/api/user-vote":
			GetUserVoteHandler(client)(w, r)
		case "/api/user-pending-unstakes":
			GetUserPendingUnstakesHandler(client)(w, r)
		case "/api/markets":
			GetMarketsHandler(client)(w, r)
		case "/api/market/apr":
			GetMarketAPRHistoryHandler(client)(w, r)
		case "/api/market/total-borrow-history":
			GetMarketTotalBorrowHistoryHandler(client)(w, r)
		case "/api/market/total-supply-history":
			GetMarketTotalSupplyHistoryHandler(client)(w, r)
		case "/api/proposals":
			GetProposalsHandler(client)(w, r)
		case "/api/proposals/active":
			GetActiveProposalsHandler(client)(w, r)
		default:
			// Handle path-based routes
			switch {
			case strings.HasPrefix(path, "/api/market/"):
				GetMarketHandler(client)(w, r)
			case strings.HasPrefix(path, "/api/proposal/"):
				GetProposalHandler(client)(w, r)
			default:
				http.Error(w, "API endpoint not found", http.StatusNotFound)
			}
		}
	}
}
