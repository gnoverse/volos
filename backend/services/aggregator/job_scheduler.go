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

// runHourlyJobs schedules and executes hourly aggregation jobs.
// It waits until the start of the next hour, then runs aggregation every hour
// at the beginning of each hour (e.g., 14:00, 15:00, 16:00).
func (js *JobScheduler) runHourlyJobs() {
	now := time.Now()
	if now.Minute() == 0 {
		js.runHourlyAggregation()
	}

	nextHour := now.Truncate(time.Hour).Add(1 * time.Hour)
	delay := nextHour.Sub(now)
	time.Sleep(delay)

	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()

	for {
		select {
		case <-js.stopChan:
			return
		case <-ticker.C:
			js.runHourlyAggregation()
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
// It waits until Monday 00:00 of the next week, then runs aggregation
// every Monday at midnight for consistent weekly snapshots.
func (js *JobScheduler) runWeeklyJobs() {
	now := time.Now()
	if now.Weekday() == time.Monday && now.Hour() == 0 && now.Minute() == 0 {
		js.runWeeklyAggregation()
	}

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

// runMonthlyJobs schedules and executes monthly aggregation jobs.
// It waits until the 1st of the next month at 00:00, then runs aggregation
// every month on the 1st for consistent monthly snapshots that align with
// calendar months.
func (js *JobScheduler) runMonthlyJobs() {
	now := time.Now()
	if now.Day() == 1 && now.Hour() == 0 && now.Minute() == 0 {
		js.runMonthlyAggregation()
	}

	nextMonth := now.AddDate(0, 1, 0)
	firstOfNextMonth := time.Date(nextMonth.Year(), nextMonth.Month(), 1, 0, 0, 0, 0, now.Location())
	delay := firstOfNextMonth.Sub(now)
	time.Sleep(delay)

	for {
		select {
		case <-js.stopChan:
			return
		default:
			js.runMonthlyAggregation()

			nextMonth := time.Now().AddDate(0, 1, 0)
			firstOfNextMonth := time.Date(nextMonth.Year(), nextMonth.Month(), 1, 0, 0, 0, 0, time.Now().Location())
			delay := time.Until(firstOfNextMonth)

			timer := time.NewTimer(delay)
			select {
			case <-js.stopChan:
				timer.Stop()
				return
			case <-timer.C:
			}
		}
	}
}

// runHourlyAggregation executes hourly aggregation for all markets.
// It truncates the current time to the hour boundary and processes all markets
// with hourly resolution snapshots.
func (js *JobScheduler) runHourlyAggregation() {
	now := time.Now().Truncate(time.Hour)
	js.runAggregationForAllMarkets(Hourly, now)
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

// runMonthlyAggregation executes monthly aggregation for all markets.
// It truncates the current time to the month boundary and processes all markets
// with monthly resolution snapshots.
func (js *JobScheduler) runMonthlyAggregation() {
	now := time.Now().Truncate(30 * 24 * time.Hour)
	js.runAggregationForAllMarkets(Monthly, now)
}

// runAggregationForAllMarkets executes aggregation jobs for all markets at the specified resolution.
// It fetches all market IDs from the database and spawns goroutines to create snapshots
// for each market concurrently. Each snapshot is created with the given timestamp and
// resolution (hourly, daily, weekly, or monthly).
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
