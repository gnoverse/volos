package dbupdater

import (
	"context"
	"log/slog"
	"strings"
	"time"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
)

// UpdateUtilizationHistory updates the utilization rate for a market and stores it in the utilization history.
// This function should be called whenever total supply or total borrow changes.
// It accepts the utilization rate as a pre-calculated WAD format string.
func UpdateUtilizationHistory(client *firestore.Client, marketID, timestamp, utilizationRate string, index string) {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	ctx := context.Background()

	sec := utils.ParseTimestamp(timestamp, "utilization update")
	if sec == 0 {
		return
	}
	eventTime := time.Unix(sec, 0)

	marketRef := client.Collection("markets").Doc(sanitizedMarketID)

	updates := map[string]interface{}{
		"utilization_rate": utilizationRate,
	}
	if _, err := marketRef.Set(ctx, updates, firestore.MergeAll); err != nil {
		slog.Error("failed to update market utilization", "market_id", marketID, "error", err)
		return
	}

	historyData := map[string]interface{}{
		"timestamp": eventTime,
		"value":     utilizationRate,
	}
	if _, err := marketRef.Collection("utilization").NewDoc().Set(ctx, historyData); err != nil {
		slog.Error("failed to add utilization history", "market_id", marketID, "error", err)
	}

	slog.Info("utilization history updated", "market_id", marketID, "timestamp", timestamp, "utilization_rate", utilizationRate)
}
