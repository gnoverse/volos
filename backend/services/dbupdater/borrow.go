package dbupdater

import (
	"context"
	"log"
	"math/big"
	"strconv"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

// UpdateTotalBorrow updates the total_borrow aggregate for a market and appends a history entry.
// Amounts are u256 stored as strings; arithmetic uses big.Int. If isBorrow is true we add (borrow), else subtract (repay).
func UpdateTotalBorrow(client *firestore.Client, marketID, amount, timestamp string, isBorrow bool) {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	ctx := context.Background()

	sec, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		log.Printf("UpdateTotalBorrow: invalid timestamp %q for market %s: %v", timestamp, marketID, err)
		return
	}
	eventTime := time.Unix(sec, 0)

	amt, ok := new(big.Int).SetString(amount, 10)
	if !ok || amt.Sign() < 0 {
		log.Printf("UpdateTotalBorrow: invalid amount %q for market %s", amount, marketID)
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
			"updated_at":   eventTime,
		}
		return tx.Set(marketRef, updates, firestore.MergeAll)
	}); err != nil {
		log.Printf("UpdateTotalBorrow: transaction failed for market %s: %v", marketID, err)
		return
	}

	history := map[string]interface{}{
		"timestamp":    eventTime,
		"total":        updatedTotalStr,
		"amount_delta": amount,
		"is_borrow":    isBorrow,
	}
	if _, err := marketRef.Collection("total_borrow_history").NewDoc().Set(ctx, history); err != nil {
		log.Printf("UpdateTotalBorrow: failed to append total_borrow_history for market %s: %v", marketID, err)
	}

	log.Printf("UpdateTotalBorrow: %s %s for market %s; total_borrow updated to %s", func() string {
		if isBorrow {
			return "+"
		}
		return "-"
	}(), amount, marketID, updatedTotalStr)
}
