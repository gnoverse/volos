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

	supplyAPR, borrowAPR, sampleCount, err := ma.aggregateAPRData(ctx, sanitizedMarketID, startTime, endTime)
	if err != nil {
		slog.Error("failed to aggregate APR data", "market_id", marketID, "error", err)
		return err
	}

	market, err := ma.getLatestMarketData(ctx, sanitizedMarketID)
	if err != nil {
		slog.Error("failed to get latest market data", "market_id", marketID, "error", err)
		return err
	}

	snapshot := MarketSnapshotData{
		MarketID:        marketID,
		Timestamp:       endTime,
		Resolution:      resolution,
		SupplyAPR:       supplyAPR,
		BorrowAPR:       borrowAPR,
		TotalSupply:     market.TotalSupply,
		TotalBorrow:     market.TotalBorrow,
		UtilizationRate: market.UtilizationRate,
		SampleCount:     sampleCount,
		CreatedAt:       time.Now(),
	}

	bucketCollection := ma.getBucketCollectionName(resolution)

	_, _, err = ma.client.Collection("markets").Doc(sanitizedMarketID).Collection(bucketCollection).Add(ctx, snapshot)
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
		var aprData model.APRHistory
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
