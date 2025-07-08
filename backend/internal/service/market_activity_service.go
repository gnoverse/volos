package service

import (
	"encoding/json"
	"strconv"
	"volos-backend/internal/indexer"
)

type MarketActivity struct {
	Type             string  `json:"type"`
	Amount           float64 `json:"amount"`
	Caller           string  `json:"caller"`
	Hash             string  `json:"hash"`
	Timestamp        string  `json:"timestamp"`
	IsAmountInShares bool    `json:"isAmountInShares"`
}

// GetMarketActivity fetches all activity transactions (deposits, withdraws, borrows, repays, etc.) for a given marketId from the indexer.
//
// The function performs the following steps:
//  1. Queries the indexer for all transactions related to the specified market.
//  2. Extracts transaction type, amount, caller, hash, and block height from each transaction.
//  3. Fetches the actual timestamp for each block height.
//  4. Returns a slice of MarketActivity, each containing the transaction details and timestamp.
//
// NOTE: This function currently retrieves ALL transactions for the given market, which can become a very large number very quickly as the market grows.
//
//	For scalability, time-based or block height-based pagination should be implemented in the future.
//	Retrieving the last X transactions directly is not possible with the current API, so a solution for efficient pagination or limiting must be considered.
func GetMarketActivity(marketId string) ([]MarketActivity, error) {
	qb := indexer.NewQueryBuilder("getMarketActivity", indexer.MarketActivityFields)
	qb.Where().MarketId(marketId)
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
	var raw []struct {
		Type             string
		Amount           float64
		Caller           string
		Hash             string
		BlockHeight      int64
		IsAmountInShares bool
	}

	for _, tx := range data.Data.GetTransactions {
		raw = append(raw, parseMarketActivityTx(tx, heightSet))
	}

	var heights []int64
	for h := range heightSet {
		heights = append(heights, h)
	}
	heightToTime, err := FetchBlockTimestamps(heights)
	if err != nil {
		return nil, err
	}

	var result []MarketActivity
	for _, tx := range raw {
		result = append(result, MarketActivity{
			Type:             tx.Type,
			Amount:           tx.Amount,
			Caller:           tx.Caller,
			Hash:             tx.Hash,
			Timestamp:        heightToTime[tx.BlockHeight],
			IsAmountInShares: tx.IsAmountInShares,
		})
	}
	return result, nil
}

// Helper to parse a single transaction map into a rawTx-like struct, updating heightSet
func parseMarketActivityTx(tx map[string]interface{}, heightSet map[int64]struct{}) struct {
	Type             string
	Amount           float64
	Caller           string
	Hash             string
	BlockHeight      int64
	IsAmountInShares bool
} {
	getNestedString := func(m map[string]interface{}, path ...string) string {
		var current interface{} = m
		for _, key := range path {
			mm, ok := current.(map[string]interface{})
			if !ok {
				return ""
			}
			current = mm[key]
		}
		if s, ok := current.(string); ok {
			return s
		}
		return ""
	}
	getNestedFloat := func(m map[string]interface{}, path ...string) float64 {
		str := getNestedString(m, path...)
		if f, err := strconv.ParseFloat(str, 64); err == nil {
			return f
		}
		return 0
	}
	getFirstMap := func(arr interface{}) map[string]interface{} {
		if a, ok := arr.([]interface{}); ok && len(a) > 0 {
			if m, ok := a[0].(map[string]interface{}); ok {
				return m
			}
		}
		return nil
	}

	blockHeight := int64(0)
	if bh, ok := tx["block_height"].(float64); ok {
		blockHeight = int64(bh)
		heightSet[blockHeight] = struct{}{}
	}
	hash := getNestedString(tx, "hash")
	caller := getNestedString(getFirstMap(tx["messages"]), "value", "caller")
	txType := ""
	amount := 0.0
	isAmountInShares := false
	response, _ := tx["response"].(map[string]interface{})
	eventsArr, _ := response["events"].([]interface{})
	for _, ev := range eventsArr {
		evMap, _ := ev.(map[string]interface{})
		txType = getNestedString(evMap, "type")
		attrs, _ := evMap["attrs"].([]interface{})
		for _, attr := range attrs {
			attrMap, _ := attr.(map[string]interface{})
			key := getNestedString(attrMap, "key")
			if key == "amount" || key == "assets" || key == "shares" {
				val := getNestedFloat(attrMap, "value")
				if val != 0 {
					amount = val
					if key == "shares" {
						isAmountInShares = true
					}
				}
			}
		}
	}
	return struct {
		Type             string
		Amount           float64
		Caller           string
		Hash             string
		BlockHeight      int64
		IsAmountInShares bool
	}{
		Type:             txType,
		Amount:           amount,
		Caller:           caller,
		Hash:             hash,
		BlockHeight:      blockHeight,
		IsAmountInShares: isAmountInShares,
	}
}
