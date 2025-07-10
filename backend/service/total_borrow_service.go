package service

import (
	"encoding/json"
	"volos-backend/indexer"
)

type TotalBorrowEvent struct {
	Value     float64 `json:"value"`
	Timestamp string  `json:"timestamp"`
}

type BorrowEvent struct {
	Value       float64
	BlockHeight int64
}

// GetTotalBorrowHistory fetches all borrow and repay events for a given marketId from the indexer,
// aggregates them by block height, and returns the running total borrow over time with real block timestamps.
func GetTotalBorrowHistory(marketId string) ([]TotalBorrowEvent, error) {
	borrowsQB := indexer.NewQueryBuilder("getBorrowEvents", indexer.SupplyBorrowFields)
	borrowsQB.Where().Success(true).EventType("Borrow").MarketId(marketId)
	borrowsResp, err := borrowsQB.Execute()
	if err != nil {
		return nil, err
	}
	var borrowsData struct {
		Data struct {
			GetTransactions []map[string]interface{} `json:"getTransactions"`
		} `json:"data"`
	}
	json.Unmarshal(borrowsResp, &borrowsData)

	repaysQB := indexer.NewQueryBuilder("getRepayEvents", indexer.SupplyBorrowFields)
	repaysQB.Where().Success(true).EventType("Repay").MarketId(marketId)
	repaysResp, err := repaysQB.Execute()
	if err != nil {
		return nil, err
	}
	var repaysData struct {
		Data struct {
			GetTransactions []map[string]interface{} `json:"getTransactions"`
		} `json:"data"`
	}
	json.Unmarshal(repaysResp, &repaysData)

	borrowEvents := parseEvents(borrowsData.Data.GetTransactions, 1)
	repayEvents := parseEvents(repaysData.Data.GetTransactions, -1)
	events := append(borrowEvents, repayEvents...)

	var heights []int64
	for _, ev := range events {
		heights = append(heights, ev.BlockHeight)
	}

	heightToTime, err := FetchBlockTimestamps(heights)
	if err != nil {
		return nil, err
	}

	var result []TotalBorrowEvent
	runningTotal := 0.0
	for _, ev := range events {
		runningTotal += ev.Value
		result = append(result, TotalBorrowEvent{
			Value:     runningTotal,
			Timestamp: heightToTime[ev.BlockHeight],
		})
	}

	return result, nil
}
