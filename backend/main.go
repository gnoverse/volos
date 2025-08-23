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

	_ "github.com/joho/godotenv/autoload"
)

var firestoreClient *firestore.Client
var frontendURL string

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
	firestoreClient = client

	frontendURL = func() string {
		if url := os.Getenv("FRONTEND_URL"); url != "" {
			return url
		}
		return "http://localhost:3000"
}()
}

func main() {
	http.HandleFunc("/api/", withCORS(routes.APIRouter(firestoreClient)))

	go func() {
		ctx := context.Background()
		pool := processor.NewTransactionProcessorPool(8)
		pool.Start(firestoreClient)
		listener := txlistener.NewTransactionListener(pool)
		listener.Start(ctx)
	}()

	slog.Info("server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}

func withCORS(handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", frontendURL)
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		handler(w, r)
	}
}
