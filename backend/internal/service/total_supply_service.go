package service

import (
	"encoding/json"
	"fmt"
	"strings"
	"volos-backend/internal/indexer"
)

type TotalSupplyEvent struct {
	Value     float64 `json:"value"`
	Timestamp string  `json:"timestamp"`
}

type Event struct {
	Value       float64
	BlockHeight int64
}

// GetTotalSupplyHistory fetches all deposit and withdraw events for a given marketId from the indexer,
// aggregates them by block height, and returns the running total supply over time with real block timestamps.
//
// The function performs the following steps:
//  1. Queries the indexer for all deposit and withdraw events for the specified market.
//  2. Extracts the amount and block height from each event, collecting all unique block heights.
//  3. Queries the indexer for the actual timestamp of each block height.
//  4. Aggregates the events in block height order, accumulating the running total supply after each event.
//  5. Returns a slice of TotalSupplyEvent, each containing the running total and the corresponding block timestamp.
//
// Returns:
//   - []TotalSupplyEvent: Each entry contains the running total supply and the corresponding block timestamp.
//   - error: Any error encountered during the process.
func GetTotalSupplyHistory(marketId string) ([]TotalSupplyEvent, error) {
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

	heightSet := make(map[int64]struct{})
	events := extractEvents(depositsData.Data.GetTransactions, 1, heightSet)
	events = append(events, extractEvents(withdrawsData.Data.GetTransactions, -1, heightSet)...)

	var heights []int64
	for h := range heightSet {
		heights = append(heights, h)
	}

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

	var result []TotalSupplyEvent
	runningTotal := 0.0
	for _, ev := range events {
		runningTotal += ev.Value
		result = append(result, TotalSupplyEvent{
			Value:     runningTotal,
			Timestamp: heightToTime[ev.BlockHeight],
		})
	}

	return result, nil
}
