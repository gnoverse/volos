package aggregator

import (
	"context"
	"log/slog"
	"strings"
	"time"

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

// CreateFourHourSnapshot creates a 4-hour snapshot for a market by averaging transaction data
func (ma *MarketAggregator) CreateFourHourSnapshot(marketID string, endTime time.Time) error {
	startTime := endTime.Add(-4 * time.Hour)
	return ma.createSnapshotFromTransactions(marketID, FourHour, startTime, endTime)
}

// CreateDailySnapshot creates a daily snapshot for a market by averaging 4-hour snapshots
func (ma *MarketAggregator) CreateDailySnapshot(marketID string, endTime time.Time) error {
	startTime := endTime.Add(-24 * time.Hour)
	return ma.createSnapshotFromSnapshots(marketID, Daily, FourHour, startTime, endTime)
}

// CreateWeeklySnapshot creates a weekly snapshot for a market by averaging daily snapshots
func (ma *MarketAggregator) CreateWeeklySnapshot(marketID string, endTime time.Time) error {
	startTime := endTime.Add(-7 * 24 * time.Hour)
	return ma.createSnapshotFromSnapshots(marketID, Weekly, Daily, startTime, endTime)
}

// createSnapshotFromTransactions aggregates market data from transaction history for the given time period
func (ma *MarketAggregator) createSnapshotFromTransactions(marketID string, resolution TimeBucketResolution, startTime, endTime time.Time) error {
	ctx := context.Background()
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")

	averages, err := ma.calculateAveragesFromTransactions(ctx, sanitizedMarketID, startTime, endTime)
	if err != nil {
		slog.Error("failed to calculate averages from transactions", "market_id", marketID, "error", err)
		return err
	}

	snapshot := MarketSnapshot{
		MarketID:              marketID,
		Timestamp:             endTime,
		Resolution:            resolution,
		SupplyAPR:             averages.SupplyAPR,
		BorrowAPR:             averages.BorrowAPR,
		TotalSupply:           averages.TotalSupply,
		TotalCollateralSupply: averages.TotalCollateralSupply,
		TotalBorrow:           averages.TotalBorrow,
		UtilizationRate:       averages.UtilizationRate,
		CreatedAt:             time.Now(),
	}

	bucketCollection := ma.getBucketCollectionName(resolution)

	_, _, err = ma.client.Collection("markets").Doc(sanitizedMarketID).Collection(bucketCollection).Add(ctx, snapshot)
	if err != nil {
		slog.Error("failed to store market snapshot", "market_id", marketID, "resolution", resolution, "error", err)
		return err
	}

	slog.Info("created market snapshot from transactions", "market_id", marketID, "resolution", resolution, "timestamp", endTime)
	return nil
}

// createSnapshotFromSnapshots aggregates market data from shorter period snapshots
func (ma *MarketAggregator) createSnapshotFromSnapshots(marketID string, targetResolution, sourceResolution TimeBucketResolution, startTime, endTime time.Time) error {
	ctx := context.Background()
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")

	snapshots, err := ma.getSnapshotsInRange(ctx, sanitizedMarketID, sourceResolution, startTime, endTime)
	if err != nil {
		slog.Error("failed to get snapshots in range", "market_id", marketID, "source_resolution", sourceResolution, "error", err)
		return err
	}

	if len(snapshots) == 0 {
		slog.Warn("no snapshots found for aggregation", "market_id", marketID, "source_resolution", sourceResolution, "start_time", startTime, "end_time", endTime)
		return nil
	}

	averages, err := ma.calculateAveragesFromSnapshots(snapshots)
	if err != nil {
		slog.Error("failed to calculate averages from snapshots", "market_id", marketID, "error", err)
		return err
	}

	snapshot := MarketSnapshot{
		MarketID:        marketID,
		Timestamp:       endTime,
		Resolution:      targetResolution,
		SupplyAPR:       averages.SupplyAPR,
		BorrowAPR:       averages.BorrowAPR,
		TotalSupply:     averages.TotalSupply,
		TotalBorrow:     averages.TotalBorrow,
		UtilizationRate: averages.UtilizationRate,
		CreatedAt:       time.Now(),
	}

	bucketCollection := ma.getBucketCollectionName(targetResolution)

	_, _, err = ma.client.Collection("markets").Doc(sanitizedMarketID).Collection(bucketCollection).Add(ctx, snapshot)
	if err != nil {
		slog.Error("failed to store market snapshot", "market_id", marketID, "resolution", targetResolution, "error", err)
		return err
	}

	slog.Info("created market snapshot from snapshots", "market_id", marketID, "resolution", targetResolution, "snapshot_count", len(snapshots), "timestamp", endTime)
	return nil
}
