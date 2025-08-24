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

// UpdateTotalBorrow updates the total_borrow aggregate for a market and appends a history entry.
// Amounts are u256 stored as strings; arithmetic uses big.Int. If isBorrow is true we add (borrow), else subtract (repay).
func UpdateTotalBorrow(client *firestore.Client, marketID, amount, timestamp string, isBorrow bool) {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	ctx := context.Background()

	sec := utils.ParseTimestamp(timestamp, "total borrow update")
	if sec == 0 {
		return
	}
	eventTime := time.Unix(sec, 0)

	amt := utils.ParseAmount(amount, "total borrow update")
	if amt.Sign() == 0 {
		return
	}

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
			if s, err := dsnap.DataAt("total_borrow"); err == nil {
				if sStr, ok := s.(string); ok {
					if _, ok := current.SetString(sStr, 10); !ok {
						current.SetInt64(0)
					}
				}
			}
		}

		updated := new(big.Int).Set(current)
		if isBorrow {
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
			"total_borrow": updatedTotalStr,
		}
		return tx.Set(marketRef, updates, firestore.MergeAll)
	}); err != nil {
		slog.Error("failed to update total borrow in database", "market_id", marketID, "amount", amount, "is_borrow", isBorrow, "error", err)
		return
	}

	history := map[string]interface{}{
		"timestamp":    eventTime,
		"value":        updatedTotalStr,
		"delta": amount,
		"is_borrow":    isBorrow,
	}

	if _, err := marketRef.Collection("total_borrow").NewDoc().Set(ctx, history); err != nil {
		slog.Error("failed to add total borrow history entry", "market_id", marketID, "error", err)
		return
	}

	operation := "-"
	if isBorrow {
		operation = "+"
	}

	slog.Info("total borrow updated", "operation", operation, "amount", amount, "market_id", marketID, "total_borrow", updatedTotalStr)
}
