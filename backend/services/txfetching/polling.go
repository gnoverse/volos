// Package txfetching provides transaction fetching utilities for the backend.
//
// This file contains the polling fallback mechanism for transaction monitoring.
// When the WebSocket connection fails, the TransactionListener falls back to
// periodic polling of the GraphQL endpoint to fetch new transactions.
//
// The polling service:
// - Queries for transactions after the last known block height
// - Updates the LastBlockHeight to avoid duplicate processing
// - Logs all received transaction data for debugging
// - Only activates when WebSocket is inactive (checked every 5 seconds)
package txfetching

import (
	"encoding/json"
	"log"

	"volos-backend/indexer"
	"volos-backend/model"
)

func (tl *TransactionListener) pollNewTransactions() {
	qb := indexer.NewQueryBuilder("VolosTxQuery", indexer.UniversalTransactionFields)
	qb.Where().PkgPath(model.VolosPkgPath)

	if tl.LastBlockHeight > 0 {
		qb.Where().BlockHeightRange(&tl.LastBlockHeight, nil)
	}

	query := qb.Build()
	log.Printf("Polling query: %s", query)

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
	log.Printf("Received transactions (polling): %s", jsonData)

	if data, ok := result["data"].(map[string]interface{}); ok {
		if transactions, ok := data["getTransactions"].([]interface{}); ok {
			if len(transactions) > 0 {
				for _, tx := range transactions {
					if txMap, ok := tx.(map[string]interface{}); ok {
						if blockHeight, ok := txMap["block_height"].(float64); ok {
							if int(blockHeight) > tl.LastBlockHeight {
								tl.LastBlockHeight = int(blockHeight)
							}
						}
					}
				}
				log.Printf("Updated last block height to: %d", tl.LastBlockHeight)
			}
		}
	}
}
