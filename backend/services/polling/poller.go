package polling

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"volos-backend/indexer"
	"volos-backend/model"
)

type Poller struct {
	LastBlockHeight int
	Interval        time.Duration
}

func NewPoller() *Poller {
	return &Poller{
		LastBlockHeight: model.BlockHeightOnDeploy,
		Interval:        5 * time.Second, // Poll every 5 seconds
	}
}

func (poll *Poller) Start(ctx context.Context) {
	ticker := time.NewTicker(poll.Interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			poll.pollNewTransactions()
		}
	}
}

func (poll *Poller) pollNewTransactions() {
	qb := indexer.NewQueryBuilder("VolosTxQuery", indexer.UniversalTransactionFields)
	qb.Where().PkgPath(model.VolosPkgPath)

	if poll.LastBlockHeight > 0 {
		qb.Where().BlockHeightRange(&poll.LastBlockHeight, nil)
	}

	response, err := qb.Execute()
	if err != nil {
		log.Printf("Error executing query: %v", err)
		return
	}

	var result map[string]interface{}
	if err := json.Unmarshal(response, &result); err != nil {
		log.Printf("Error parsing response: %v", err)
		return
	}

	jsonData, _ := json.MarshalIndent(result, "", "  ")
	log.Printf("Received transactions: %s", jsonData)

	if data, ok := result["data"].(map[string]interface{}); ok {
		if transactions, ok := data["getTransactions"].([]interface{}); ok {
			if len(transactions) > 0 {
				for _, tx := range transactions {
					if txMap, ok := tx.(map[string]interface{}); ok {
						if blockHeight, ok := txMap["block_height"].(float64); ok {
							if int(blockHeight) > poll.LastBlockHeight {
								poll.LastBlockHeight = int(blockHeight)
							}
						}
					}
				}
				log.Printf("Updated last block height to: %d", poll.LastBlockHeight)
			}
		}
	}
}
