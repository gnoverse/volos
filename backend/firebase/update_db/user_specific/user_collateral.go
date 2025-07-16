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

// GetOrUpdateUserCollateralHistory retrieves a user's collateral history for a market
// from Firestore, updating it with new events from the indexer if needed.
//
// If cached data exists, only new events since the last block are fetched and appended,
// updating the running total and metadata. If not, all events are fetched and stored.
//
// Returns the full, cumulative collateral history sorted by timestamp.
func GetOrUpdateUserCollateralHistory(client *firestore.Client, caller string, marketId string) ([]model.Data, error) {
	ctx := context.Background()
	userDoc := client.Collection("users").Doc(caller)
	collateralHistoryCol := userDoc.Collection("collateral_history")
	metadataDoc := collateralHistoryCol.Doc("metadata")
	metaDoc, err := metadataDoc.Get(ctx)

	var latestBlockHeight int
	var latestCollateralValue float64
	if err == nil {
		if bh, ok := metaDoc.Data()["block_height"].(int64); ok {
			latestBlockHeight = int(bh)
		} else if bhf, ok := metaDoc.Data()["block_height"].(float64); ok {
			latestBlockHeight = int(bhf)
		}
		if lv, ok := metaDoc.Data()["latest_collateral_value"].(float64); ok {
			latestCollateralValue = lv
		}
	}

	docs, err := collateralHistoryCol.Documents(ctx).GetAll()
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

	supplyQB := indexer.NewQueryBuilder("getSupplyCollateralEvents", indexer.SupplyBorrowFields)
	whereSupply := supplyQB.Where().Success(true).EventType("SupplyCollateral").Caller(caller).MarketId(marketId).PkgPath(model.VolosPkgPath)
	if minBlockHeight != nil {
		whereSupply.BlockHeightRange(minBlockHeight, nil)
	}

	supplyResp, err := supplyQB.Execute()
	if err != nil {
		return nil, err
	}

	var supplyData struct {
		Data struct {
			GetTransactions []map[string]interface{} `json:"getTransactions"`
		} `json:"data"`
	}
	json.Unmarshal(supplyResp, &supplyData)

	withdrawQB := indexer.NewQueryBuilder("getWithdrawCollateralEvents", indexer.SupplyBorrowFields)
	whereWithdraw := withdrawQB.Where().Success(true).EventType("WithdrawCollateral").Caller(caller).MarketId(marketId).PkgPath(model.VolosPkgPath)
	if minBlockHeight != nil {
		whereWithdraw.BlockHeightRange(minBlockHeight, nil)
	}

	withdrawResp, err := withdrawQB.Execute()
	if err != nil {
		return nil, err
	}

	var withdrawData struct {
		Data struct {
			GetTransactions []map[string]interface{} `json:"getTransactions"`
		} `json:"data"`
	}
	json.Unmarshal(withdrawResp, &withdrawData)

	supplyEvents := services.ParseEvents(supplyData.Data.GetTransactions, 1)
	withdrawEvents := services.ParseEvents(withdrawData.Data.GetTransactions, -1)
	allEvents := append(supplyEvents, withdrawEvents...)

	var heights []int64
	for _, ev := range allEvents {
		heights = append(heights, ev.BlockHeight)
	}

	heightToTime, _ := services.FetchBlockTimestamps(heights)
	bulkWriter := client.BulkWriter(ctx)
	maxBlock := latestBlockHeight
	runningTotal := latestCollateralValue

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
		_, _ = bulkWriter.Create(collateralHistoryCol.Doc(timestamp), newEvent)
		if int(ev.BlockHeight) > maxBlock {
			maxBlock = int(ev.BlockHeight)
		}
	}

	if len(newEvents) > 0 && maxBlock > latestBlockHeight {
		_, _ = bulkWriter.Set(metadataDoc, map[string]interface{}{
			"block_height":            maxBlock,
			"latest_collateral_value": runningTotal,
		})
	}

	bulkWriter.End()
	combined := append(existing, newEvents...)
	sort.Slice(combined, func(i, j int) bool {
		return combined[i].Timestamp < combined[j].Timestamp
	})

	return combined, nil
}

// GetUserCollateralHistory fetches all SupplyCollateral and WithdrawCollateral events for a given caller and marketId
// from the indexer and returns the running total collateral supplied over time with real block timestamps.
//
// This function always fetches all relevant events from the indexer (optionally after a given minBlockHeight),
// parses them, and computes the running total by summing supply and subtracting withdraw events.
// The result is a slice of Data, each entry containing the user's total collateral at a given block timestamp.
func GetUserCollateralHistory(caller string, marketId string, minBlockHeight *int) ([]model.Data, error) {
	supplyQB := indexer.NewQueryBuilder("getSupplyCollateralEvents", indexer.SupplyBorrowFields)
	whereSupply := supplyQB.Where().Success(true).EventType("SupplyCollateral").Caller(caller).MarketId(marketId).PkgPath(model.VolosPkgPath)
	if minBlockHeight != nil {
		whereSupply.BlockHeightRange(minBlockHeight, nil)
	}

	supplyResp, err := supplyQB.Execute()
	if err != nil {
		return nil, err
	}

	var supplyData struct {
		Data struct {
			GetTransactions []map[string]interface{} `json:"getTransactions"`
		} `json:"data"`
	}
	json.Unmarshal(supplyResp, &supplyData)

	withdrawQB := indexer.NewQueryBuilder("getWithdrawCollateralEvents", indexer.SupplyBorrowFields)
	whereWithdraw := withdrawQB.Where().Success(true).EventType("WithdrawCollateral").Caller(caller).MarketId(marketId).PkgPath(model.VolosPkgPath)
	if minBlockHeight != nil {
		whereWithdraw.BlockHeightRange(minBlockHeight, nil)
	}

	withdrawResp, err := withdrawQB.Execute()
	if err != nil {
		return nil, err
	}

	var withdrawData struct {
		Data struct {
			GetTransactions []map[string]interface{} `json:"getTransactions"`
		} `json:"data"`
	}
	json.Unmarshal(withdrawResp, &withdrawData)

	supplyEvents := services.ParseEvents(supplyData.Data.GetTransactions, 1)
	withdrawEvents := services.ParseEvents(withdrawData.Data.GetTransactions, -1)
	events := append(supplyEvents, withdrawEvents...)
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
