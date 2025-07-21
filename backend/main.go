package main

import (
	"context"
	"fmt"
	"log"
	"net/http"

	"volos-backend/routes"
	"volos-backend/services/txfetching"

	"cloud.google.com/go/firestore"

	// Firestore
	"google.golang.org/api/option"
)

var FirestoreClient *firestore.Client

func init() {
	ctx := context.Background()
	projectID := "volos-f06d9"
	serviceAccountPath := "firebase.json"
	client, err := firestore.NewClient(ctx, projectID, option.WithCredentialsFile(serviceAccountPath))
	if err != nil {
		log.Fatalf("Failed to create Firestore client: %v", err)
	}
	FirestoreClient = client
}

func main() {
	http.HandleFunc("/api/total-supply-history", withCORS(routes.TotalSupplyHistoryHandler(FirestoreClient)))
	http.HandleFunc("/api/total-borrow-history", withCORS(routes.TotalBorrowHistoryHandler(FirestoreClient)))
	http.HandleFunc("/api/total-utilization-history", withCORS(routes.TotalUtilizationHistoryHandler(FirestoreClient)))
	http.HandleFunc("/api/market-activity", withCORS(routes.MarketActivityHandler(FirestoreClient)))
	http.HandleFunc("/api/apr-history", withCORS(routes.APRHistoryHandler(FirestoreClient)))
	http.HandleFunc("/api/user-loans", withCORS(routes.UserLoansHandler(FirestoreClient)))
	http.HandleFunc("/api/user-collateral", withCORS(routes.UserCollateralHandler(FirestoreClient)))
	http.HandleFunc("/api/user-borrow", withCORS(routes.UserBorrowHandler(FirestoreClient)))

	go func() {
		ctx := context.Background()
		listener := txfetching.NewTransactionListener()
		listener.Start(ctx)
	}()

	fmt.Println("Server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
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
