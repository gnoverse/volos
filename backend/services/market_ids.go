package services

import (
	"encoding/json"
	"volos-backend/indexer"
	"volos-backend/model"
)

// GetAllMarketIDs queries the indexer for all CreateMarket events and returns a slice of unique market IDs
func GetAllMarketIDs() ([]string, error) {
	qb := indexer.NewQueryBuilder("getEvents", indexer.CreateMarketFields)
	qb.Where().Success(true).
		PkgPath(model.CorePkgPath).
		EventType("CreateMarket")

	resp, err := qb.Execute()
	if err != nil {
		return nil, err
	}

	var data struct {
		Data struct {
			GetTransactions []struct {
				Response struct {
					Events []struct {
						Attrs []struct {
							Key   string `json:"key"`
							Value string `json:"value"`
						} `json:"attrs"`
					} `json:"events"`
				} `json:"response"`
			} `json:"getTransactions"`
		} `json:"data"`
	}
	json.Unmarshal(resp, &data)

	marketIdSet := make(map[string]struct{})
	for _, tx := range data.Data.GetTransactions {
		for _, event := range tx.Response.Events {
			for _, attr := range event.Attrs {
				if attr.Key == "market_id" {
					marketIdSet[attr.Value] = struct{}{}
				}
			}
		}
	}

	var marketIds []string
	for id := range marketIdSet {
		marketIds = append(marketIds, id)
	}
	return marketIds, nil
}
