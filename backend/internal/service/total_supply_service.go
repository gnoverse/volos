package service

import (
	"encoding/json"
	"sort"
	"strconv"
	"volos-backend/internal/indexer"
)

type TotalSupplyEvent struct {
	Value     float64 `json:"value"`
	Timestamp int64   `json:"timestamp"`
}

func GetTotalSupplyHistory(marketId string) ([]TotalSupplyEvent, error) {
	// 1. Fetch deposit events
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

	// 2. Fetch withdraw events
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

	// 3. Parse and combine events
	type Event struct {
		Value     float64
		Timestamp int64
	}
	var events []Event

	extract := func(tx map[string]interface{}, sign float64) {
		timestamp := int64(0)
		if ts, ok := tx["block_height"].(float64); ok {
			timestamp = int64(ts)
		}
		if response, ok := tx["response"].(map[string]interface{}); ok {
			if eventsArr, ok := response["events"].([]interface{}); ok {
				for _, ev := range eventsArr {
					if evMap, ok := ev.(map[string]interface{}); ok {
						if attrs, ok := evMap["attrs"].([]interface{}); ok {
							for _, attr := range attrs {
								if attrMap, ok := attr.(map[string]interface{}); ok {
									if attrMap["key"] == "amount" {
										amountStr := attrMap["value"].(string)
										if amountStr != "" {
											if val, err := strconv.ParseFloat(amountStr, 64); err == nil {
												events = append(events, Event{Value: sign * val, Timestamp: timestamp})
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}

	for _, tx := range depositsData.Data.GetTransactions {
		// Get the block_height for this transaction
		timestamp := int64(0)
		if ts, ok := tx["block_height"].(float64); ok {
			timestamp = int64(ts)
		}
		if response, ok := tx["response"].(map[string]interface{}); ok {
			if eventsArr, ok := response["events"].([]interface{}); ok {
				for _, ev := range eventsArr {
					if evMap, ok := ev.(map[string]interface{}); ok {
						if attrs, ok := evMap["attrs"].([]interface{}); ok {
							for _, attr := range attrs {
								if attrMap, ok := attr.(map[string]interface{}); ok {
									if attrMap["key"] == "amount" {
										amountStr := attrMap["value"].(string)
										if amountStr != "" {
											if val, err := strconv.ParseFloat(amountStr, 64); err == nil {
												events = append(events, Event{Value: 1 * val, Timestamp: timestamp})
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
	for _, tx := range withdrawsData.Data.GetTransactions {
		extract(tx, -1)
	}

	sort.Slice(events, func(i, j int) bool { return events[i].Timestamp < events[j].Timestamp })

	var result []TotalSupplyEvent
	runningTotal := 0.0
	for _, ev := range events {
		runningTotal += ev.Value
		result = append(result, TotalSupplyEvent{
			Value:     runningTotal,
			Timestamp: ev.Timestamp,
		})
	}

	return result, nil
}
