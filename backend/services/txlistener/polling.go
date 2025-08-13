// Package txlistener provides transaction fetching utilities for the backend.
//
// This file contains the polling fallback mechanism for transaction monitoring.
// When the WebSocket connection fails, the TransactionListener falls back to
// periodic polling of the GraphQL endpoint to fetch new transactions from both
// core and governance packages.
//
// The polling service:
// - Queries for transactions after the last known block height
// - Uses logical OR conditions to monitor both core and governance transactions
// - Updates the LastBlockHeight to avoid duplicate processing
// - Logs all received transaction data for debugging
// - Only activates when WebSocket is inactive (checked every 5 seconds)
//
// The polling mechanism monitors transactions from:
// - gno.land/r/volos/core: Core protocol transactions (supply, borrow, liquidate, etc.)
// - gno.land/r/volos/gov/governance: Governance transactions (proposals, voting, etc.)
package txlistener

import (
	"encoding/json"
	"log"

	"volos-backend/indexer"
	"volos-backend/model"
)

// pollNewTransactions executes a GraphQL query to fetch new transactions from both
// core and governance packages that occurred after the last known block height.
// It uses a logical OR condition to include transactions from either package path
// and submits all found transactions to the processor pool.
func (tl *TransactionListener) pollNewTransactions() {
	qb := indexer.NewQueryBuilder("VolosTxQuery", indexer.UniversalTransactionFields)
	qb.Where().Success(true).Or().PkgPath(model.VolosPkgPath).PkgPath(model.VolosGovPkgPath)

	if tl.LastBlockHeight > 0 {
		qb.Where().BlockHeightRange(&tl.LastBlockHeight, nil)
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

	if data, ok := result["data"].(map[string]interface{}); ok {
		if transactions, ok := data["getTransactions"].([]interface{}); ok {
			if len(transactions) > 0 {
				for _, tx := range transactions {
					if txMap, ok := tx.(map[string]interface{}); ok {
						tl.pool.Submit(txMap)
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
