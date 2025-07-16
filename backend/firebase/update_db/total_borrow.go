package update

import (
	"encoding/json"
	"volos-backend/indexer"
	"volos-backend/model"
	"volos-backend/services"
)

// GetTotalBorrowHistory fetches all borrow and repay events for a given marketId from the indexer,
// aggregates them by block height, and returns the running total borrow over time with real block timestamps.
// Optionally, you can provide minBlockHeight to only fetch events after a certain block, and startingValue to continue the running total.
func GetTotalBorrowHistory(marketId string, minBlockHeight *int, startingValue float64) ([]model.Data, error) {
	borrowsQB := indexer.NewQueryBuilder("getBorrowEvents", indexer.SupplyBorrowFields)
	whereBorrows := borrowsQB.Where().Success(true).EventType("Borrow").MarketId(marketId).PkgPath(model.VolosPkgPath)
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

	repaysQB := indexer.NewQueryBuilder("getRepayEvents", indexer.SupplyBorrowFields)
	whereRepays := repaysQB.Where().Success(true).EventType("Repay").MarketId(marketId).PkgPath(model.VolosPkgPath)
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

	borrowEvents := services.ParseEvents(borrowsData.Data.GetTransactions, 1)
	repayEvents := services.ParseEvents(repaysData.Data.GetTransactions, -1)
	events := append(borrowEvents, repayEvents...)

	var heights []int64
	for _, ev := range events {
		heights = append(heights, ev.BlockHeight)
	}

	heightToTime, err := services.FetchBlockTimestamps(heights)
	if err != nil {
		return nil, err
	}

	var result []model.Data
	runningTotal := startingValue
	for _, ev := range events {
		runningTotal += ev.Value
		result = append(result, model.Data{
			Value:     runningTotal,
			Timestamp: heightToTime[ev.BlockHeight],
		})
	}

	return result, nil
}
