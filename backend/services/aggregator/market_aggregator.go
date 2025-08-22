package aggregator

import (
	"context"
	"log/slog"
	"math/big"
	"strings"
	"time"
	"volos-backend/model"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
)

// MarketAggregator handles the creation of time-bucket snapshots for market data
type MarketAggregator struct {
	client *firestore.Client
}

// NewMarketAggregator creates a new market aggregator instance
func NewMarketAggregator(client *firestore.Client) *MarketAggregator {
	return &MarketAggregator{
		client: client,
	}
}

// CreateHourlySnapshot creates an hourly snapshot for a market
func (ma *MarketAggregator) CreateHourlySnapshot(marketID string, endTime time.Time) error {
	startTime := endTime.Add(-1 * time.Hour)
	return ma.createSnapshot(marketID, Hourly, startTime, endTime)
}

// CreateDailySnapshot creates a daily snapshot for a market
func (ma *MarketAggregator) CreateDailySnapshot(marketID string, endTime time.Time) error {
	startTime := endTime.Add(-24 * time.Hour)
	return ma.createSnapshot(marketID, Daily, startTime, endTime)
}

// CreateWeeklySnapshot creates a weekly snapshot for a market
func (ma *MarketAggregator) CreateWeeklySnapshot(marketID string, endTime time.Time) error {
	startTime := endTime.Add(-7 * 24 * time.Hour)
	return ma.createSnapshot(marketID, Weekly, startTime, endTime)
}

// CreateMonthlySnapshot creates a monthly snapshot for a market
func (ma *MarketAggregator) CreateMonthlySnapshot(marketID string, endTime time.Time) error {
	startTime := endTime.AddDate(0, -1, 0)
	return ma.createSnapshot(marketID, Monthly, startTime, endTime)
}

// createSnapshot aggregates market data for the given time period and creates a snapshot
func (ma *MarketAggregator) createSnapshot(marketID string, resolution TimeBucketResolution, startTime, endTime time.Time) error {
	ctx := context.Background()
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")

	// Aggregate APR data
	supplyAPR, borrowAPR, sampleCount, err := ma.aggregateAPRData(ctx, sanitizedMarketID, startTime, endTime)
	if err != nil {
		slog.Error("failed to aggregate APR data", "market_id", marketID, "error", err)
		return err
	}

	// Get latest totals
	totalSupply, totalBorrow, err := ma.getLatestTotals(ctx, sanitizedMarketID)
	if err != nil {
		slog.Error("failed to get latest totals", "market_id", marketID, "error", err)
		return err
	}

	// Calculate utilization rate
	utilizationRate := ma.calculateUtilizationRate(totalSupply, totalBorrow)

	// Create snapshot document
	snapshot := MarketSnapshotData{
		MarketID:        marketID,
		Timestamp:       endTime,
		Resolution:      resolution,
		SupplyAPR:       supplyAPR,
		BorrowAPR:       borrowAPR,
		TotalSupply:     totalSupply,
		TotalBorrow:     totalBorrow,
		UtilizationRate: utilizationRate,
		SampleCount:     sampleCount,
		CreatedAt:       time.Now(),
	}

	// Store in appropriate bucket collection
	bucketCollection := ma.getBucketCollectionName(resolution)
	docID := ma.generateSnapshotID(marketID, endTime, resolution)

	_, err = ma.client.Collection("markets").Doc(sanitizedMarketID).Collection(bucketCollection).Doc(docID).Set(ctx, snapshot)
	if err != nil {
		slog.Error("failed to store market snapshot", "market_id", marketID, "resolution", resolution, "error", err)
		return err
	}

	slog.Info("created market snapshot", "market_id", marketID, "resolution", resolution, "timestamp", endTime, "sample_count", sampleCount)
	return nil
}

// aggregateAPRData calculates average APR values for the given time period
func (ma *MarketAggregator) aggregateAPRData(ctx context.Context, sanitizedMarketID string, startTime, endTime time.Time) (float64, float64, int, error) {
	aprCollection := ma.client.Collection("markets").Doc(sanitizedMarketID).Collection("apr")

	query := aprCollection.Where("timestamp", ">=", startTime).Where("timestamp", "<=", endTime)
	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		return 0, 0, 0, err
	}

	if len(docs) == 0 {
		return 0, 0, 0, nil
	}

	var totalSupplyAPR, totalBorrowAPR float64
	for _, doc := range docs {
		var aprData model.APRHistoryData
		if err := doc.DataTo(&aprData); err != nil {
			continue
		}
		totalSupplyAPR += aprData.SupplyAPR
		totalBorrowAPR += aprData.BorrowAPR
	}

	sampleCount := len(docs)
	avgSupplyAPR := totalSupplyAPR / float64(sampleCount)
	avgBorrowAPR := totalBorrowAPR / float64(sampleCount)

	return avgSupplyAPR, avgBorrowAPR, sampleCount, nil
}

// getLatestTotals gets the most recent total supply and borrow values
func (ma *MarketAggregator) getLatestTotals(ctx context.Context, sanitizedMarketID string) (string, string, error) {
	marketDoc, err := ma.client.Collection("markets").Doc(sanitizedMarketID).Get(ctx)
	if err != nil {
		return "0", "0", err
	}

	var market model.MarketData
	if err := marketDoc.DataTo(&market); err != nil {
		return "0", "0", err
	}

	return market.TotalSupply, market.TotalBorrow, nil
}

// calculateUtilizationRate calculates the utilization rate as a percentage
func (ma *MarketAggregator) calculateUtilizationRate(totalSupply, totalBorrow string) float64 {
	supply := utils.ParseAmount(totalSupply, "utilization calculation")
	borrow := utils.ParseAmount(totalBorrow, "utilization calculation")

	if supply.Sign() == 0 {
		return 0
	}

	// Calculate utilization rate: (borrow / supply) * 100
	utilization := new(big.Rat).SetFrac(borrow, supply)
	utilizationFloat, _ := utilization.Float64()
	return utilizationFloat * 100
}

// getBucketCollectionName returns the Firestore collection name for the given resolution
func (ma *MarketAggregator) getBucketCollectionName(resolution TimeBucketResolution) string {
	switch resolution {
	case Hourly:
		return "snapshots_hourly"
	case Daily:
		return "snapshots_daily"
	case Weekly:
		return "snapshots_weekly"
	case Monthly:
		return "snapshots_monthly"
	default:
		return "snapshots_daily"
	}
}

// generateSnapshotID creates a unique document ID for the snapshot
func (ma *MarketAggregator) generateSnapshotID(marketID string, timestamp time.Time, resolution TimeBucketResolution) string {
	// Format: marketID_timestamp_resolution
	// Example: "gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000_2024-01-15T14:00:00Z_hourly"
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	return sanitizedMarketID + "_" + timestamp.Format(time.RFC3339) + "_" + string(resolution)
}
