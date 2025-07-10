package service

import (
	"encoding/json"
	"sort"
	"strconv"
	"volos-backend/indexer"
)

// Reuse Event type from total_supply_service.go
type UserLoanEvent struct {
	Value     float64 `json:"value"`
	Timestamp string  `json:"timestamp"`
}

// GetUserLoanHistory fetches all borrow and repay events for a given caller (user address),
// aggregates them by block height, and returns the running total fiat value over time.
func GetUserLoanHistory(caller string) ([]UserLoanEvent, error) {
	// Query all borrow events for the caller
	borrowsQB := indexer.NewQueryBuilder("getBorrowEventsByCaller", indexer.SupplyBorrowFields)
	borrowsQB.Where().Success(true).EventType("Borrow").Caller(caller)
	println("borrowsQB", borrowsQB.Build())
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

	// Query all repay events for the caller
	repaysQB := indexer.NewQueryBuilder("getRepayEventsByCaller", indexer.SupplyBorrowFields)
	repaysQB.Where().Success(true).EventType("Repay").Caller(caller)
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

	// Track unique marketIds and block heights
	marketIdMap := make(map[string]float64) // marketId -> mock fiat value (1)
	heightSet := make(map[int64]struct{})

	// Parse events
	borrowEvents := parseUserEvents(borrowsData.Data.GetTransactions, 1, marketIdMap, heightSet)
	repayEvents := parseUserEvents(repaysData.Data.GetTransactions, -1, marketIdMap, heightSet)
	allEvents := append(borrowEvents, repayEvents...)

	// Sort events by block height (timestamp)
	sort.Slice(allEvents, func(i, j int) bool {
		return allEvents[i].BlockHeight < allEvents[j].BlockHeight
	})

	// Get all unique block heights
	var heights []int64
	for h := range heightSet {
		heights = append(heights, h)
	}

	// Fetch block timestamps using utils.go
	heightToTime, err := FetchBlockTimestamps(heights)
	if err != nil {
		return nil, err
	}

	// Running total per market
	runningTotals := make(map[string]float64)
	var result []UserLoanEvent

	for _, ev := range allEvents {
		// Add/subtract for this market
		runningTotals[ev.MarketId] += ev.Value
		// Sum all markets' running totals, multiply by mock fiat value (1)
		totalFiat := 0.0
		for marketId := range runningTotals {
			totalFiat += runningTotals[marketId] * marketIdMap[marketId]
		}
		result = append(result, UserLoanEvent{
			Value:     totalFiat,
			Timestamp: heightToTime[ev.BlockHeight],
		})
	}

	return result, nil
}

// Helper to parse events and collect marketIds
func parseUserEvents(
	transactions []map[string]interface{},
	sign float64,
	marketIdMap map[string]float64,
	heightSet map[int64]struct{},
) []struct {
	Event
	MarketId string
} {
	var events []struct {
		Event
		MarketId string
	}
	for _, tx := range transactions {
		timestamp := int64(tx["block_height"].(float64))
		response := tx["response"].(map[string]interface{})
		eventsArr := response["events"].([]interface{})
		for _, ev := range eventsArr {
			evMap := ev.(map[string]interface{})
			attrs := evMap["attrs"].([]interface{})
			var amount float64
			var marketId string
			for _, attr := range attrs {
				attrMap := attr.(map[string]interface{})
				key := attrMap["key"].(string)
				if key == "amount" {
					amountStr := attrMap["value"].(string)
					if amountStr != "" {
						if val, err := strconv.ParseFloat(amountStr, 64); err == nil {
							amount = val
						}
					}
				}
				if key == "market_id" {
					marketId = attrMap["value"].(string)
				}
			}
			if marketId != "" && amount != 0 {
				marketIdMap[marketId] = 1 // mock fiat value
				events = append(events, struct {
					Event
					MarketId string
				}{
					Event: Event{
						Value:       sign * amount,
						BlockHeight: timestamp,
					},
					MarketId: marketId,
				})
				heightSet[timestamp] = struct{}{}
			}
		}
	}
	return events
}
