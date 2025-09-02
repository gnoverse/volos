package dbupdater

import (
	"context"
	"log/slog"
	"math/big"
	"strings"

	"cloud.google.com/go/firestore"
)

// UpdatePrice updates the current_price field for markets that have a matching poolPath
// poolPath is extracted from the provided marketID by removing the ":0" or ":1" suffix
func UpdatePrice(client *firestore.Client, sqrtPriceX96, marketID string) {
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
	marketsRef := client.Collection("markets")

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

// extractPriceFromSqrt extracts the actual price from sqrtPriceX96 using the same logic as the on-chain oracle
// 1. Square the sqrtPriceX96 to get price in Q192
// 2. Divide by Q192 to get the actual price ratio
// 3. Apply ORACLE_PRICE_SCALE (1e36) for precision
// 4. If revertPrice is true, invert the price (ORACLE_PRICE_SCALE² / price)
func extractPriceFromSqrt(sqrtPriceX96 string, revertPrice bool) string {
	// Parse sqrtPriceX96 as big.Int
	sqrtPrice, ok := new(big.Int).SetString(sqrtPriceX96, 10)
	if !ok {
		slog.Error("failed to parse sqrtPriceX96 as big.Int", "sqrtPriceX96", sqrtPriceX96)
		return ""
	}

	// Square the price to get price in Q192 (sqrtPriceX96²)
	priceQ192 := new(big.Int).Mul(sqrtPrice, sqrtPrice)

	// ORACLE_PRICE_SCALE = 1e36 (from consts.gno)
	oraclePriceScale := new(big.Int).Exp(big.NewInt(10), big.NewInt(36), nil)

	// Q192 = 2^192 (from consts.gno)
	q192 := new(big.Int).Exp(big.NewInt(2), big.NewInt(192), nil)

	// Calculate: (priceQ192 * ORACLE_PRICE_SCALE) / Q192
	// This gives us the price with 36 decimal precision
	numerator := new(big.Int).Mul(priceQ192, oraclePriceScale)
	price := new(big.Int).Div(numerator, q192)

	// If revertPrice is true, invert the price: ORACLE_PRICE_SCALE² / price
	if revertPrice {
		// Calculate ORACLE_PRICE_SCALE²
		oraclePriceScaleSquared := new(big.Int).Mul(oraclePriceScale, oraclePriceScale)
		// Invert: ORACLE_PRICE_SCALE² / price
		price = new(big.Int).Div(oraclePriceScaleSquared, price)
	}

	return price.String()
}
