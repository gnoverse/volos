package aggregator

import (
	"context"
	"log/slog"
	"strings"
	"time"
	"volos-backend/model"

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

// CreateFourHourSnapshot creates a 4-hour snapshot for a market
func (ma *MarketAggregator) CreateFourHourSnapshot(marketID string, endTime time.Time) error {
	startTime := endTime.Add(-4 * time.Hour)
	return ma.createSnapshot(marketID, FourHour, startTime, endTime)
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

// createSnapshot aggregates market data for the given time period and creates a snapshot
func (ma *MarketAggregator) createSnapshot(marketID string, resolution TimeBucketResolution, startTime, endTime time.Time) error {
	ctx := context.Background()
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")

	market, err := ma.getLatestMarketData(ctx, sanitizedMarketID)
	if err != nil {
		slog.Error("failed to get latest market data", "market_id", marketID, "error", err)
		return err
	}

	snapshot := MarketSnapshotData{
		MarketID:        marketID,
		Timestamp:       endTime,
		Resolution:      resolution,
		SupplyAPR:       market.CurrentSupplyAPR,
		BorrowAPR:       market.CurrentBorrowAPR,
		TotalSupply:     market.TotalSupply,
		TotalBorrow:     market.TotalBorrow,
		UtilizationRate: market.UtilizationRate,
		CreatedAt:       time.Now(),
	}

	bucketCollection := ma.getBucketCollectionName(resolution)

	_, _, err = ma.client.Collection("markets").Doc(sanitizedMarketID).Collection(bucketCollection).Add(ctx, snapshot)
	if err != nil {
		slog.Error("failed to store market snapshot", "market_id", marketID, "resolution", resolution, "error", err)
		return err
	}

	slog.Info("created market snapshot", "market_id", marketID, "resolution", resolution, "timestamp", endTime)
	return nil
}

// getLatestMarketData gets the most recent market data including totals and utilization rate
func (ma *MarketAggregator) getLatestMarketData(ctx context.Context, sanitizedMarketID string) (*model.Market, error) {
	marketDoc, err := ma.client.Collection("markets").Doc(sanitizedMarketID).Get(ctx)
	if err != nil {
		return nil, err
	}

	var market model.Market
	if err := marketDoc.DataTo(&market); err != nil {
		return nil, err
	}

	return &market, nil
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
