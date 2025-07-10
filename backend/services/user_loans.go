package services

import (
	"encoding/json"
	"strconv"
	"volos-backend/indexer"
)

// GetUserLoanHistory fetches all borrow and repay events for a given caller (user address),
// aggregates them by block height, and returns the running total fiat value over time.
func GetUserLoanHistory(caller string) ([]Data, error) {
	borrowsQB := indexer.NewQueryBuilder("getBorrowEventsByCaller", indexer.SupplyBorrowFields)
	borrowsQB.Where().Success(true).EventType("Borrow").Caller(caller).PkgPath(VolosPkgPath)
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

	repaysQB := indexer.NewQueryBuilder("getRepayEventsByCaller", indexer.SupplyBorrowFields)
	repaysQB.Where().Success(true).EventType("Repay").Caller(caller).PkgPath(VolosPkgPath)
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

	borrowEvents := parseUserEvents(borrowsData.Data.GetTransactions, 1)
	repayEvents := parseUserEvents(repaysData.Data.GetTransactions, -1)
	allEvents := append(borrowEvents, repayEvents...)

	var heights []int64
	for _, ev := range allEvents {
		heights = append(heights, ev.BlockHeight)
	}

	heightToTime, err := FetchBlockTimestamps(heights)
	if err != nil {
		return nil, err
	}

	runningTotals := make(map[string]float64)
	var result []Data

	for _, ev := range allEvents {
		runningTotals[ev.MarketId] += ev.Value
		totalFiat := 0.0
		for marketId := range runningTotals {
			totalFiat += runningTotals[marketId] * GetTokenPrice(marketId)
		}
		result = append(result, Data{
			Value:     totalFiat,
			Timestamp: heightToTime[ev.BlockHeight],
		})
	}

	return result, nil
}

func parseUserEvents(
	transactions []map[string]interface{},
	sign float64,
) []struct {
	TransactionData
	MarketId string
} {
	defer func() {
		if r := recover(); r != nil {
			// return default values if panic occurs
		}
	}()

	var events []struct {
		TransactionData
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
				events = append(events, struct {
					TransactionData
					MarketId string
				}{
					TransactionData: TransactionData{
						Value:       sign * amount,
						BlockHeight: timestamp,
					},
					MarketId: marketId,
				})
			}
		}
	}
	return events
}
