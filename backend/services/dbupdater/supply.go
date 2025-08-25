package dbupdater

import (
	"context"
	"log/slog"
	"math/big"
	"strings"
	"time"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// UpdateTotalSupply updates the total_supply for a market using a transactional read-modify-write
// and appends a history sample to the unified market_history collection.
//
// Amounts are stored as strings (u256). Arithmetic is done with big.Int.
// eventType determines whether this is a supply event (adds to total) or withdraw event (subtracts from total).
// For supply events, the amount is added to the total supply.
// For withdraw events, the amount is subtracted from the total supply.
func UpdateTotalSupply(client *firestore.Client, marketID, amount, timestamp string, caller string, txHash string, eventType string) {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	ctx := context.Background()

	sec := utils.ParseTimestamp(timestamp, "total supply update")
	if sec == 0 {
		return
	}
	eventTime := time.Unix(sec, 0)

	amt := utils.ParseAmount(amount, "total supply update")
	if amt.Sign() == 0 {
		return
	}

	isSupply := eventType == "Supply"

	marketRef := client.Collection("markets").Doc(sanitizedMarketID)

	var updatedTotalStr string
	if err := client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		dsnap, err := tx.Get(marketRef)
		if err != nil {
			if status.Code(err) != codes.NotFound {
				return err
			}
		}

		current := new(big.Int)
		if dsnap != nil && dsnap.Exists() {
			if s, err := dsnap.DataAt("total_supply"); err == nil {
				if sStr, ok := s.(string); ok {
					if _, ok := current.SetString(sStr, 10); !ok {
						current.SetInt64(0)
					}
				}
			}
		}

		updated := new(big.Int).Set(current)
		if isSupply {
			updated.Add(updated, amt)
		} else {
			if updated.Cmp(amt) < 0 {
				updated.SetInt64(0)
			} else {
				updated.Sub(updated, amt)
			}
		}

		updatedTotalStr = updated.String()
		updates := map[string]interface{}{
			"total_supply": updatedTotalStr,
		}
		return tx.Set(marketRef, updates, firestore.MergeAll)
	}); err != nil {
		slog.Error("failed to update total supply in database", "market_id", marketID, "amount", amount, "event_type", eventType, "error", err)
		return
	}

	operation := "-"
	if isSupply {
		operation = "+"
	}

	history := map[string]interface{}{
		"timestamp":  eventTime,
		"value":      updatedTotalStr,
		"delta":      amount,
		"operation":  operation, // "+" for supply, "-" for withdraw (redundant with event_type but kept for clarity)
		"caller":     caller,
		"tx_hash":    txHash,
		"event_type": eventType,
	}
	if _, err := marketRef.Collection("market_history").NewDoc().Set(ctx, history); err != nil {
		slog.Error("failed to add market history entry", "market_id", marketID, "error", err)
		return
	}

	slog.Info("total supply updated", "operation", operation, "amount", amount, "market_id", marketID, "total_supply", updatedTotalStr)
}
