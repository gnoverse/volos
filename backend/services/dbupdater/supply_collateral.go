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

// UpdateTotalCollateralSupply updates the total_collateral_supply for a market using a transactional read-modify-write
// and appends a history sample in a dedicated subcollection.
// Amounts are stored as strings (u256). Arithmetic is done with big.Int.
// isSupply indicates whether this is a collateral supply event (true) or withdraw collateral event (false).
func UpdateTotalCollateralSupply(client *firestore.Client, marketID, amount, timestamp string, isSupply bool) {
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
			if s, err := dsnap.DataAt("total_collateral_supply"); err == nil {
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
			"total_collateral_supply": updatedTotalStr,
		}
		return tx.Set(marketRef, updates, firestore.MergeAll)
	}); err != nil {
		slog.Error("failed to update total collateral supply in database", "market_id", marketID, "amount", amount, "is_supply", isSupply, "error", err)
		return
	}

	history := map[string]interface{}{
		"timestamp": eventTime,
		"value":     updatedTotalStr,
		"delta":     amount,
		"is_supply": isSupply,
	}
	if _, err := marketRef.Collection("total_collateral_supply").NewDoc().Set(ctx, history); err != nil {
		slog.Error("failed to add total collateral supply history entry", "market_id", marketID, "error", err)
		return
	}

	operation := "-"
	if isSupply {
		operation = "+"
	}

	slog.Info("total collateral supply updated", "operation", operation, "amount", amount, "market_id", marketID, "total_collateral_supply", updatedTotalStr)
}
