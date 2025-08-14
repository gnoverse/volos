// Package processor provides concurrent transaction processing utilities for the backend.
//
// This package defines a TransactionProcessorPool, which enables high-throughput, thread-safe
// processing of Volos protocol transactions received from both WebSocket and polling sources.
// The processor handles transactions from both core and governance packages, routing them
// to appropriate handlers based on their package path.
//
// The TransactionProcessorPool uses a buffered channel as a job queue and a configurable
// number of worker goroutines to process transactions in parallel. Transactions are submitted
// to the pool via the Submit method, and each worker calls ProcessTransaction to handle the
// transaction logic based on its package path and event type.
//
// This design ensures that transaction processing keeps up with real-time data ingestion,
// prevents bottlenecks, and provides a scalable foundation for implementing custom event
// handling logic for each transaction type from both core and governance packages.
//
// Usage:
//
//	pool := processor.NewTransactionProcessorPool(8)
//	pool.Start()
//	...
//	pool.Submit(tx)
//
// Both WebSocket and polling ingestion should submit transactions to the same pool for unified processing.
// The processor automatically routes transactions to core or governance handlers based on package path.
package processor

import (
	"log"

	"cloud.google.com/go/firestore"
)

// TransactionProcessorPool processes transactions concurrently using a worker pool.
// It handles transactions from both core and governance packages, routing them to
// appropriate processing functions based on their package path.
type TransactionProcessorPool struct {
	jobs    chan map[string]interface{}
	workers int
}

// NewTransactionProcessorPool creates a new pool with the given number of workers.
func NewTransactionProcessorPool(workers int) *TransactionProcessorPool {
	if workers <= 0 {
		workers = 8
	}
	return &TransactionProcessorPool{
		jobs:    make(chan map[string]interface{}, 1000),
		workers: workers,
	}
}

// Start launches the worker goroutines that process transactions from both core and governance packages.
func (p *TransactionProcessorPool) Start(client *firestore.Client) {
	for i := 0; i < p.workers; i++ {
		go func() {
			for tx := range p.jobs {
				ProcessTransaction(tx, client)
			}
		}()
	}
}

// Submit adds a transaction to the processing queue. The transaction will be routed
// to either core or governance processing based on its package path.
func (p *TransactionProcessorPool) Submit(tx map[string]interface{}) {
	select {
	case p.jobs <- tx:
		// submitted
	default:
		log.Println("TransactionProcessorPool: job queue full, dropping transaction")
	}
}

// ProcessTransaction processes a single transaction JSON object by determining its package path
// and routing it to the appropriate processor (core or governance).
func ProcessTransaction(tx map[string]interface{}, client *firestore.Client) {
	pkgPath := getPackagePath(tx)

	switch pkgPath {
	case "gno.land/r/volos/core":
		processCoreTransaction(tx)
		return
	case "gno.land/r/volos/gov/governance":
		processGovernanceTransaction(tx, client)
		return
	}

	// If no package path found, check if this is a MsgRun transaction with governance events
	if isMsgRunGovernanceTransaction(tx) {
		processGovernanceTransaction(tx, client)
		return
	}

	log.Printf("Unknown package path: %s", pkgPath)
}

// isMsgRunGovernanceTransaction checks if the transaction is a MsgRun transaction containing governance events.
// MsgRun transactions don't have a clear package path in the MsgCall structure, so we need to manually
// inspect the events to determine which processor should handle them. This function checks for known
// governance event types and routes them to the governance processor.
func isMsgRunGovernanceTransaction(tx map[string]interface{}) bool {
	governanceEvents := []string{
		"ProposalCreated",
		// Add more governance events here if needed
	}

	response, ok := tx["response"].(map[string]interface{})
	if !ok {
		return false
	}

	events, ok := response["events"].([]interface{})
	if !ok || len(events) == 0 {
		return false
	}

	for _, eventInterface := range events {
		event, ok := eventInterface.(map[string]interface{})
		if !ok {
			continue
		}

		eventType, ok := event["type"].(string)
		if !ok {
			continue
		}

		for _, govEvent := range governanceEvents {
			if eventType == govEvent {
				return true
			}
		}
	}

	return false
}

// getPackagePath extracts the package path from the transaction structure by navigating
// through the messages array and MsgCall object to find the pkg_path field.
func getPackagePath(tx map[string]interface{}) string {
	messages, ok := tx["messages"].([]interface{})
	if !ok || len(messages) == 0 {
		return ""
	}

	firstMsg, ok := messages[0].(map[string]interface{})
	if !ok {
		return ""
	}

	value, ok := firstMsg["value"].(map[string]interface{})
	if !ok {
		return ""
	}

	pkgPath, ok := value["pkg_path"].(string)
	if !ok {
		return ""
	}

	return pkgPath
}
