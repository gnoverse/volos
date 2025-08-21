package dbupdater

import (
	"context"
	"log/slog"
	"strings"
	"time"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
)

// CreateMarket creates a new market in the Firestore database.
// It uses sanitizedMarketID (replacing "/" with "_") to avoid issues with Firestore document IDs.
func CreateMarket(client *firestore.Client, marketID, loanToken, collateralToken, timestamp string) {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	timestampInt := utils.ParseTimestamp(timestamp, "market creation")
	if timestampInt == 0 {
		return
	}

	marketData := map[string]interface{}{
		"id":               marketID,
		"loan_token":       loanToken,
		"collateral_token": collateralToken,
		"created_at":       time.Unix(timestampInt, 0),
	}

	_, err := client.Collection("markets").Doc(sanitizedMarketID).Set(context.Background(), marketData)
	if err != nil {
		slog.Error("failed to create market in database",
			"market_id", marketID,
			"loan_token", loanToken,
			"collateral_token", collateralToken,
			"error", err,
		)
		return
	}

	slog.Info("market created",
		"market_id", marketID,
	)
}
