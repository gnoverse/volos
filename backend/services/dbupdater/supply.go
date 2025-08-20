package dbupdater

import (
	"context"
	"log/slog"
	"math/big"
	"strconv"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// UpdateTotalSupply updates the total_supply for a market using a transactional read-modify-write
// and appends a history sample.
//
// Amounts are stored as strings (u256). Arithmetic is done with big.Int.
// isSupply indicates whether this is a supply event (true) or withdraw event (false).
// For supply events, the amount is added to the total supply.
// For withdraw events, the amount is subtracted from the total supply.
func UpdateTotalSupply(client *firestore.Client, marketID, amount, timestamp string, isSupply bool) error {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	ctx := context.Background()

	sec, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return err
	}
	eventTime := time.Unix(sec, 0)

	amt, ok := new(big.Int).SetString(amount, 10)
	if !ok || amt.Sign() < 0 {
		return err
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
			"updated_at":   eventTime,
		}
		return tx.Set(marketRef, updates, firestore.MergeAll)
	}); err != nil {
		return err
	}

	history := map[string]interface{}{
		"timestamp":    eventTime,
		"total":        updatedTotalStr,
		"amount_delta": amount,
		"is_supply":    isSupply,
	}
	if _, err := marketRef.Collection("total_supply_history").NewDoc().Set(ctx, history); err != nil {
		return err
	}

	operation := "-"
	if isSupply {
		operation = "+"
	}
	
	slog.Info("UpdateTotalSupply completed",
		"operation", operation,
		"amount", amount,
		"market_id", marketID,
		"total_supply", updatedTotalStr,
	)
	return nil
}
