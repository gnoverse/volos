package services

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"volos-backend/indexer"
)

const VolosPkgPath = "gno.land/r/gnolend"

type Data struct {
	Value     float64 `json:"value"`
	Timestamp string  `json:"timestamp"`
}

type TransactionData struct {
	Value       float64
	BlockHeight int64
}

// Helper to process events from transactions and collect unique block heights used in total_borrow_service, total_supply_service, total_utilization_service
func ParseEvents(transactions []map[string]interface{}, sign float64) []TransactionData {
	defer func() {
		if r := recover(); r != nil {
			// return default values if panic occurs
		}
	}()

	var events []TransactionData
	for _, tx := range transactions {
		timestamp := int64(tx["block_height"].(float64))

		response := tx["response"].(map[string]interface{})
		eventsArr := response["events"].([]interface{})
		for _, ev := range eventsArr {
			evMap := ev.(map[string]interface{})
			attrs := evMap["attrs"].([]interface{})
			for _, attr := range attrs {
				attrMap := attr.(map[string]interface{})
				if attrMap["key"].(string) == "amount" {
					amountStr := attrMap["value"].(string)
					if amountStr != "" {
						if val, err := strconv.ParseFloat(amountStr, 64); err == nil {
							events = append(events, TransactionData{Value: sign * val, BlockHeight: timestamp})
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
