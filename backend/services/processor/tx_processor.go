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
	case "gno.land/r/volos/gov/governance", "gno.land/r/volos/gov/staker", "gno.land/r/volos/gov/vls", "gno.land/r/volos/gov/xvls":
		processGovernanceTransaction(tx, client)
		return
	}

	log.Printf("Unknown package path: %s", pkgPath)
}

// getPackagePath extracts the package path from the transaction structure by navigating
// through the events array to find the pkg_path field in GnoEvent, ignoring StorageDeposit events.
func getPackagePath(tx map[string]interface{}) string {
	response, ok := tx["response"].(map[string]interface{})
	if !ok {
		return ""
	}

	events, ok := response["events"].([]interface{})
	if !ok || len(events) == 0 {
		return ""
	}

	for i := len(events) - 1; i >= 0; i-- {
		event, ok := events[i].(map[string]interface{})
		if !ok {
			continue
		}

		eventType, ok := event["type"].(string)
		if !ok {
			continue
		}

		if eventType == "StorageDeposit" {
			continue
		}

		pkgPath, ok := event["pkg_path"].(string)
		if !ok {
			continue
		}

		return pkgPath
	}

	return ""
}
