package dbupdater

import (
	"context"
	"log/slog"
	"strings"
	"time"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func UpdateAPRHistory(client *firestore.Client, marketID, supplyAPR, borrowAPR, timestamp string, index string) {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	ctx := context.Background()

	sec := utils.ParseTimestamp(timestamp, "apr update")
	if sec == 0 {
		return
	}
	eventTime := time.Unix(sec, 0)

	marketRef := client.Collection("markets").Doc(sanitizedMarketID)
	err := client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		dsnap, err := tx.Get(marketRef)
		if err != nil && status.Code(err) != codes.NotFound {
			return err
		}

		cur := GetTimeFromDoc(dsnap, "apr_updated_at")
		if eventTime.After(cur) {
			if err := tx.Set(marketRef, map[string]interface{}{
				"supply_apr":     supplyAPR,
				"borrow_apr":     borrowAPR,
				"apr_updated_at": eventTime,
			}, firestore.MergeAll); err != nil {
				return err
			}
		}

		aprHistoryRef := client.Collection("markets").Doc(sanitizedMarketID).Collection("apr").NewDoc()
		if err := tx.Set(aprHistoryRef, map[string]interface{}{
			"timestamp":  eventTime,
			"supply_apr": supplyAPR,
			"borrow_apr": borrowAPR,
			"index":      index,
		}); err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		slog.Error("failed to update apr in transaction", "market_id", marketID, "error", err)
		return
	}

	slog.Info("apr history updated", "market_id", marketID, "supply_apr", supplyAPR, "borrow_apr", borrowAPR, "timestamp", timestamp)
}
