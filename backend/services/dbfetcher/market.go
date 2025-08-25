package dbfetcher

import (
	"context"
	"log/slog"
	"strings"
	"time"

	"volos-backend/model"
	"volos-backend/services/aggregator"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
)

// MarketsResponse represents the response structure for market listings
type MarketsResponse struct {
	Markets []model.Market `json:"markets"`
	HasMore bool           `json:"has_more"`
	LastID  string         `json:"last_id"`
}

// GetMarkets retrieves all markets from Firestore with cursor-based pagination
func GetMarkets(client *firestore.Client, limit int, lastDocID string) (*MarketsResponse, error) {
	ctx := context.Background()

	query := client.Collection("markets").OrderBy("created_at", firestore.Desc)

	if lastDocID != "" {
		lastDoc, err := client.Collection("markets").Doc(lastDocID).Get(ctx)
		if err != nil {
			slog.Error("Error fetching last document for pagination", "last_doc_id", lastDocID, "error", err)
			return nil, err
		}
		query = query.StartAfter(lastDoc)
	}

	if limit > 0 {
		query = query.Limit(limit)
	} else {
		query = query.Limit(20)
	}

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		slog.Error("Error fetching markets", "limit", limit, "last_doc_id", lastDocID, "error", err)
		return nil, err
	}

	var markets []model.Market
	for _, doc := range docs {
		var market model.Market
		if err := doc.DataTo(&market); err != nil {
			slog.Error("Error parsing market data", "doc_id", doc.Ref.ID, "error", err)
			continue
		}

		markets = append(markets, market)
	}

	response := &MarketsResponse{
		Markets: markets,
		HasMore: len(docs) == limit,
		LastID:  "",
	}

	if len(docs) > 0 {
		response.LastID = docs[len(docs)-1].Ref.ID
	}

	return response, nil
}

// GetMarket retrieves a single market by ID from Firestore
func GetMarket(client *firestore.Client, marketID string) (*model.Market, error) {
	ctx := context.Background()
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")

	doc, err := client.Collection("markets").Doc(sanitizedMarketID).Get(ctx)
	if err != nil {
		slog.Error("Error fetching market", "market_id", marketID, "error", err)
		return nil, err
	}

	var market model.Market
	if err := doc.DataTo(&market); err != nil {
		slog.Error("Error parsing market data", "market_id", marketID, "error", err)
		return nil, err
	}

	return &market, nil
}

// GetMarketAPRHistory retrieves APR history data for a specific market
func GetMarketAPRHistory(client *firestore.Client, marketID, startTimeStr, endTimeStr string) ([]model.APRHistory, error) {
	return getMarketHistoryInRange[model.APRHistory](client, marketID, "apr", []string{}, startTimeStr, endTimeStr, "market APR history")
}

// GetMarketTotalBorrowHistory retrieves total borrow history data for a specific market
func GetMarketTotalBorrowHistory(client *firestore.Client, marketID, startTimeStr, endTimeStr string) ([]model.MarketHistory, error) {
	return getMarketHistoryInRange[model.MarketHistory](client, marketID, "market_history", []string{"Borrow", "Repay", "Liquidate"}, startTimeStr, endTimeStr, "market total borrow history")
}

// GetMarketTotalSupplyHistory retrieves total supply history data for a specific market
func GetMarketTotalSupplyHistory(client *firestore.Client, marketID, startTimeStr, endTimeStr string) ([]model.MarketHistory, error) {
	return getMarketHistoryInRange[model.MarketHistory](client, marketID, "market_history", []string{"Supply", "Withdraw"}, startTimeStr, endTimeStr, "market total supply history")
}

// GetMarketTotalCollateralSupplyHistory retrieves total collateral supply history data for a specific market
func GetMarketTotalCollateralSupplyHistory(client *firestore.Client, marketID, startTimeStr, endTimeStr string) ([]model.MarketHistory, error) {
	return getMarketHistoryInRange[model.MarketHistory](client, marketID, "market_history", []string{"SupplyCollateral", "WithdrawCollateral"}, startTimeStr, endTimeStr, "market total collateral supply history")
}

// GetMarketUtilizationHistory retrieves utilization history data for a specific market
func GetMarketUtilizationHistory(client *firestore.Client, marketID, startTimeStr, endTimeStr string) ([]model.UtilizationHistory, error) {
	return getMarketHistoryInRange[model.UtilizationHistory](client, marketID, "utilization", []string{}, startTimeStr, endTimeStr, "market utilization history")
}

// GetMarketSnapshots retrieves aggregated market snapshots for a specific time period
func GetMarketSnapshots(client *firestore.Client, marketID, resolution, startTimeStr, endTimeStr string) ([]aggregator.MarketSnapshot, error) {
	ctx := context.Background()
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")

	var bucketCollection string
	switch resolution {
	case "4hour":
		bucketCollection = "snapshots_4hour"
	case "daily":
		bucketCollection = "snapshots_daily"
	case "weekly":
		bucketCollection = "snapshots_weekly"
	default:
		bucketCollection = "snapshots_daily"
	}

	var startTime, endTime time.Time
	if startTimeStr != "" {
		startTime = utils.ParseTime(startTimeStr, "market snapshots query start time")
	}
	if endTimeStr != "" {
		endTime = utils.ParseTime(endTimeStr, "market snapshots query end time")
	}

	query := client.Collection("markets").Doc(sanitizedMarketID).Collection(bucketCollection).OrderBy("timestamp", firestore.Asc)

	if !startTime.IsZero() {
		query = query.Where("timestamp", ">=", startTime)
	}

	if !endTime.IsZero() {
		query = query.Where("timestamp", "<=", endTime)
	}

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		slog.Error("Error fetching market snapshots", "market_id", marketID, "resolution", resolution, "error", err)
		return nil, err
	}

	var snapshots []aggregator.MarketSnapshot
	for _, doc := range docs {
		var snapshot aggregator.MarketSnapshot
		if err := doc.DataTo(&snapshot); err != nil {
			slog.Error("Error parsing snapshot data", "market_id", marketID, "doc_id", doc.Ref.ID, "error", err)
			continue
		}
		snapshots = append(snapshots, snapshot)
	}

	return snapshots, nil
}

// getMarketHistoryInRangeByEventType is a generic helper that fetches documents from the unified market_history collection
// based on event types and optional start/end times.
func getMarketHistoryInRange[T any](client *firestore.Client, marketID string, subcollection string, eventTypes []string, startTimeStr, endTimeStr, logContext string) ([]T, error) {
	ctx := context.Background()
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")

	var startTime, endTime time.Time
	if startTimeStr != "" {
		startTime = utils.ParseTime(startTimeStr, logContext+" query start time")
	}
	if endTimeStr != "" {
		endTime = utils.ParseTime(endTimeStr, logContext+" query end time")
	}

	query := client.Collection("markets").Doc(sanitizedMarketID).Collection(subcollection).OrderBy("timestamp", firestore.Asc)

	if !startTime.IsZero() {
		query = query.Where("timestamp", ">=", startTime)
	}
	if !endTime.IsZero() {
		query = query.Where("timestamp", "<=", endTime)
	}

	if len(eventTypes) > 0 {
		query = query.Where("event_type", "in", eventTypes)
	}

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		slog.Error("Error fetching "+logContext, "market_id", marketID, "error", err)
		return nil, err
	}

	var data []T
	for _, doc := range docs {
		var item T
		if err := doc.DataTo(&item); err != nil {
			slog.Error("Error parsing "+logContext+" data", "market_id", marketID, "doc_id", doc.Ref.ID, "error", err)
			continue
		}
		data = append(data, item)
	}
	return data, nil
}
