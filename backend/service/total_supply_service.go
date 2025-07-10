package service

import (
	"encoding/json"
	"volos-backend/indexer"
)

// GetTotalSupplyHistory fetches all deposit and withdraw events for a given marketId from the indexer,
// aggregates them by block height, and returns the running total supply over time with real block timestamps.
func GetTotalSupplyHistory(marketId string) ([]Data, error) {
	depositsQB := indexer.NewQueryBuilder("getSupplyEvents", indexer.SupplyBorrowFields)
	depositsQB.Where().Success(true).EventType("Deposit").MarketId(marketId)
	depositsResp, err := depositsQB.Execute()
	if err != nil {
		return nil, err
	}
	var depositsData struct {
		Data struct {
			GetTransactions []map[string]interface{} `json:"getTransactions"`
		} `json:"data"`
	}
	json.Unmarshal(depositsResp, &depositsData)

	withdrawsQB := indexer.NewQueryBuilder("getWithdrawEvents", indexer.SupplyBorrowFields)
	withdrawsQB.Where().Success(true).EventType("Withdraw").MarketId(marketId)
	withdrawsResp, err := withdrawsQB.Execute()
	if err != nil {
		return nil, err
	}

	var withdrawsData struct {
		Data struct {
			GetTransactions []map[string]interface{} `json:"getTransactions"`
		} `json:"data"`
	}

	json.Unmarshal(withdrawsResp, &withdrawsData)

	depositEvents := parseEvents(depositsData.Data.GetTransactions, 1)
	withdrawEvents := parseEvents(withdrawsData.Data.GetTransactions, -1)
	events := append(depositEvents, withdrawEvents...)

	var heights []int64
	for _, ev := range events {
		heights = append(heights, ev.BlockHeight)
	}

	heightToTime, err := FetchBlockTimestamps(heights)
	if err != nil {
		return nil, err
	}

	var result []Data
	runningTotal := 0.0
	for _, ev := range events {
		runningTotal += ev.Value
		result = append(result, Data{
			Value:     runningTotal,
			Timestamp: heightToTime[ev.BlockHeight],
		})
	}

	return result, nil
}
