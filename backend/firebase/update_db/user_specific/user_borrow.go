package user_specific

import (
	"context"
	"encoding/json"
	"sort"
	"volos-backend/indexer"
	"volos-backend/model"
	"volos-backend/services"

	"cloud.google.com/go/firestore"
)

// GetOrUpdateUserBorrowHistory retrieves a user's borrow history for a market
// from Firestore, updating it with new events from the indexer if needed.
//
// If cached data exists, only new events since the last block are fetched and appended,
// updating the running total and metadata. If not, all events are fetched and stored.
//
// Returns the full, cumulative borrow history sorted by timestamp.
func GetOrUpdateUserBorrowHistory(client *firestore.Client, caller string, marketId string) ([]model.Data, error) {
	ctx := context.Background()
	userDoc := client.Collection("users").Doc(caller)
	borrowHistoryCol := userDoc.Collection("borrow_history")
	metadataDoc := borrowHistoryCol.Doc("metadata")
	metaDoc, err := metadataDoc.Get(ctx)

	var latestBlockHeight int
	var latestBorrowValue float64
	if err == nil {
		if bh, ok := metaDoc.Data()["block_height"].(int64); ok {
			latestBlockHeight = int(bh)
		} else if bhf, ok := metaDoc.Data()["block_height"].(float64); ok {
			latestBlockHeight = int(bhf)
		}
		if lv, ok := metaDoc.Data()["latest_borrow_value"].(float64); ok {
			latestBorrowValue = lv
		}
	}

	docs, err := borrowHistoryCol.Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}

	var existing []model.Data
	for _, doc := range docs {
		if doc.Ref.ID == "metadata" {
			continue
		}
		var d model.Data
		m := doc.Data()
		b, _ := json.Marshal(m)
		json.Unmarshal(b, &d)
		existing = append(existing, d)
	}

	var minBlockHeight *int
	if latestBlockHeight > 0 {
		next := latestBlockHeight + 1
		minBlockHeight = &next
	}

	borrowQB := indexer.NewQueryBuilder("getBorrowEventsByCaller", indexer.SupplyBorrowFields)
	whereBorrow := borrowQB.Where().Success(true).EventType("Borrow").Caller(caller).MarketId(marketId).PkgPath(model.VolosPkgPath)
	if minBlockHeight != nil {
		whereBorrow.BlockHeightRange(minBlockHeight, nil)
	}

	borrowResp, err := borrowQB.Execute()
	if err != nil {
		return nil, err
	}

	var borrowData struct {
		Data struct {
			GetTransactions []map[string]interface{} `json:"getTransactions"`
		} `json:"data"`
	}
	json.Unmarshal(borrowResp, &borrowData)

	repayQB := indexer.NewQueryBuilder("getRepayEventsByCaller", indexer.SupplyBorrowFields)
	whereRepay := repayQB.Where().Success(true).EventType("Repay").Caller(caller).MarketId(marketId).PkgPath(model.VolosPkgPath)
	if minBlockHeight != nil {
		whereRepay.BlockHeightRange(minBlockHeight, nil)
	}

	repayResp, err := repayQB.Execute()
	if err != nil {
		return nil, err
	}

	var repayData struct {
		Data struct {
			GetTransactions []map[string]interface{} `json:"getTransactions"`
		} `json:"data"`
	}
	json.Unmarshal(repayResp, &repayData)

	borrowEvents := services.ParseEvents(borrowData.Data.GetTransactions, 1)
	repayEvents := services.ParseEvents(repayData.Data.GetTransactions, -1)
	allEvents := append(borrowEvents, repayEvents...)

	var heights []int64
	for _, ev := range allEvents {
		heights = append(heights, ev.BlockHeight)
	}

	heightToTime, _ := services.FetchBlockTimestamps(heights)
	bulkWriter := client.BulkWriter(ctx)
	maxBlock := latestBlockHeight
	runningTotal := latestBorrowValue

	var newEvents []model.Data
	for _, ev := range allEvents {
		timestamp := heightToTime[ev.BlockHeight]
		if timestamp == "" {
			continue
		}

		runningTotal += ev.Value
		newEvent := model.Data{
			Value:     runningTotal,
			Timestamp: timestamp,
		}

		newEvents = append(newEvents, newEvent)
		_, _ = bulkWriter.Create(borrowHistoryCol.Doc(timestamp), newEvent)
		if int(ev.BlockHeight) > maxBlock {
			maxBlock = int(ev.BlockHeight)
		}
	}

	if len(newEvents) > 0 && maxBlock > latestBlockHeight {
		_, _ = bulkWriter.Set(metadataDoc, map[string]interface{}{
			"block_height":        maxBlock,
			"latest_borrow_value": runningTotal,
		})
	}

	bulkWriter.End()
	combined := append(existing, newEvents...)
	sort.Slice(combined, func(i, j int) bool {
		return combined[i].Timestamp < combined[j].Timestamp
	})

	return combined, nil
}

// GetUserBorrowHistory fetches all Borrow and Repay events for a given caller and marketId
// from the indexer and returns the running total borrowed over time with real block timestamps.
//
// This function always fetches all relevant events from the indexer (optionally after a given minBlockHeight),
// parses them, and computes the running total by summing borrow and subtracting repay events.
// The result is a slice of Data, each entry containing the user's total borrowed at a given block timestamp.
func GetUserBorrowHistory(caller string, marketId string, minBlockHeight *int) ([]model.Data, error) {
	borrowQB := indexer.NewQueryBuilder("getBorrowEventsByCaller", indexer.SupplyBorrowFields)
	whereBorrow := borrowQB.Where().Success(true).EventType("Borrow").Caller(caller).MarketId(marketId).PkgPath(model.VolosPkgPath)
	if minBlockHeight != nil {
		whereBorrow.BlockHeightRange(minBlockHeight, nil)
	}

	borrowResp, err := borrowQB.Execute()
	if err != nil {
		return nil, err
	}

	var borrowData struct {
		Data struct {
			GetTransactions []map[string]interface{} `json:"getTransactions"`
		} `json:"data"`
	}
	json.Unmarshal(borrowResp, &borrowData)

	repayQB := indexer.NewQueryBuilder("getRepayEventsByCaller", indexer.SupplyBorrowFields)
	whereRepay := repayQB.Where().Success(true).EventType("Repay").Caller(caller).MarketId(marketId).PkgPath(model.VolosPkgPath)
	if minBlockHeight != nil {
		whereRepay.BlockHeightRange(minBlockHeight, nil)
	}

	repayResp, err := repayQB.Execute()
	if err != nil {
		return nil, err
	}

	var repayData struct {
		Data struct {
			GetTransactions []map[string]interface{} `json:"getTransactions"`
		} `json:"data"`
	}
	json.Unmarshal(repayResp, &repayData)

	borrowEvents := services.ParseEvents(borrowData.Data.GetTransactions, 1)
	repayEvents := services.ParseEvents(repayData.Data.GetTransactions, -1)
	events := append(borrowEvents, repayEvents...)
	var heights []int64
	for _, ev := range events {
		heights = append(heights, ev.BlockHeight)
	}

	heightToTime, err := services.FetchBlockTimestamps(heights)
	if err != nil {
		return nil, err
	}

	var result []model.Data
	runningTotal := 0.0
	for _, ev := range events {
		runningTotal += ev.Value
		result = append(result, model.Data{
			Value:     runningTotal,
			Timestamp: heightToTime[ev.BlockHeight],
		})
	}

	return result, nil
}
