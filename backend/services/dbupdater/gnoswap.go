package dbupdater

import (
	"context"
	"log/slog"
	"strings"

	"cloud.google.com/go/firestore"
)

// UpdatePrice updates the current_price field for markets that have a matching poolPath
// poolPath is extracted from the provided marketID by removing the ":0" or ":1" suffix
// Uses Firestore transaction to atomically fetch markets, get token decimals, and update prices
func UpdatePrice(firestoreClient *firestore.Client, sqrtPriceX96, marketID string) {
	if sqrtPriceX96 == "" || marketID == "" {
		slog.Error("missing sqrtPriceX96 or marketID for price update", "sqrtPriceX96", sqrtPriceX96, "marketID", marketID)
		return
	}

	poolPath := strings.TrimSuffix(strings.TrimSuffix(marketID, ":0"), ":1")
	revert := strings.HasSuffix(marketID, ":1")

	ctx := context.Background()
	marketsRef := firestoreClient.Collection("markets")

	iter := marketsRef.Where("poolPath", "==", poolPath).Documents(ctx)
	defer iter.Stop()

	var marketDocs []*firestore.DocumentSnapshot
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}
		marketDocs = append(marketDocs, doc)
	}

	err := firestoreClient.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		for _, marketDoc := range marketDocs {
			loanTokenDecimals, err := marketDoc.DataAt("loan_token_decimals")
			if err != nil {
				slog.Error("failed to get loan_token_decimals", "market_id", marketDoc.Ref.ID, "error", err)
				continue
			}

			collateralTokenDecimals, err := marketDoc.DataAt("collateral_token_decimals")
			if err != nil {
				slog.Error("failed to get collateral_token_decimals", "market_id", marketDoc.Ref.ID, "error", err)
				continue
			}

			price := extractPriceFromSqrt(sqrtPriceX96, revert, loanTokenDecimals.(int64), collateralTokenDecimals.(int64))
			if price == "" {
				slog.Error("failed to extract price", "sqrtPriceX96", sqrtPriceX96, "market_id", marketDoc.Ref.ID)
				continue
			}

			if err := tx.Update(marketDoc.Ref, []firestore.Update{{Path: "current_price", Value: price}}); err != nil {
				slog.Error("failed to update market price", "market_id", marketDoc.Ref.ID, "error", err)
				return err
			}

			slog.Info("market price updated in transaction", "market_id", marketDoc.Ref.ID, "poolPath", poolPath, "price", price)
		}

		return nil
	})

	if err != nil {
		slog.Error("transaction failed for price update", "poolPath", poolPath, "marketID", marketID, "error", err)
		return
	}
}
