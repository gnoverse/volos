package aggregator

import (
	"context"
	"log/slog"
	"math/big"
	"time"

	"volos-backend/model"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
)

// calculateAveragesFromTransactions calculates average market metrics from transaction history.
// Falls back to last known values if no transactions exist in the time period.
func (ma *MarketAggregator) calculateAveragesFromTransactions(ctx context.Context, sanitizedMarketID string, startTime, endTime time.Time) (*MarketAverages, error) {
	avgSupplyAPR, avgBorrowAPR, err := ma.calculateAPRAverages(ctx, sanitizedMarketID, startTime, endTime)
	if err != nil {
		return nil, err
	}

	avgUtilization, err := ma.calculateUtilizationAverages(ctx, sanitizedMarketID, startTime, endTime)
	if err != nil {
		return nil, err
	}

	avgTotalSupply, err := ma.calculateSupplyAverages(ctx, sanitizedMarketID, startTime, endTime)
	if err != nil {
		return nil, err
	}

	avgTotalBorrow, err := ma.calculateBorrowAverages(ctx, sanitizedMarketID, startTime, endTime)
	if err != nil {
		return nil, err
	}

	avgTotalCollateralSupply, err := ma.calculateCollateralSupplyAverages(ctx, sanitizedMarketID, startTime, endTime)
	if err != nil {
		return nil, err
	}

	averages := &MarketAverages{
		SupplyAPR:             avgSupplyAPR,
		BorrowAPR:             avgBorrowAPR,
		UtilizationRate:       avgUtilization,
		TotalSupply:           avgTotalSupply,
		TotalBorrow:           avgTotalBorrow,
		TotalCollateralSupply: avgTotalCollateralSupply,
	}

	return averages, nil
}

// calculateAveragesFromSnapshots calculates average market metrics from existing snapshots.
func (ma *MarketAggregator) calculateAveragesFromSnapshots(snapshots []MarketSnapshot) (*MarketAverages, error) {
	if len(snapshots) == 0 {
		return nil, nil
	}

	var totalSupplyAPR, totalBorrowAPR, totalUtilization *big.Int = big.NewInt(0), big.NewInt(0), big.NewInt(0)
	var totalSupplySum, totalBorrowSum, totalCollateralSupplySum *big.Int = big.NewInt(0), big.NewInt(0), big.NewInt(0)

	for _, snapshot := range snapshots {
		supplyAPR := utils.ParseAmount(snapshot.SupplyAPR, "snapshot average calculation")
		borrowAPR := utils.ParseAmount(snapshot.BorrowAPR, "snapshot average calculation")
		utilization := utils.ParseAmount(snapshot.UtilizationRate, "snapshot average calculation")

		totalSupplyAPR.Add(totalSupplyAPR, supplyAPR)
		totalBorrowAPR.Add(totalBorrowAPR, borrowAPR)
		totalUtilization.Add(totalUtilization, utilization)

		supply := utils.ParseAmount(snapshot.TotalSupply, "snapshot average calculation")
		borrow := utils.ParseAmount(snapshot.TotalBorrow, "snapshot average calculation")
		collateral := utils.ParseAmount(snapshot.TotalCollateralSupply, "snapshot average calculation")

		totalSupplySum.Add(totalSupplySum, supply)
		totalBorrowSum.Add(totalBorrowSum, borrow)
		totalCollateralSupplySum.Add(totalCollateralSupplySum, collateral)
	}

	count := big.NewInt(int64(len(snapshots)))

	avgSupplyAPRWAD := new(big.Int).Div(totalSupplyAPR, count)
	avgBorrowAPRWAD := new(big.Int).Div(totalBorrowAPR, count)
	avgUtilizationWAD := new(big.Int).Div(totalUtilization, count)

	avgSupply := new(big.Int).Div(totalSupplySum, count)
	avgBorrow := new(big.Int).Div(totalBorrowSum, count)
	avgCollateralSupply := new(big.Int).Div(totalCollateralSupplySum, count)

	return &MarketAverages{
		SupplyAPR:             avgSupplyAPRWAD.String(),
		BorrowAPR:             avgBorrowAPRWAD.String(),
		UtilizationRate:       avgUtilizationWAD.String(),
		TotalSupply:           avgSupply.String(),
		TotalBorrow:           avgBorrow.String(),
		TotalCollateralSupply: avgCollateralSupply.String(),
	}, nil
}

