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

// UpdateUtilizationHistory updates the utilization rate for a market and stores it in the utilization history.
// This function should be called whenever total supply or total borrow changes.
// It reads the current totals from the market document and calculates utilization on the spot.
func UpdateUtilizationHistory(client *firestore.Client, marketID, timestamp string) {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	ctx := context.Background()

	sec := utils.ParseTimestamp(timestamp, "utilization update")
	if sec == 0 {
		return
	}
	eventTime := time.Unix(sec, 0)

	marketRef := client.Collection("markets").Doc(sanitizedMarketID)
	var utilizationRate string
	err := client.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		dsnap, err := tx.Get(marketRef)
		if err != nil {
			if status.Code(err) != codes.NotFound {
				return err
			}
			// Market doesn't exist yet, skip utilization update
			return nil
		}

		totalSupply := GetAmountFromDoc(dsnap, "total_supply")
		totalBorrow := GetAmountFromDoc(dsnap, "total_borrow")

		utilizationRate = calculateUtilizationRate(totalSupply, totalBorrow)

		updates := map[string]interface{}{
			"utilization_rate": utilizationRate,
		}
		if err := tx.Set(marketRef, updates, firestore.MergeAll); err != nil {
			return err
		}

		utilizationHistoryRef := marketRef.Collection("utilization").NewDoc()
		historyData := map[string]interface{}{
			"timestamp": eventTime,
			"value":     utilizationRate,
		}
		if err := tx.Set(utilizationHistoryRef, historyData); err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		slog.Error("failed to update utilization history", "market_id", marketID, "error", err)
		return
	}

	slog.Info("utilization history updated", "market_id", marketID, "timestamp", timestamp, "utilization_rate", utilizationRate)
}

// calculateUtilizationRate calculates the utilization rate in WAD format
// Utilization rate = (total borrow * WAD) / total supply
func calculateUtilizationRate(totalSupply, totalBorrow string) string {
	supply := utils.ParseAmount(totalSupply, "utilization calculation")
	borrow := utils.ParseAmount(totalBorrow, "utilization calculation")

	if supply.Sign() == 0 {
		return "0"
	}

	// Calculate (borrow * WAD) / supply using WDivDown for rounding down
	utilization := utils.WDivDown(borrow, supply)
	return utilization.String()
}
