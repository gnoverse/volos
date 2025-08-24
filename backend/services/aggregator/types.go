package aggregator

import (
	"time"
)

type TimeBucketResolution string

const (
	FourHour TimeBucketResolution = "4hour"
	Daily    TimeBucketResolution = "daily"
	Weekly   TimeBucketResolution = "weekly"
)

// MarketSnapshot represents a pre-aggregated snapshot of market data at a specific time resolution.
// These snapshots are stored in bucket collections to enable fast queries for different timeframes.
type MarketSnapshot struct {
	MarketID        string               `firestore:"market_id" json:"market_id"`               // Market identifier
	Timestamp       time.Time            `firestore:"timestamp" json:"timestamp"`               // When this snapshot was taken
	Resolution      TimeBucketResolution `firestore:"resolution" json:"resolution"`             // Time resolution (4hour, daily, weekly)
	SupplyAPR       float64              `firestore:"supply_apr" json:"supply_apr"`             // Average supply APR for this period
	BorrowAPR       float64              `firestore:"borrow_apr" json:"borrow_apr"`             // Average borrow APR for this period
	TotalSupply     string               `firestore:"total_supply" json:"total_supply"`         // Total supply at end of period (u256 string)
	TotalBorrow     string               `firestore:"total_borrow" json:"total_borrow"`         // Total borrow at end of period (u256 string)
	UtilizationRate float64              `firestore:"utilization_rate" json:"utilization_rate"` // Utilization rate (borrow/supply) as percentage
	CreatedAt       time.Time            `firestore:"created_at" json:"created_at"`             // When this snapshot was created
}

// AggregationJob represents a scheduled job for creating market snapshots
type AggregationJob struct {
	ID           string               `firestore:"id" json:"id"`                       // Unique job identifier
	MarketID     string               `firestore:"market_id" json:"market_id"`         // Market to aggregate
	Resolution   TimeBucketResolution `firestore:"resolution" json:"resolution"`       // Time resolution
	StartTime    time.Time            `firestore:"start_time" json:"start_time"`       // Start of aggregation period
	EndTime      time.Time            `firestore:"end_time" json:"end_time"`           // End of aggregation period
	Status       string               `firestore:"status" json:"status"`               // Job status: "pending", "running", "completed", "failed"
	CreatedAt    time.Time            `firestore:"created_at" json:"created_at"`       // When job was created
	CompletedAt  *time.Time           `firestore:"completed_at" json:"completed_at"`   // When job completed (if applicable)
	ErrorMessage string               `firestore:"error_message" json:"error_message"` // Error message if failed
}

// MarketAverages holds calculated average values for market metrics over a time period.
type MarketAverages struct {
	SupplyAPR       float64 `json:"supply_apr"`
	BorrowAPR       float64 `json:"borrow_apr"`
	UtilizationRate float64 `json:"utilization_rate"`
	TotalSupply     string  `json:"total_supply"`
	TotalBorrow     string  `json:"total_borrow"`
}