// calculateAPRAverages calculates average APR from transaction history
func (ma *MarketAggregator) calculateAPRAverages(ctx context.Context, sanitizedMarketID string, startTime, endTime time.Time) (string, string, error) {
	aprIter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("apr").
		Where("timestamp", ">=", startTime).
		Where("timestamp", "<=", endTime).
		OrderBy("timestamp", firestore.Asc).
		Documents(ctx)

	var totalSupplyAPR, totalBorrowAPR *big.Int = big.NewInt(0), big.NewInt(0)
	var aprCount int64

	for {
		doc, err := aprIter.Next()
		if err != nil {
			break
		}

		var aprHistory model.APRHistory
		if err := doc.DataTo(&aprHistory); err != nil {
			continue
		}

		supplyAPR := utils.ParseAmount(aprHistory.SupplyAPR, "APR average calculation")
		borrowAPR := utils.ParseAmount(aprHistory.BorrowAPR, "APR average calculation")

		totalSupplyAPR.Add(totalSupplyAPR, supplyAPR)
		totalBorrowAPR.Add(totalBorrowAPR, borrowAPR)
		aprCount++
	}

	var avgSupplyAPR, avgBorrowAPR string
	if aprCount > 0 {
		avgSupplyAPRWAD := new(big.Int).Div(totalSupplyAPR, big.NewInt(aprCount))
		avgBorrowAPRWAD := new(big.Int).Div(totalBorrowAPR, big.NewInt(aprCount))

		avgSupplyAPR = avgSupplyAPRWAD.String()
		avgBorrowAPR = avgBorrowAPRWAD.String()
	} else {
		lastSupplyAPR, lastBorrowAPR, err := ma.getLastKnownAPR(ctx, sanitizedMarketID, startTime)
		if err != nil {
			slog.Info("no APR data found, using defaults", "market_id", sanitizedMarketID, "start_time", startTime)
			avgSupplyAPR, avgBorrowAPR = "0", "0"
		} else {
			avgSupplyAPR = lastSupplyAPR.String()
			avgBorrowAPR = lastBorrowAPR.String()
		}
	}

	return avgSupplyAPR, avgBorrowAPR, nil
}

// calculateUtilizationAverages calculates average utilization from transaction history
func (ma *MarketAggregator) calculateUtilizationAverages(ctx context.Context, sanitizedMarketID string, startTime, endTime time.Time) (string, error) {
	utilIter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("utilization").
		Where("timestamp", ">=", startTime).
		Where("timestamp", "<=", endTime).
		OrderBy("timestamp", firestore.Asc).
		Documents(ctx)

	var totalUtilization *big.Int = big.NewInt(0)
	var utilCount int

	for {
		doc, err := utilIter.Next()
		if err != nil {
			break
		}

		var utilHistory model.UtilizationHistory
		if err := doc.DataTo(&utilHistory); err != nil {
			continue
		}

		utilization := utils.ParseAmount(utilHistory.Value, "utilization average calculation")
		totalUtilization.Add(totalUtilization, utilization)
		utilCount++
	}

	var avgUtilization string
	if utilCount > 0 {
		avgUtilizationWAD := new(big.Int).Div(totalUtilization, big.NewInt(int64(utilCount)))
		avgUtilization = avgUtilizationWAD.String()
	} else {
		lastUtilization, err := ma.getLastKnownUtilization(ctx, sanitizedMarketID, startTime)
		if err != nil {
			slog.Info("no utilization data found, using default", "market_id", sanitizedMarketID, "start_time", startTime)
			avgUtilization = "0"
		} else {
			avgUtilization = lastUtilization.String()
		}
	}

	return avgUtilization, nil
}

