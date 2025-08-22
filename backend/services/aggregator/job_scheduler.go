package aggregator

import (
	"context"
	"log/slog"
	"time"

	"cloud.google.com/go/firestore"
	"volos-backend/model"
)

// JobScheduler manages the scheduling and execution of aggregation jobs
type JobScheduler struct {
	client     *firestore.Client
	aggregator *MarketAggregator
	stopChan   chan struct{}
}

// NewJobScheduler creates a new job scheduler
func NewJobScheduler(client *firestore.Client) *JobScheduler {
	return &JobScheduler{
		client:     client,
		aggregator: NewMarketAggregator(client),
		stopChan:   make(chan struct{}),
	}
}

// Start begins the job scheduler
func (js *JobScheduler) Start() {
	go js.runHourlyJobs()
	go js.runDailyJobs()
	go js.runWeeklyJobs()
	go js.runMonthlyJobs()

	slog.Info("aggregation job scheduler started")
}

// Stop stops the job scheduler
func (js *JobScheduler) Stop() {
	close(js.stopChan)
	slog.Info("aggregation job scheduler stopped")
}

// runHourlyJobs runs hourly aggregation jobs
func (js *JobScheduler) runHourlyJobs() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	// Run initial job
	js.runHourlyAggregation()

	for {
		select {
		case <-js.stopChan:
			return
		case <-ticker.C:
			js.runHourlyAggregation()
		}
	}
}

// runDailyJobs runs daily aggregation jobs
func (js *JobScheduler) runDailyJobs() {
	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	// Run initial job
	js.runDailyAggregation()

	for {
		select {
		case <-js.stopChan:
			return
		case <-ticker.C:
			js.runDailyAggregation()
		}
	}
}

// runWeeklyJobs runs weekly aggregation jobs
func (js *JobScheduler) runWeeklyJobs() {
	ticker := time.NewTicker(7 * 24 * time.Hour)
	defer ticker.Stop()

	// Run initial job
	js.runWeeklyAggregation()

	for {
		select {
		case <-js.stopChan:
			return
		case <-ticker.C:
			js.runWeeklyAggregation()
		}
	}
}

// runMonthlyJobs runs monthly aggregation jobs
func (js *JobScheduler) runMonthlyJobs() {
	ticker := time.NewTicker(30 * 24 * time.Hour) // Approximate monthly interval
	defer ticker.Stop()

	// Run initial job
	js.runMonthlyAggregation()

	for {
		select {
		case <-js.stopChan:
			return
		case <-ticker.C:
			js.runMonthlyAggregation()
		}
	}
}

// runHourlyAggregation runs hourly aggregation for all markets
func (js *JobScheduler) runHourlyAggregation() {
	now := time.Now().Truncate(time.Hour)
	js.runAggregationForAllMarkets(Hourly, now)
}

// runDailyAggregation runs daily aggregation for all markets
func (js *JobScheduler) runDailyAggregation() {
	now := time.Now().Truncate(24 * time.Hour)
	js.runAggregationForAllMarkets(Daily, now)
}

// runWeeklyAggregation runs weekly aggregation for all markets
func (js *JobScheduler) runWeeklyAggregation() {
	now := time.Now().Truncate(7 * 24 * time.Hour)
	js.runAggregationForAllMarkets(Weekly, now)
}

// runMonthlyAggregation runs monthly aggregation for all markets
func (js *JobScheduler) runMonthlyAggregation() {
	now := time.Now().Truncate(30 * 24 * time.Hour)
	js.runAggregationForAllMarkets(Monthly, now)
}

// runAggregationForAllMarkets runs aggregation for all markets at the given resolution
func (js *JobScheduler) runAggregationForAllMarkets(resolution TimeBucketResolution, timestamp time.Time) {
	markets, err := js.getAllMarketIDs()
	if err != nil {
		slog.Error("failed to get market IDs for aggregation", "resolution", resolution, "error", err)
		return
	}

	for _, marketID := range markets {
		go func(marketID string) {
			var err error
			switch resolution {
			case Hourly:
				err = js.aggregator.CreateHourlySnapshot(marketID, timestamp)
			case Daily:
				err = js.aggregator.CreateDailySnapshot(marketID, timestamp)
			case Weekly:
				err = js.aggregator.CreateWeeklySnapshot(marketID, timestamp)
			case Monthly:
				err = js.aggregator.CreateMonthlySnapshot(marketID, timestamp)
			}

			if err != nil {
				slog.Error("failed to create snapshot", "market_id", marketID, "resolution", resolution, "error", err)
			}
		}(marketID)
	}

	slog.Info("started aggregation jobs", "resolution", resolution, "market_count", len(markets), "timestamp", timestamp)
}

// getAllMarketIDs gets all market IDs from the database
func (js *JobScheduler) getAllMarketIDs() ([]string, error) {
	ctx := context.Background()
	docs, err := js.client.Collection("markets").Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}

	var marketIDs []string
	for _, doc := range docs {
		var market model.MarketData
		if err := doc.DataTo(&market); err != nil {
			continue
		}
		marketIDs = append(marketIDs, market.ID)
	}

	return marketIDs, nil
}
