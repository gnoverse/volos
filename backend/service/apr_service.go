package service

import (
	"encoding/json"
	"strconv"
	"volos-backend/indexer"
)

type APREvent struct {
	Value     float64 `json:"value"`
	Timestamp string  `json:"timestamp"`
}

// GetAPRHistory fetches all AccrueInterest events for a given marketId from the indexer,
// extracts the borrow rate from each event, and calculates the historical APR over time.
//
// The function performs the following steps:
//  1. Queries the indexer for all AccrueInterest events for the specified market.
//  2. Extracts the borrow rate and block height from each event.
//  3. Fetches the actual timestamp for each block height.
//  4. Calculates the annual percentage rate (APR) from the per-second borrow rate.
//  5. Returns a slice of APREvent, each containing the APR and corresponding timestamp.
//
// APR Calculation:
//   - The borrow rate from events is per-second and WAD-scaled (1e18)
//   - APR = borrow_rate * seconds_per_year / WAD
//   - seconds_per_year = 365 * 24 * 60 * 60 = 31,536,000
//
// Returns:
//   - []APREvent: Each entry contains the borrow APR and the corresponding block timestamp.
//   - error: Any error encountered during the process.
func GetAPRHistory(marketId string) ([]APREvent, error) {
	qb := indexer.NewQueryBuilder("getAPREvents", indexer.SupplyBorrowFields)
	qb.Where().Success(true).EventType("AccrueInterest").MarketId(marketId)
	resp, err := qb.Execute()
	if err != nil {
		return nil, err
	}

	var data struct {
		Data struct {
			GetTransactions []map[string]interface{} `json:"getTransactions"`
		} `json:"data"`
	}
	json.Unmarshal(resp, &data)

	heightSet := make(map[int64]struct{})
	var rawEvents []struct {
		BorrowRate  float64
		BlockHeight int64
	}

	for _, tx := range data.Data.GetTransactions {
		event := parseAPREvent(tx, heightSet)
		if event.BorrowRate > 0 {
			rawEvents = append(rawEvents, event)
		}
	}

	var heights []int64
	for h := range heightSet {
		heights = append(heights, h)
	}

	heightToTime, err := FetchBlockTimestamps(heights)
	if err != nil {
		return nil, err
	}

	var result []APREvent
	for _, event := range rawEvents {
		// Calculate APR: borrow_rate * seconds_per_year / WAD
		// borrow_rate is WAD-scaled (1e18), so we divide by WAD to get the actual rate
		//
		// NOTE: this calucation is very slow, migrate to using db ASAP
		secondsPerYear := 365.0 * 24.0 * 60.0 * 60.0 // 31,536,000
		wad := 1e18
		apr := (event.BorrowRate * secondsPerYear) / wad

		result = append(result, APREvent{
			Value:     apr,
			Timestamp: heightToTime[event.BlockHeight],
		})
	}

	return result, nil
}

// Helper to parse a single AccrueInterest event and extract borrow rate
func parseAPREvent(tx map[string]interface{}, heightSet map[int64]struct{}) struct {
	BorrowRate  float64
	BlockHeight int64
} {
	defer func() {
		if r := recover(); r != nil {
			// return default values if panic occurs
		}
	}()

	blockHeight := int64(tx["block_height"].(float64))
	heightSet[blockHeight] = struct{}{}

	response := tx["response"].(map[string]interface{})
	eventsArr := response["events"].([]interface{})

	borrowRate := 0.0
	for _, ev := range eventsArr {
		evMap := ev.(map[string]interface{})
		if evMap["type"].(string) == "AccrueInterest" {
			attrs := evMap["attrs"].([]interface{})
			for _, attr := range attrs {
				attrMap := attr.(map[string]interface{})
				if attrMap["key"].(string) == "borrow_rate" {
					value := attrMap["value"].(string)
					borrowRate, _ = strconv.ParseFloat(value, 64)
					break
				}
			}
		}
	}

	return struct {
		BorrowRate  float64
		BlockHeight int64
	}{
		BorrowRate:  borrowRate,
		BlockHeight: blockHeight,
	}
}