// calculateSupplyAverages calculates average total supply from transaction history
func (ma *MarketAggregator) calculateSupplyAverages(ctx context.Context, sanitizedMarketID string, startTime, endTime time.Time) (string, error) {
	supplyIter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("market_history").
		Where("event_type", "in", []string{"Supply", "Withdraw"}).
		Where("timestamp", ">=", startTime).
		Where("timestamp", "<=", endTime).
		OrderBy("timestamp", firestore.Asc).
		Documents(ctx)

	var totalSupplySum *big.Int = big.NewInt(0)
	var supplyCount int

	for {
		doc, err := supplyIter.Next()
		if err != nil {
			break
		}

		var supplyHistory model.MarketHistory
		if err := doc.DataTo(&supplyHistory); err != nil {
			continue
		}

		value := utils.ParseAmount(supplyHistory.Value, "average total supply calculation")
		totalSupplySum.Add(totalSupplySum, value)
		supplyCount++
	}

	var avgTotalSupply string
	if supplyCount > 0 {
		avgSupply := new(big.Int).Div(totalSupplySum, big.NewInt(int64(supplyCount)))
		avgTotalSupply = avgSupply.String()
	} else {
		lastSupply, err := ma.getLastKnownSupply(ctx, sanitizedMarketID, startTime)
		if err != nil {
			slog.Info("no supply data found, using default", "market_id", sanitizedMarketID, "start_time", startTime)
			avgTotalSupply = "0"
		} else {
			avgTotalSupply = lastSupply
		}
	}

	return avgTotalSupply, nil
}

// calculateCollateralSupplyAverages calculates average total collateral supply from transaction history
func (ma *MarketAggregator) calculateCollateralSupplyAverages(ctx context.Context, sanitizedMarketID string, startTime, endTime time.Time) (string, error) {
	iter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("market_history").
		Where("event_type", "in", []string{"SupplyCollateral", "WithdrawCollateral"}).
		Where("timestamp", ">=", startTime).
		Where("timestamp", "<=", endTime).
		OrderBy("timestamp", firestore.Asc).
		Documents(ctx)

	var sum *big.Int = big.NewInt(0)
	var count int

	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		var hist model.MarketHistory
		if err := doc.DataTo(&hist); err != nil {
			continue
		}

		value := utils.ParseAmount(hist.Value, "average total collateral supply calculation")
		sum.Add(sum, value)
		count++
	}

	if count > 0 {
		avg := new(big.Int).Div(sum, big.NewInt(int64(count)))
		return avg.String(), nil
	}

	last, err := ma.getLastKnownCollateralSupply(ctx, sanitizedMarketID, startTime)
	if err != nil {
		slog.Info("no collateral supply data found, using default", "market_id", sanitizedMarketID, "start_time", startTime)
		return "0", nil
	}
	return last, nil
}

// calculateBorrowAverages calculates average total borrow from transaction history
func (ma *MarketAggregator) calculateBorrowAverages(ctx context.Context, sanitizedMarketID string, startTime, endTime time.Time) (string, error) {
	borrowIter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("market_history").
		Where("event_type", "in", []string{"Borrow", "Repay", "Liquidate"}).
		Where("timestamp", ">=", startTime).
		Where("timestamp", "<=", endTime).
		OrderBy("timestamp", firestore.Asc).
		Documents(ctx)

	var totalBorrowSum *big.Int = big.NewInt(0)
	var borrowCount int

	for {
		doc, err := borrowIter.Next()
		if err != nil {
			break
		}

		var borrowHistory model.MarketHistory
		if err := doc.DataTo(&borrowHistory); err != nil {
			continue
		}

		value := utils.ParseAmount(borrowHistory.Value, "average total borrow calculation")
		totalBorrowSum.Add(totalBorrowSum, value)
		borrowCount++
	}

	var avgTotalBorrow string
	if borrowCount > 0 {
		avgBorrow := new(big.Int).Div(totalBorrowSum, big.NewInt(int64(borrowCount)))
		avgTotalBorrow = avgBorrow.String()
	} else {
		lastBorrow, err := ma.getLastKnownBorrow(ctx, sanitizedMarketID, startTime)
		if err != nil {
			slog.Info("no borrow data found, using default", "market_id", sanitizedMarketID, "start_time", startTime)
			avgTotalBorrow = "0"
		} else {
			avgTotalBorrow = lastBorrow
		}
	}

	return avgTotalBorrow, nil
}

// getLastKnownAPR retrieves the most recent APR values before the specified time.
func (ma *MarketAggregator) getLastKnownAPR(ctx context.Context, sanitizedMarketID string, beforeTime time.Time) (*big.Int, *big.Int, error) {
	iter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("apr").
		Where("timestamp", "<", beforeTime).
		OrderBy("timestamp", firestore.Desc).
		Limit(1).
		Documents(ctx)

	doc, err := iter.Next()
	if err != nil {
		return big.NewInt(0), big.NewInt(0), err
	}

	var aprHistory model.APRHistory
	if err := doc.DataTo(&aprHistory); err != nil {
		return big.NewInt(0), big.NewInt(0), err
	}

	supplyAPR := utils.ParseAmount(aprHistory.SupplyAPR, "getLastKnownAPR")
	borrowAPR := utils.ParseAmount(aprHistory.BorrowAPR, "getLastKnownAPR")

	return supplyAPR, borrowAPR, nil
}

