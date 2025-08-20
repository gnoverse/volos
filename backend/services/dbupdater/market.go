package dbupdater

import (
	"context"
	"log/slog"
	"strconv"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
)

// CreateMarket creates a new market in the Firestore database.
// It uses sanitizedMarketID (replacing "/" with "_") to avoid issues with Firestore document IDs.
func CreateMarket(client *firestore.Client, marketID, loanToken, collateralToken, timestamp string) error {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	timestampInt, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return err
	}

	marketData := map[string]interface{}{
		"id":               marketID,
		"loan_token":       loanToken,
		"collateral_token": collateralToken,
		"created_at":       time.Unix(timestampInt, 0),
	}

	_, err = client.Collection("markets").Doc(sanitizedMarketID).Set(context.Background(), marketData)
	if err != nil {
		return err
	}

	slog.Info("Market created",
		"market_id", marketID,
	)
	return nil
}
