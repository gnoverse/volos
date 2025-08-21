package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"

	"volos-backend/routes"
	"volos-backend/services/processor"
	"volos-backend/services/txlistener"

	"cloud.google.com/go/firestore"

	// Firestore
	"google.golang.org/api/option"
)

var FirestoreClient *firestore.Client

func init() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{ // TODO: switch to JSON handler for production
		Level: slog.LevelInfo,
	}))
	slog.SetDefault(logger)

	ctx := context.Background()
	projectID := "volos-f06d9"
	serviceAccountPath := "firebase.json"
	client, err := firestore.NewClient(ctx, projectID, option.WithCredentialsFile(serviceAccountPath))
	if err != nil {
		slog.Error("Failed to create Firestore client", "error", err)
		os.Exit(1)
	}
	FirestoreClient = client
}

func main() {
	setupRoutes()
	go func() {
		ctx := context.Background()
		pool := processor.NewTransactionProcessorPool(8)
		pool.Start(FirestoreClient)
		listener := txlistener.NewTransactionListener(pool)
		listener.Start(ctx)
	}()

	slog.Info("server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}

func setupRoutes() {
	http.HandleFunc("/api/total-supply-history", withCORS(routes.TotalSupplyHistoryHandler(FirestoreClient)))
	http.HandleFunc("/api/total-borrow-history", withCORS(routes.TotalBorrowHistoryHandler(FirestoreClient)))
	http.HandleFunc("/api/total-utilization-history", withCORS(routes.TotalUtilizationHistoryHandler(FirestoreClient)))
	http.HandleFunc("/api/market-activity", withCORS(routes.MarketActivityHandler(FirestoreClient)))
	http.HandleFunc("/api/apr-history", withCORS(routes.APRHistoryHandler(FirestoreClient)))
	http.HandleFunc("/api/user-loans", withCORS(routes.UserLoansHandler(FirestoreClient)))
	http.HandleFunc("/api/user-collateral", withCORS(routes.UserCollateralHandler(FirestoreClient)))
	http.HandleFunc("/api/user-borrow", withCORS(routes.UserBorrowHandler(FirestoreClient)))
	http.HandleFunc("/api/proposals/active", withCORS(routes.GetActiveProposalsHandler(FirestoreClient)))
	http.HandleFunc("/api/proposal/", withCORS(routes.GetProposalHandler(FirestoreClient)))
	http.HandleFunc("/api/proposals", withCORS(routes.GetProposalsHandler(FirestoreClient)))
	http.HandleFunc("/api/user-vote", withCORS(routes.GetUserVoteHandler(FirestoreClient)))
	http.HandleFunc("/api/user-pending-unstakes", withCORS(routes.GetUserPendingUnstakesHandler(FirestoreClient)))
	http.HandleFunc("/api/user", withCORS(routes.GetUserHandler(FirestoreClient)))
}

func withCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		handler(w, r)
	}
}
