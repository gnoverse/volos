package dbupdater

import (
	"context"
	"log/slog"
	"strings"
	"time"
	"volos-backend/services"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// UpdateTotalCollateralSupply updates the total_collateral_supply for a market using a transactional read-modify-write
// and appends a history sample to the unified market_history collection.
// Amounts are stored as strings (u256). Arithmetic is done with big.Int.
// eventType determines whether this is a collateral supply event (adds to total) or withdraw collateral event (subtracts from total).
func UpdateTotalCollateralSupply(client *firestore.Client, marketID, amount, timestamp string, caller string, txHash string, eventType string, index float64, blockHeight float64) {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	ctx := context.Background()

	sec := utils.ParseTimestamp(timestamp, "total collateral supply update")
	if sec == 0 {
		return
	}
	eventTime := time.Unix(sec, 0)

	amt := utils.ParseAmount(amount, "total collateral supply update")
	if amt.Sign() == 0 {
		return
	}

	isSupply := eventType == "SupplyCollateral"

	marketRef := client.Collection("markets").Doc(sanitizedMarketID)

	var updatedTotalStr string
	if err := client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		dsnap, err := tx.Get(marketRef)
		if err != nil {
			if status.Code(err) != codes.NotFound {
				return err
			}
		}

		currentAmount := GetAmountFromDoc(dsnap, "total_collateral_supply")
		updatedTotalStr = UpdateAmountInDoc(currentAmount, amt, isSupply)
		updates := map[string]interface{}{
			"total_collateral_supply": updatedTotalStr,
		}
		return tx.Set(marketRef, updates, firestore.MergeAll)
	}); err != nil {
		slog.Error("failed to update total collateral supply in database", "market_id", marketID, "amount", amount, "event_type", eventType, "error", err)
		return
	}

	operation := "-"
	if isSupply {
		operation = "+"
	}

	history := map[string]interface{}{
		"timestamp":    eventTime,
		"value":        updatedTotalStr,
		"delta":        amount,
		"operation":    operation, // "+" for supply collateral, "-" for withdraw collateral (redundant with event_type but kept for clarity)
		"caller":       caller,
		"tx_hash":      txHash,
		"event_type":   eventType,
		"loan_price":   services.GetTokenPrice(marketID),
		"index":        index,
		"block_height": blockHeight,
	}

	if _, err := marketRef.Collection("market_history").NewDoc().Set(ctx, history); err != nil {
		slog.Error("failed to add market history entry", "market_id", marketID, "error", err)
		return
	}

	slog.Info("total collateral supply updated", "operation", operation, "amount", amount, "market_id", marketID, "total_collateral_supply", updatedTotalStr)
}
