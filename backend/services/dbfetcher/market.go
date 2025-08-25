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
	ctx := context.Background()
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")

	var startTime, endTime time.Time
	if startTimeStr != "" {
		startTime = utils.ParseTime(startTimeStr, "market APR history query start time")
	}
	if endTimeStr != "" {
		endTime = utils.ParseTime(endTimeStr, "market APR history query end time")
	}

	query := client.Collection("markets").Doc(sanitizedMarketID).Collection("apr").OrderBy("timestamp", firestore.Asc)

	if !startTime.IsZero() {
		query = query.Where("timestamp", ">=", startTime)
	}

	if !endTime.IsZero() {
		query = query.Where("timestamp", "<=", endTime)
	}

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		slog.Error("Error fetching market APR history", "market_id", marketID, "error", err)
		return nil, err
	}

	var dataArray []model.APRHistory
	for _, doc := range docs {
		var aprData model.APRHistory
		if err := doc.DataTo(&aprData); err != nil {
			slog.Error("Error parsing APR history data", "market_id", marketID, "doc_id", doc.Ref.ID, "error", err)
			continue
		}
		dataArray = append(dataArray, aprData)
	}

	return dataArray, nil
}

// GetMarketTotalBorrowHistory retrieves total borrow history data for a specific market
func GetMarketTotalBorrowHistory(client *firestore.Client, marketID, startTimeStr, endTimeStr string) ([]model.TotalBorrowHistory, error) {
	ctx := context.Background()
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")

	var startTime, endTime time.Time
	if startTimeStr != "" {
		startTime = utils.ParseTime(startTimeStr, "market total borrow history query start time")
	}
	if endTimeStr != "" {
		endTime = utils.ParseTime(endTimeStr, "market total borrow history query end time")
	}

	query := client.Collection("markets").Doc(sanitizedMarketID).Collection("total_borrow").OrderBy("timestamp", firestore.Asc)

	if !startTime.IsZero() {
		query = query.Where("timestamp", ">=", startTime)
	}

	if !endTime.IsZero() {
		query = query.Where("timestamp", "<=", endTime)
	}

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		slog.Error("Error fetching market total borrow history", "market_id", marketID, "error", err)
		return nil, err
	}

	var dataArray []model.TotalBorrowHistory
	for _, doc := range docs {
		var borrowData model.TotalBorrowHistory
		if err := doc.DataTo(&borrowData); err != nil {
			slog.Error("Error parsing total borrow history data", "market_id", marketID, "doc_id", doc.Ref.ID, "error", err)
			continue
		}
		dataArray = append(dataArray, borrowData)
	}

	return dataArray, nil
}

// GetMarketTotalSupplyHistory retrieves total supply history data for a specific market
func GetMarketTotalSupplyHistory(client *firestore.Client, marketID, startTimeStr, endTimeStr string) ([]model.TotalSupplyHistory, error) {
	ctx := context.Background()
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")

	var startTime, endTime time.Time
	if startTimeStr != "" {
		startTime = utils.ParseTime(startTimeStr, "market total supply history query start time")
	}
	if endTimeStr != "" {
		endTime = utils.ParseTime(endTimeStr, "market total supply history query end time")
	}

	query := client.Collection("markets").Doc(sanitizedMarketID).Collection("total_supply").OrderBy("timestamp", firestore.Asc)

	if !startTime.IsZero() {
		query = query.Where("timestamp", ">=", startTime)
	}

	if !endTime.IsZero() {
		query = query.Where("timestamp", "<=", endTime)
	}

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		slog.Error("Error fetching market total supply history", "market_id", marketID, "error", err)
		return nil, err
	}

	var dataArray []model.TotalSupplyHistory
	for _, doc := range docs {
		var supplyData model.TotalSupplyHistory
		if err := doc.DataTo(&supplyData); err != nil {
			slog.Error("Error parsing total supply history data", "market_id", marketID, "doc_id", doc.Ref.ID, "error", err)
			continue
		}
		dataArray = append(dataArray, supplyData)
	}

	return dataArray, nil
}

// GetMarketUtilizationHistory retrieves utilization history data for a specific market
func GetMarketUtilizationHistory(client *firestore.Client, marketID, startTimeStr, endTimeStr string) ([]model.UtilizationHistory, error) {
	ctx := context.Background()
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")

	var startTime, endTime time.Time
	if startTimeStr != "" {
		startTime = utils.ParseTime(startTimeStr, "market utilization history query start time")
	}
	if endTimeStr != "" {
		endTime = utils.ParseTime(endTimeStr, "market utilization history query end time")
	}

	query := client.Collection("markets").Doc(sanitizedMarketID).Collection("utilization").OrderBy("timestamp", firestore.Asc)

	if !startTime.IsZero() {
		query = query.Where("timestamp", ">=", startTime)
	}

	if !endTime.IsZero() {
		query = query.Where("timestamp", "<=", endTime)
	}

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		slog.Error("Error fetching market utilization history", "market_id", marketID, "error", err)
		return nil, err
	}

	var dataArray []model.UtilizationHistory
	for _, doc := range docs {
		var utilizationData model.UtilizationHistory
		if err := doc.DataTo(&utilizationData); err != nil {
			slog.Error("Error parsing utilization history data", "market_id", marketID, "doc_id", doc.Ref.ID, "error", err)
			continue
		}
		dataArray = append(dataArray, utilizationData)
	}

	return dataArray, nil
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