// getLastKnownUtilization retrieves the most recent utilization value before the specified time.
func (ma *MarketAggregator) getLastKnownUtilization(ctx context.Context, sanitizedMarketID string, beforeTime time.Time) (*big.Int, error) {
	iter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("utilization").
		Where("timestamp", "<", beforeTime).
		OrderBy("timestamp", firestore.Desc).
		Limit(1).
		Documents(ctx)

	doc, err := iter.Next()
	if err != nil {
		return big.NewInt(0), err
	}

	var utilHistory model.UtilizationHistory
	if err := doc.DataTo(&utilHistory); err != nil {
		return big.NewInt(0), err
	}

	utilization := utils.ParseAmount(utilHistory.Value, "getLastKnownUtilization")
	return utilization, nil
}

// getLastKnownSupply retrieves the most recent total supply value before the specified time.
func (ma *MarketAggregator) getLastKnownSupply(ctx context.Context, sanitizedMarketID string, beforeTime time.Time) (string, error) {
	iter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("market_history").
		Where("event_type", "in", []string{"Supply", "Withdraw"}).
		Where("timestamp", "<", beforeTime).
		OrderBy("timestamp", firestore.Desc).
		Limit(1).
		Documents(ctx)

	doc, err := iter.Next()
	if err != nil {
		return "0", err
	}

	var supplyHistory model.MarketHistory
	if err := doc.DataTo(&supplyHistory); err != nil {
		return "0", err
	}

	return supplyHistory.Value, nil
}

// getLastKnownCollateralSupply retrieves the most recent total collateral supply value before the specified time.
func (ma *MarketAggregator) getLastKnownCollateralSupply(ctx context.Context, sanitizedMarketID string, beforeTime time.Time) (string, error) {
	iter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("market_history").
		Where("event_type", "in", []string{"SupplyCollateral", "WithdrawCollateral"}).
		Where("timestamp", "<", beforeTime).
		OrderBy("timestamp", firestore.Desc).
		Limit(1).
		Documents(ctx)

	doc, err := iter.Next()
	if err != nil {
		return "0", err
	}

	var hist model.MarketHistory
	if err := doc.DataTo(&hist); err != nil {
		return "0", err
	}

	return hist.Value, nil
}

// getLastKnownBorrow retrieves the most recent total borrow value before the specified time.
func (ma *MarketAggregator) getLastKnownBorrow(ctx context.Context, sanitizedMarketID string, beforeTime time.Time) (string, error) {
	iter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("market_history").
		Where("event_type", "in", []string{"Borrow", "Repay", "Liquidate"}).
		Where("timestamp", "<", beforeTime).
		OrderBy("timestamp", firestore.Desc).
		Limit(1).
		Documents(ctx)

	doc, err := iter.Next()
	if err != nil {
		return "0", err
	}

	var borrowHistory model.MarketHistory
	if err := doc.DataTo(&borrowHistory); err != nil {
		return "0", err
	}

	return borrowHistory.Value, nil
}

// getSnapshotsInRange retrieves snapshots of a specific resolution within a time range.
func (ma *MarketAggregator) getSnapshotsInRange(ctx context.Context, sanitizedMarketID string, resolution TimeBucketResolution, startTime, endTime time.Time) ([]MarketSnapshot, error) {
	bucketCollection := ma.getBucketCollectionName(resolution)

	iter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection(bucketCollection).
		Where("timestamp", ">=", startTime).
		Where("timestamp", "<=", endTime).
		OrderBy("timestamp", firestore.Asc).
		Documents(ctx)

	var snapshots []MarketSnapshot
	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		var snapshot MarketSnapshot
		if err := doc.DataTo(&snapshot); err != nil {
			continue
		}

		snapshots = append(snapshots, snapshot)
	}

	return snapshots, nil
}

// getBucketCollectionName returns the Firestore collection name for a given time resolution.
func (ma *MarketAggregator) getBucketCollectionName(resolution TimeBucketResolution) string {
	switch resolution {
	case FourHour:
		return "snapshots_4hour"
	case Daily:
		return "snapshots_daily"
	case Weekly:
		return "snapshots_weekly"
	default:
		return "snapshots_daily"
	}
}
