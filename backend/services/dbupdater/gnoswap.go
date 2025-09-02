package dbupdater

import (
	"context"
	"log/slog"
	"strings"

	"cloud.google.com/go/firestore"
)

// UpdatePrice updates the current_price field for markets that have a matching poolPath
// poolPath is extracted from the provided marketID by removing the ":0" or ":1" suffix
func UpdatePrice(firestoreClient *firestore.Client, sqrtPriceX96, marketID string) {
	if sqrtPriceX96 == "" || marketID == "" {
		slog.Error("missing sqrtPriceX96 or marketID for price update", "sqrtPriceX96", sqrtPriceX96, "marketID", marketID)
		return
	}

	poolPath := strings.TrimSuffix(strings.TrimSuffix(marketID, ":0"), ":1")

	revertPrice := strings.HasSuffix(marketID, ":0")
	price := extractPriceFromSqrt(sqrtPriceX96, revertPrice)
	if price == "" {
		slog.Error("failed to extract price from sqrtPriceX96", "sqrtPriceX96", sqrtPriceX96)
		return
	}

	ctx := context.Background()
	marketsRef := firestoreClient.Collection("markets")

	iter := marketsRef.Where("poolPath", "==", poolPath).Documents(ctx)
	defer iter.Stop()

	updatedCount := 0
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		_, err = doc.Ref.Update(ctx, []firestore.Update{
			{Path: "current_price", Value: price},
		})

		if err != nil {
			slog.Error("failed to update market price", "market_id", doc.Ref.ID, "poolPath", poolPath, "price", price, "error", err)
			continue
		}

		updatedCount++
		slog.Info("market price updated", "market_id", doc.Ref.ID, "poolPath", poolPath, "price", price)
	}

	if updatedCount == 0 {
		slog.Warn("no markets found with matching poolPath, updating pool price only", "poolPath", poolPath, "marketID", marketID)
	} else {
		slog.Info("price update completed", "poolPath", poolPath, "marketID", marketID, "markets_updated", updatedCount, "price", price)
	}
}
