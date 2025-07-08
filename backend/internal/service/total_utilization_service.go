package service

import (
	"encoding/json"
	"volos-backend/internal/indexer"
)

type UtilizationEvent struct {
	Value     float64 `json:"value"`
	Timestamp string  `json:"timestamp"`
}

// GetUtilizationHistory fetches all supply, withdraw, borrow, and repay events for a given marketId from the indexer,
// aggregates them by block height, and returns the running utilization rate over time with real block timestamps.
//
// Utilization rate is calculated as: (totalBorrow / totalSupply) * 100, recalculated at each event.
//
// Returns:
//   - []UtilizationEvent: Each entry contains the utilization rate and the corresponding block timestamp.
//   - error: Any error encountered during the process.
func GetUtilizationHistory(marketId string) ([]UtilizationEvent, error) {
	supplyQB := indexer.NewQueryBuilder("getSupplyEvents", indexer.SupplyBorrowFields)
	supplyQB.Where().Success(true).EventType("Deposit").MarketId(marketId)
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

	withdrawQB := indexer.NewQueryBuilder("getWithdrawEvents", indexer.SupplyBorrowFields)
	withdrawQB.Where().Success(true).EventType("Withdraw").MarketId(marketId)
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

	borrowQB := indexer.NewQueryBuilder("getBorrowEvents", indexer.SupplyBorrowFields)
	borrowQB.Where().Success(true).EventType("Borrow").MarketId(marketId)
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

	repayQB := indexer.NewQueryBuilder("getRepayEvents", indexer.SupplyBorrowFields)
	repayQB.Where().Success(true).EventType("Repay").MarketId(marketId)
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

	heightSet := make(map[int64]struct{})
	supplyEvents := extractEvents(supplyData.Data.GetTransactions, 1, heightSet)
	withdrawEvents := extractEvents(withdrawData.Data.GetTransactions, -1, heightSet)
	borrowEvents := extractEvents(borrowData.Data.GetTransactions, 1, heightSet)
	repayEvents := extractEvents(repayData.Data.GetTransactions, -1, heightSet)

	type blockDelta struct {
		supply float64
		borrow float64
	}
	deltas := make(map[int64]*blockDelta)
	for _, ev := range supplyEvents {
		if deltas[ev.BlockHeight] == nil {
			deltas[ev.BlockHeight] = &blockDelta{}
		}
		deltas[ev.BlockHeight].supply += ev.Value
	}
	for _, ev := range withdrawEvents {
		if deltas[ev.BlockHeight] == nil {
			deltas[ev.BlockHeight] = &blockDelta{}
		}
		deltas[ev.BlockHeight].supply += ev.Value
	}
	for _, ev := range borrowEvents {
		if deltas[ev.BlockHeight] == nil {
			deltas[ev.BlockHeight] = &blockDelta{}
		}
		deltas[ev.BlockHeight].borrow += ev.Value
	}
	for _, ev := range repayEvents {
		if deltas[ev.BlockHeight] == nil {
			deltas[ev.BlockHeight] = &blockDelta{}
		}
		deltas[ev.BlockHeight].borrow += ev.Value
	}

	var heights []int64
	for h := range heightSet {
		heights = append(heights, h)
	}

	heightToTime, err := FetchBlockTimestamps(heights)
	if err != nil {
		return nil, err
	}

	var result []UtilizationEvent
	var runningSupply, runningBorrow float64
	sortedHeights := heights
	for i := 0; i < len(sortedHeights)-1; i++ {
		for j := i + 1; j < len(sortedHeights); j++ {
			if sortedHeights[i] > sortedHeights[j] {
				sortedHeights[i], sortedHeights[j] = sortedHeights[j], sortedHeights[i]
			}
		}
	}
	for _, h := range sortedHeights {
		delta := deltas[h]
		if delta != nil {
			runningSupply += delta.supply
			runningBorrow += delta.borrow
		}
		utilization := 0.0
		if runningSupply > 0 {
			utilization = (runningBorrow / runningSupply) * 100
		}
		result = append(result, UtilizationEvent{
			Value:     utilization,
			Timestamp: heightToTime[h],
		})
	}
	return result, nil
}
