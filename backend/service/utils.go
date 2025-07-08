package service

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"volos-backend/indexer"
)

// Helper to process events from transactions and collect unique block heights
func extractEvents(transactions []map[string]interface{}, sign float64, heightSet map[int64]struct{}) []Event {
	var events []Event
	for _, tx := range transactions {
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
												events = append(events, Event{Value: sign * val, BlockHeight: timestamp})
												heightSet[timestamp] = struct{}{}
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
	return events
}

// FetchBlockTimestamps fetches block timestamps for the given block heights from the indexer.
// Returns a map from block height to timestamp string.
func FetchBlockTimestamps(heights []int64) (map[int64]string, error) {
	var orClauses []string
	for _, h := range heights {
		orClauses = append(orClauses, fmt.Sprintf("{ height: { eq: %d } }", h))
	}
	// Workaround: add dummy height to ensure last real block is included: https://github.com/gnolang/tx-indexer/issues/175
	if len(heights) > 0 {
		maxHeight := heights[len(heights)-1]
		orClauses = append(orClauses, fmt.Sprintf("{ height: { eq: %d } }", maxHeight+1))
	}
	blockQuery := fmt.Sprintf(`
		query getSpecificBlocksByHeight {
			getBlocks(
				where: {
					_or: [
						%s
					]
				}
			) {
				%s
			}
		}
	`, strings.Join(orClauses, "\n"), indexer.BlockFields)

	blockResp, err := indexer.FetchIndexerData(blockQuery, "getSpecificBlocksByHeight")
	if err != nil {
		return nil, err
	}

	var blockData struct {
		Data struct {
			GetBlocks []struct {
				Height float64 `json:"height"`
				Time   string  `json:"time"`
			} `json:"getBlocks"`
		} `json:"data"`
	}
	json.Unmarshal(blockResp, &blockData)
	heightToTime := make(map[int64]string)
	for _, b := range blockData.Data.GetBlocks {
		heightToTime[int64(b.Height)] = b.Time
	}
	return heightToTime, nil
}
