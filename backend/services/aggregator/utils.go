package aggregator

import (
	"context"
	"math/big"
	"time"

	"volos-backend/model"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
)

// MarketAverages holds all calculated average values for a market
type MarketAverages struct {
	SupplyAPR       float64 `json:"supply_apr"`
	BorrowAPR       float64 `json:"borrow_apr"`
	UtilizationRate float64 `json:"utilization_rate"`
	TotalSupply     string  `json:"total_supply"`
	TotalBorrow     string  `json:"total_borrow"`
}

// calculateAveragesFromTransactions calculates all averages from transaction history
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

	return &MarketAverages{
		SupplyAPR:       avgSupplyAPR,
		BorrowAPR:       avgBorrowAPR,
		UtilizationRate: avgUtilization,
		TotalSupply:     avgTotalSupply,
		TotalBorrow:     avgTotalBorrow,
	}, nil
}

// calculateAveragesFromSnapshots calculates average values from a slice of snapshots
func (ma *MarketAggregator) calculateAveragesFromSnapshots(snapshots []MarketSnapshot) (*MarketAverages, error) {
	if len(snapshots) == 0 {
		return nil, nil
	}

	var totalSupplyAPR, totalBorrowAPR, totalUtilization float64
	var totalSupplySum, totalBorrowSum *big.Int = big.NewInt(0), big.NewInt(0)

	for _, snapshot := range snapshots {
		totalSupplyAPR += snapshot.SupplyAPR
		totalBorrowAPR += snapshot.BorrowAPR
		totalUtilization += snapshot.UtilizationRate

		supply := utils.ParseAmount(snapshot.TotalSupply, "snapshot average calculation")
		borrow := utils.ParseAmount(snapshot.TotalBorrow, "snapshot average calculation")

		totalSupplySum.Add(totalSupplySum, supply)
		totalBorrowSum.Add(totalBorrowSum, borrow)
	}

	count := float64(len(snapshots))
	avgSupplyAPR := totalSupplyAPR / count
	avgBorrowAPR := totalBorrowAPR / count
	avgUtilization := totalUtilization / count

	avgSupply := new(big.Int).Div(totalSupplySum, big.NewInt(int64(len(snapshots))))
	avgBorrow := new(big.Int).Div(totalBorrowSum, big.NewInt(int64(len(snapshots))))

	return &MarketAverages{
		SupplyAPR:       avgSupplyAPR,
		BorrowAPR:       avgBorrowAPR,
		UtilizationRate: avgUtilization,
		TotalSupply:     avgSupply.String(),
		TotalBorrow:     avgBorrow.String(),
	}, nil
}

// calculateAPRAverages calculates average APR from transaction history
func (ma *MarketAggregator) calculateAPRAverages(ctx context.Context, sanitizedMarketID string, startTime, endTime time.Time) (float64, float64, error) {
	aprIter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("apr").
		Where("timestamp", ">=", startTime).
		Where("timestamp", "<=", endTime).
		OrderBy("timestamp", firestore.Asc).
		Documents(ctx)

	var totalSupplyAPR, totalBorrowAPR float64
	var aprCount int

	for {
		doc, err := aprIter.Next()
		if err != nil {
			break
		}

		var aprHistory model.APRHistory
		if err := doc.DataTo(&aprHistory); err != nil {
			continue
		}

		totalSupplyAPR += aprHistory.SupplyAPR
		totalBorrowAPR += aprHistory.BorrowAPR
		aprCount++
	}

	var avgSupplyAPR, avgBorrowAPR float64
	if aprCount > 0 {
		avgSupplyAPR = totalSupplyAPR / float64(aprCount)
		avgBorrowAPR = totalBorrowAPR / float64(aprCount)
	}

	return avgSupplyAPR, avgBorrowAPR, nil
}

// calculateUtilizationAverages calculates average utilization from transaction history
func (ma *MarketAggregator) calculateUtilizationAverages(ctx context.Context, sanitizedMarketID string, startTime, endTime time.Time) (float64, error) {
	utilIter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("utilization").
		Where("timestamp", ">=", startTime).
		Where("timestamp", "<=", endTime).
		OrderBy("timestamp", firestore.Asc).
		Documents(ctx)

	var totalUtilization float64
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

		totalUtilization += utilHistory.Value
		utilCount++
	}

	var avgUtilization float64
	if utilCount > 0 {
		avgUtilization = totalUtilization / float64(utilCount)
	}

	return avgUtilization, nil
}

// calculateSupplyAverages calculates average total supply from transaction history
func (ma *MarketAggregator) calculateSupplyAverages(ctx context.Context, sanitizedMarketID string, startTime, endTime time.Time) (string, error) {
	supplyIter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("total_supply").
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

		var supplyHistory model.TotalSupplyHistory
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
		avgTotalSupply = "0"
	}

	return avgTotalSupply, nil
}

// calculateBorrowAverages calculates average total borrow from transaction history
func (ma *MarketAggregator) calculateBorrowAverages(ctx context.Context, sanitizedMarketID string, startTime, endTime time.Time) (string, error) {
	borrowIter := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("total_borrow").
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

		var borrowHistory model.TotalBorrowHistory
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
		avgTotalBorrow = "0"
	}

	return avgTotalBorrow, nil
}

// getSnapshotsInRange retrieves snapshots from a specific resolution within a time range
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

// getBucketCollectionName returns the Firestore collection name for the given resolution
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
