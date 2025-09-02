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

	"volos-backend/services/aggregator"

	"github.com/gnolang/gno/gno.land/pkg/gnoclient"
	rpcclient "github.com/gnolang/gno/tm2/pkg/bft/rpc/client"
	_ "github.com/joho/godotenv/autoload"
)

var firestoreClient *firestore.Client
var frontendURL string
var gnoClient *gnoclient.Client

func init() {
	initLogger()

	if err := initFirebaseClient(); err != nil {
		slog.Error("Failed to create Firestore client", "error", err)
		os.Exit(1)
	}

	if err := initGnoClient(); err != nil {
		slog.Error("Failed to create Gno client", "error", err)
		os.Exit(1)
	}

	frontendURL = func() string {
		if url := os.Getenv("FRONTEND_URL"); url != "" {
			return url
		}
		return "http://localhost:3000"
	}()
}

func main() {
	http.HandleFunc("/api/", routes.APIRouter(firestoreClient, frontendURL))

	// Start transaction processing
	go func() {
		ctx := context.Background()
		pool := processor.NewTransactionProcessorPool(8, gnoClient, firestoreClient)
		pool.Start()
		listener := txlistener.NewTransactionListener(pool)
		listener.Start(ctx)
	}()

	// Start aggregation job scheduler
	go func() {
		scheduler := aggregator.NewJobScheduler(firestoreClient)
		scheduler.Start()

		// Keep the scheduler running
		select {}
	}()

	slog.Info("server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}

func initGnoClient() error {
	remote := os.Getenv("RPC_NODE_URL")
	if remote == "" {
		remote = "127.0.0.1:26657"
	}
	rpcClient, err := rpcclient.NewHTTPClient(remote)
	if err != nil {
		return err
	}

	gnoClient = &gnoclient.Client{
		RPCClient: rpcClient,
	}
	return nil
}

func initFirebaseClient() error {
	ctx := context.Background()
	projectID := "volos-f06d9"
	serviceAccountPath := "firebase.json"
	client, err := firestore.NewClient(ctx, projectID, option.WithCredentialsFile(serviceAccountPath))
	if err != nil {
		return err
	}
	firestoreClient = client
	return nil
}

func initLogger() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{ // TODO: switch to JSON handler for production
		Level: slog.LevelDebug, //dev only
	}))
	slog.SetDefault(logger)
}
