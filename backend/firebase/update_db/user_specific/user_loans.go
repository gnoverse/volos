package user_specific

import (
	"context"
	"encoding/json"
	"sort"
	"strconv"
	"volos-backend/indexer"
	"volos-backend/services"

	"cloud.google.com/go/firestore"
)

// GetOrUpdateUserLoanHistory checks Firestore for cached user loan history, updates if needed, and returns the combined result.
//
// This function first checks Firestore for the user's loan history and metadata (latest block height and running total loan value in fiat).
// If no data exists, it fetches all events from the indexer, computes the running total (in fiat) using token prices, and stores the results in Firestore.
// If data exists, it queries the indexer for only new events (using the latest block height as a minimum),
// parses each event to determine its type (Borrow/Repay) and amount, and updates the running total starting from the last known value.
// Each new event is stored in Firestore, and the metadata is updated with the new latest block height and running total.
// The function always returns the full loan history (existing + new), sorted by timestamp, with each entry representing the user's total loan value in fiat at that point in time.
func GetOrUpdateUserLoanHistory(client *firestore.Client, caller string) ([]services.Data, error) {
	ctx := context.Background()
	userDoc := client.Collection("users").Doc(caller)
	loanHistoryCol := userDoc.Collection("loan_history")
	metadataDoc := loanHistoryCol.Doc("metadata")

	metaDoc, err := metadataDoc.Get(ctx)
	var latestBlockHeight int
	var latestLoanValue float64
	if err == nil {
		if bh, ok := metaDoc.Data()["block_height"].(int64); ok {
			latestBlockHeight = int(bh)
		} else if bhf, ok := metaDoc.Data()["block_height"].(float64); ok {
			latestBlockHeight = int(bhf)
		}
		if lv, ok := metaDoc.Data()["latest_loan_value"].(float64); ok {
			latestLoanValue = lv
		}
	}

	docs, err := loanHistoryCol.Documents(ctx).GetAll()
	if err != nil {
		return nil, err
	}
	var existing []services.Data
	for _, doc := range docs {
		if doc.Ref.ID == "metadata" {
			continue
		}
		var d services.Data
		m := doc.Data()
		b, _ := json.Marshal(m)
		json.Unmarshal(b, &d)
		existing = append(existing, d)
	}

	var minBlockHeight *int
	if latestBlockHeight > 0 {
		next := latestBlockHeight + 1
		minBlockHeight = &next
	}

	borrowsQB := indexer.NewQueryBuilder("getBorrowEventsByCaller", indexer.SupplyBorrowFields)
	whereBorrows := borrowsQB.Where().Success(true).EventType("Borrow").Caller(caller).PkgPath(services.VolosPkgPath)
	if minBlockHeight != nil {
		whereBorrows.BlockHeightRange(minBlockHeight, nil)
	}
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
	whereRepays := repaysQB.Where().Success(true).EventType("Repay").Caller(caller).PkgPath(services.VolosPkgPath)
	if minBlockHeight != nil {
		whereRepays.BlockHeightRange(minBlockHeight, nil)
	}
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

	var newEvents []services.Data
	runningTotal := latestLoanValue
	maxBlock := latestBlockHeight
	bulkWriter := client.BulkWriter(ctx)
	var heights []int64
	for _, ev := range allEvents {
		heights = append(heights, ev.BlockHeight)
	}
	heightToTime, _ := services.FetchBlockTimestamps(heights)
	for _, ev := range allEvents {
		timestamp := heightToTime[ev.BlockHeight]
		if timestamp == "" {
			continue
		}
		fiatDelta := ev.Value * services.GetTokenPrice(ev.MarketId)
		runningTotal += fiatDelta
		newEvent := services.Data{
			Value:     runningTotal,
			Timestamp: timestamp,
		}
		newEvents = append(newEvents, newEvent)
		_, _ = bulkWriter.Create(loanHistoryCol.Doc(timestamp), newEvent)
		if int(ev.BlockHeight) > maxBlock {
			maxBlock = int(ev.BlockHeight)
		}
	}
	if len(newEvents) > 0 && maxBlock > latestBlockHeight {
		_, _ = bulkWriter.Set(metadataDoc, map[string]interface{}{
			"block_height":      maxBlock,
			"latest_loan_value": runningTotal,
		})
	}
	bulkWriter.End()

	combined := append(existing, newEvents...)
	sort.Slice(combined, func(i, j int) bool {
		return combined[i].Timestamp < combined[j].Timestamp
	})
	return combined, nil
}

// GetUserLoanHistory fetches all borrow and repay events for a given caller (user address),
// aggregates them by block height, and returns the running total fiat value over time.
//
// This function queries the indexer directly (bypassing Firestore cache),
// parses all Borrow and Repay events for the user, and computes the running total loan value in fiat using token prices.
// The result is a slice of Data, each entry containing the user's total loan value in fiat at a given block timestamp.
func GetUserLoanHistory(caller string, minBlockHeight *int) ([]services.Data, error) {
	borrowsQB := indexer.NewQueryBuilder("getBorrowEventsByCaller", indexer.SupplyBorrowFields)
	whereBorrows := borrowsQB.Where().Success(true).EventType("Borrow").Caller(caller).PkgPath(services.VolosPkgPath)
	if minBlockHeight != nil {
		whereBorrows.BlockHeightRange(minBlockHeight, nil)
	}
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
	whereRepays := repaysQB.Where().Success(true).EventType("Repay").Caller(caller).PkgPath(services.VolosPkgPath)
	if minBlockHeight != nil {
		whereRepays.BlockHeightRange(minBlockHeight, nil)
	}
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

	heightToTime, err := services.FetchBlockTimestamps(heights)
	if err != nil {
		return nil, err
	}

	runningTotals := make(map[string]float64)
	var result []services.Data

	for _, ev := range allEvents {
		runningTotals[ev.MarketId] += ev.Value
		totalFiat := 0.0
		for marketId := range runningTotals {
			totalFiat += runningTotals[marketId] * services.GetTokenPrice(marketId)
		}
		result = append(result, services.Data{
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
	services.TransactionData
	MarketId string
} {
	defer func() {
		if r := recover(); r != nil {
			// return default values if panic occurs
		}
	}()

	var events []struct {
		services.TransactionData
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
					services.TransactionData
					MarketId string
				}{
					TransactionData: services.TransactionData{
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
