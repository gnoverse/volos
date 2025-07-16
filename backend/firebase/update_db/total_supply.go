package update

import (
	"encoding/json"
	"volos-backend/indexer"
	"volos-backend/model"
	"volos-backend/services"
)

// GetTotalSupplyHistory fetches all deposit and withdraw events for a given marketId from the indexer,
// aggregates them by block height, and returns the running total supply over time with real block timestamps.
// Optionally, you can provide minBlockHeight to only fetch events after a certain block, and startingValue to continue the running total.
func GetTotalSupplyHistory(marketId string, minBlockHeight *int, startingValue float64) ([]model.Data, error) {
	depositsQB := indexer.NewQueryBuilder("getSupplyEvents", indexer.SupplyBorrowFields)
	whereDeposits := depositsQB.Where().Success(true).EventType("Deposit").MarketId(marketId).PkgPath(model.VolosPkgPath)
	if minBlockHeight != nil {
		whereDeposits.BlockHeightRange(minBlockHeight, nil)
	}
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
	whereWithdraws := withdrawsQB.Where().Success(true).EventType("Withdraw").MarketId(marketId).PkgPath(model.VolosPkgPath)
	if minBlockHeight != nil {
		whereWithdraws.BlockHeightRange(minBlockHeight, nil)
	}
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

	depositEvents := services.ParseEvents(depositsData.Data.GetTransactions, 1)
	withdrawEvents := services.ParseEvents(withdrawsData.Data.GetTransactions, -1)
	events := append(depositEvents, withdrawEvents...)

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
