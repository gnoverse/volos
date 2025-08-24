package aggregator

import (
	"context"
	"log/slog"
	"time"

	"volos-backend/model"

	"cloud.google.com/go/firestore"
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
	go js.runFourHourJobs()
	go js.runDailyJobs()
	go js.runWeeklyJobs()

	slog.Info("aggregation job scheduler started")
}

// Stop stops the job scheduler
func (js *JobScheduler) Stop() {
	close(js.stopChan)
	slog.Info("aggregation job scheduler stopped")
}

// runFourHourJobs schedules and executes 4-hour aggregation jobs.
// It waits until the start of the next 4-hour block, then runs aggregation every 4 hours
// at the beginning of each 4-hour period (e.g., 00:00, 04:00, 08:00, 12:00, 16:00, 20:00).
func (js *JobScheduler) runFourHourJobs() {
	now := time.Now()
	if now.Hour()%4 == 0 && now.Minute() == 0 {
		js.runFourHourAggregation()
	}

	nextFourHour := now.Truncate(4 * time.Hour).Add(4 * time.Hour)
	delay := nextFourHour.Sub(now)
	time.Sleep(delay)

	ticker := time.NewTicker(4 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-js.stopChan:
			return
		case <-ticker.C:
			js.runFourHourAggregation()
		}
	}
}

// runDailyJobs schedules and executes daily aggregation jobs.
// It waits until midnight (00:00) of the next day, then runs aggregation
// every day at midnight for consistent daily snapshots.
func (js *JobScheduler) runDailyJobs() {
	now := time.Now()
	if now.Hour() == 0 && now.Minute() == 0 {
		js.runDailyAggregation()
	}

	nextDay := now.Truncate(24 * time.Hour).Add(24 * time.Hour)
	delay := nextDay.Sub(now)
	time.Sleep(delay)

	ticker := time.NewTicker(24 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-js.stopChan:
			return
		case <-ticker.C:
			js.runDailyAggregation()
		}
	}
}

// runWeeklyJobs schedules and executes weekly aggregation jobs.
// It waits until the start of the next week (Monday 00:00), then runs aggregation
// every week for consistent weekly snapshots.
func (js *JobScheduler) runWeeklyJobs() {
	now := time.Now()
	if now.Weekday() == time.Monday && now.Hour() == 0 && now.Minute() == 0 {
		js.runWeeklyAggregation()
	}

	// Wait until next Monday
	daysUntilMonday := (8 - int(now.Weekday())) % 7
	if daysUntilMonday == 0 {
		daysUntilMonday = 7
	}
	nextMonday := now.Truncate(24*time.Hour).AddDate(0, 0, daysUntilMonday)
	delay := nextMonday.Sub(now)
	time.Sleep(delay)

	ticker := time.NewTicker(7 * 24 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-js.stopChan:
			return
		case <-ticker.C:
			js.runWeeklyAggregation()
		}
	}
}

// runFourHourAggregation executes 4-hour aggregation for all markets.
// It truncates the current time to the 4-hour boundary and processes all markets
// with 4-hour resolution snapshots.
func (js *JobScheduler) runFourHourAggregation() {
	now := time.Now().Truncate(4 * time.Hour)
	js.runAggregationForAllMarkets(FourHour, now)
}

// runDailyAggregation executes daily aggregation for all markets.
// It truncates the current time to the day boundary and processes all markets
// with daily resolution snapshots.
func (js *JobScheduler) runDailyAggregation() {
	now := time.Now().Truncate(24 * time.Hour)
	js.runAggregationForAllMarkets(Daily, now)
}

// runWeeklyAggregation executes weekly aggregation for all markets.
// It truncates the current time to the week boundary and processes all markets
// with weekly resolution snapshots.
func (js *JobScheduler) runWeeklyAggregation() {
	now := time.Now().Truncate(7 * 24 * time.Hour)
	js.runAggregationForAllMarkets(Weekly, now)
}

// runAggregationForAllMarkets executes aggregation jobs for all markets at the specified resolution.
// It fetches all market IDs from the database and spawns goroutines to create snapshots
// for each market concurrently. Each snapshot is created with the given timestamp and
// resolution (4hour, daily, or weekly).
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
			case FourHour:
				err = js.aggregator.CreateFourHourSnapshot(marketID, timestamp)
			case Daily:
				err = js.aggregator.CreateDailySnapshot(marketID, timestamp)
			case Weekly:
				err = js.aggregator.CreateWeeklySnapshot(marketID, timestamp)
			}

			if err != nil {
				slog.Error("failed to create snapshot", "market_id", marketID, "resolution", resolution, "error", err)
			}
		}(marketID)
	}

	slog.Info("started aggregation jobs", "resolution", resolution, "market_count", len(markets), "timestamp", timestamp)
}

// getAllMarketIDs retrieves all market IDs from the Firestore database.
func (js *JobScheduler) getAllMarketIDs() ([]string, error) {
	ctx := context.Background()
	docs, err := js.client.Collection("markets").Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}

	var marketIDs []string
	for _, doc := range docs {
		var market model.Market
		if err := doc.DataTo(&market); err != nil {
			continue
		}
		marketIDs = append(marketIDs, market.ID)
	}

	return marketIDs, nil
}
