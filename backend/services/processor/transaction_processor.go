// Package processor provides concurrent transaction processing utilities for the backend.
//
// This package defines a TransactionProcessorPool, which enables high-throughput, thread-safe
// processing of Volos protocol transactions received from both WebSocket and polling sources.
//
// The TransactionProcessorPool uses a buffered channel as a job queue and a configurable
// number of worker goroutines to process transactions in parallel. Transactions are submitted
// to the pool via the Submit method, and each worker calls ProcessTransaction to handle the
// transaction logic based on its event type.
//
// This design ensures that transaction processing keeps up with real-time data ingestion,
// prevents bottlenecks, and provides a scalable foundation for implementing custom event
// handling logic for each transaction type.
//
// Usage:
//   pool := processor.NewTransactionProcessorPool(8)
//   pool.Start()
//   ...
//   pool.Submit(tx)
//
// Both WebSocket and polling ingestion should submit transactions to the same pool for unified processing.
package processor

import (
	"log"
)

// TransactionProcessorPool processes transactions concurrently using a worker pool.
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

// Start launches the worker goroutines.
func (p *TransactionProcessorPool) Start() {
	for i := 0; i < p.workers; i++ {
		go func() {
			for tx := range p.jobs {
				ProcessTransaction(tx)
			}
		}()
	}
}

// Submit adds a transaction to the processing queue.
func (p *TransactionProcessorPool) Submit(tx map[string]interface{}) {
	select {
	case p.jobs <- tx:
		// submitted
	default:
		log.Println("TransactionProcessorPool: job queue full, dropping transaction")
	}
}

// ProcessTransaction processes a single transaction JSON object (already unwrapped from 'data' and 'getTransactions').
func ProcessTransaction(tx map[string]interface{}) {
	response, ok := tx["response"].(map[string]interface{})
	if !ok {
		log.Println("Transaction missing 'response' field")
		return
	}
	events, ok := response["events"].([]interface{})
	if !ok || len(events) == 0 {
		log.Println("Transaction missing or empty 'events' array")
		return
	}

	lastEvent, ok := events[len(events)-1].(map[string]interface{})
	if !ok {
		log.Println("Last event is not a map")
		return
	}
	eventType, ok := lastEvent["type"].(string)
	if !ok {
		log.Println("Event type is not a string")
		return
	}

	switch eventType {
	case "CreateMarket":
		// TODO: handle CreateMarket
	case "Supply":
		log.Println("RECEIVED SUPPLY")
	case "Withdraw":
		// TODO: handle Withdraw
	case "Borrow":
		// TODO: handle Borrow
	case "Repay":
		// TODO: handle Repay
	case "Liquidate":
		// TODO: handle Liquidate
	case "RegisterIRM":
		// TODO: handle RegisterIRM
	case "AccrueInterest":
		// TODO: handle AccrueInterest
	case "SupplyCollateral":
		// TODO: handle SupplyCollateral
	case "WithdrawCollateral":
		// TODO: handle WithdrawCollateral
	case "authorization_set":
		// TODO: handle AuthorizationSet
	default:
		log.Printf("Unknown event type: %s", eventType)
	}
}
