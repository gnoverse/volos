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

func UpdateAPRHistory(client *firestore.Client, marketID, supplyAPRWad, borrowAPRWad, timestamp string) {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	ctx := context.Background()

	sec := utils.ParseTimestamp(timestamp, "apr update")
	if sec == 0 {
		return
	}
	eventTime := time.Unix(sec, 0)

	supply := utils.WadToPercent(supplyAPRWad, "supply apr")
	borrow := utils.WadToPercent(borrowAPRWad, "borrow apr")

	_, _, err := client.Collection("markets").Doc(sanitizedMarketID).Collection("apr").Add(ctx, map[string]interface{}{
		"timestamp":  eventTime,
		"supply_apr": supply,
		"borrow_apr": borrow,
	})
	if err != nil {
		slog.Error("failed to write apr history", "market_id", marketID, "error", err)
		return
	}

	marketRef := client.Collection("markets").Doc(sanitizedMarketID)
	err = client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		dsnap, err := tx.Get(marketRef)
		if err != nil && status.Code(err) != codes.NotFound {
			return err
		}
		var cur time.Time
		if dsnap != nil && dsnap.Exists() {
			if v, err := dsnap.DataAt("apr_updated_at"); err == nil {
				if t, ok := v.(time.Time); ok {
					cur = t
				}
			}
		}
		if eventTime.After(cur) {
			return tx.Set(marketRef, map[string]interface{}{
				"supply_apr":     supply,
				"borrow_apr":     borrow,
				"apr_updated_at": eventTime,
			}, firestore.MergeAll)
		}
		return nil
	})
	if err != nil {
		slog.Error("failed to update current apr", "market_id", marketID, "error", err)
		return
	}

	slog.Info("apr history updated", "market_id", marketID, "supply_apr", supply, "borrow_apr", borrow, "timestamp", timestamp)
}
