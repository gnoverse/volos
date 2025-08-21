package dbfetcher

import (
	"context"
	"log/slog"
	"strings"

	"volos-backend/model"

	"cloud.google.com/go/firestore"
)

// MarketsResponse represents the response structure for market listings
type MarketsResponse struct {
	Markets []map[string]interface{} `json:"markets"`
	HasMore bool                     `json:"has_more"`
	LastID  string                   `json:"last_id"`
}

// GetMarkets retrieves all markets from Firestore with cursor-based pagination
func GetMarkets(client *firestore.Client, limit int, lastDocID string) (*MarketsResponse, error) {
	ctx := context.Background()

	query := client.Collection("markets").OrderBy("created_at", firestore.Desc)

	if lastDocID != "" {
		lastDoc, err := client.Collection("markets").Doc(lastDocID).Get(ctx)
		if err != nil {
			slog.Error("Error fetching last document for pagination",
				"last_doc_id", lastDocID,
				"error", err,
			)
			return nil, err
		}
		query = query.StartAfter(lastDoc)
	}

	if limit > 0 {
		query = query.Limit(limit)
	} else {
		query = query.Limit(20) // Default limit
	}

	docs, err := query.Documents(ctx).GetAll()
	if err != nil {
		slog.Error("Error fetching markets",
			"limit", limit,
			"last_doc_id", lastDocID,
			"error", err,
		)
		return nil, err
	}

	var markets []map[string]interface{}
	for _, doc := range docs {
		var market model.MarketData
		if err := doc.DataTo(&market); err != nil {
			slog.Error("Error parsing market data",
				"doc_id", doc.Ref.ID,
				"error", err,
			)
			continue
		}

		marketMap := map[string]interface{}{
			"id":                 market.ID,
			"loan_token":         market.LoanToken,
			"collateral_token":   market.CollateralToken,
			"total_supply":       market.TotalSupply,
			"total_borrow":       market.TotalBorrow,
			"current_supply_apr": market.CurrentSupplyAPR,
			"current_borrow_apr": market.CurrentBorrowAPR,
			"created_at":         market.CreatedAt,
			"updated_at":         market.UpdatedAt,
		}

		markets = append(markets, marketMap)
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
func GetMarket(client *firestore.Client, marketID string) (map[string]interface{}, error) {
	ctx := context.Background()
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")

	doc, err := client.Collection("markets").Doc(sanitizedMarketID).Get(ctx)
	if err != nil {
		slog.Error("Error fetching market",
			"market_id", marketID,
			"error", err,
		)
		return nil, err
	}

	var market model.MarketData
	if err := doc.DataTo(&market); err != nil {
		slog.Error("Error parsing market data",
			"market_id", marketID,
			"error", err,
		)
		return nil, err
	}

	marketMap := map[string]interface{}{
		"id":                 market.ID,
		"loan_token":         market.LoanToken,
		"collateral_token":   market.CollateralToken,
		"total_supply":       market.TotalSupply,
		"total_borrow":       market.TotalBorrow,
		"current_supply_apr": market.CurrentSupplyAPR,
		"current_borrow_apr": market.CurrentBorrowAPR,
		"created_at":         market.CreatedAt,
		"updated_at":         market.UpdatedAt,
	}

	return marketMap, nil
}
