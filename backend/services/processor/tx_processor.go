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
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"sync"

	"cloud.google.com/go/firestore"
	"volos-backend/model"
)

// TransactionProcessorPool processes transactions concurrently using a worker pool.
// It handles transactions from both core and governance packages, routing them to
// appropriate processing functions based on their package path.
type TransactionProcessorPool struct {
	jobs    chan map[string]interface{}
	workers int
	logger  *slog.Logger

	// seenMu guards concurrent access to the de-duplication fields below.
	seenMu sync.Mutex
	// seen stores keys of recently submitted transactions to prevent re-processing.
	// Keys prefer the transaction hash; if unavailable, they fall back to "block_height:index".
	seen map[string]struct{}
	// seenQueue tracks insertion order for FIFO eviction when capacity is exceeded.
	seenQueue []string
	// seenCap is the maximum number of recent transaction keys we retain for de-duplication.
	// When this cap is exceeded, the oldest keys are evicted from both seenQueue and seen.
	seenCap int
}

// NewTransactionProcessorPool creates a new pool with the given number of workers.
func NewTransactionProcessorPool(workers int) *TransactionProcessorPool {
	if workers <= 0 {
		workers = 8
	}

	// TODO: configure de-dup capacity via env (VOLOS_TX_DEDUP_SEEN_CAP), default to 1024
	defaultCap := 1024
	if env := os.Getenv("VOLOS_TX_DEDUP_SEEN_CAP"); env != "" {
		if v, err := strconv.Atoi(env); err == nil && v > 0 {
			defaultCap = v
		} else {
			slog.Warn("invalid VOLOS_TX_DEDUP_SEEN_CAP value",
				"value", env,
				"error", err,
			)
		}
	}

	return &TransactionProcessorPool{
		jobs:      make(chan map[string]interface{}, 1000),
		workers:   workers,
		logger:    slog.Default().With("component", "TransactionProcessorPool"),
		seen:      make(map[string]struct{}, defaultCap),
		seenQueue: make([]string, 0, defaultCap),
		seenCap:   defaultCap,
	}
}

// Start launches the worker goroutines that process transactions from both core and governance packages.
func (p *TransactionProcessorPool) Start(client *firestore.Client) {
	p.logger.Info("starting transaction processor pool",
		"workers", p.workers,
		"queue_capacity", cap(p.jobs),
		"dedup_capacity", p.seenCap,
	)

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
//
// De-duplication: WebSocket and polling can overlap (e.g., WS dies mid-block and polling
// resumes slightly before). To avoid double-processing the same transaction, we keep a
// bounded in-memory set of recently seen transaction keys (prefer hash; fallback to
// block_height:index). If a key is already present, the submission is dropped.
func (p *TransactionProcessorPool) Submit(tx map[string]interface{}) {
	var key string
	if h, ok := tx["hash"].(string); ok && h != "" {
		key = h
	} else {
		var heightPart, indexPart string
		if bh, ok := tx["block_height"].(float64); ok {
			heightPart = fmt.Sprintf("%d", int(bh))
		}
		if idx, ok := tx["index"].(float64); ok {
			indexPart = fmt.Sprintf("%d", int(idx))
		}
		key = heightPart + ":" + indexPart
	}

	if key != ":" && key != "" {
		p.seenMu.Lock()
		if _, exists := p.seen[key]; exists {
			p.seenMu.Unlock()
			return
		}
		p.seen[key] = struct{}{}
		p.seenQueue = append(p.seenQueue, key)
		if len(p.seenQueue) > p.seenCap {
			oldest := p.seenQueue[0]
			p.seenQueue = p.seenQueue[1:]
			delete(p.seen, oldest)
		}
		p.seenMu.Unlock()
	}

	select {
	case p.jobs <- tx:
		// Transaction submitted successfully
	default:
		p.logger.Warn("transaction processor job queue full, dropping transaction",
			"tx_key", key,
			"queue_capacity", cap(p.jobs),
		)
	}
}

// ProcessTransaction processes a single transaction JSON object by determining its package path
// and routing it to the appropriate processor (core or governance).
func ProcessTransaction(tx map[string]interface{}, client *firestore.Client) {
	pkgPath, ok := getPackagePath(tx)
	if !ok {
		if h, _ := tx["hash"].(string); h != "" {
			slog.Warn("missing package path, skipping transaction", "tx_hash", h)
		}
		return
	}

	switch pkgPath {
	case model.CorePkgPath:
		processCoreTransaction(tx, client)
	case model.GovernancePkgPath, model.StakerPkgPath, model.VlsPkgPath, model.XvlsPkgPath:
		processGovernanceTransaction(tx, client)
	}
}

// getPackagePath extracts the package path from the transaction structure by navigating
// through the events array to find the pkg_path field in GnoEvent, ignoring StorageDeposit events.
func getPackagePath(tx map[string]interface{}) (string, bool) {
	response, ok := tx["response"].(map[string]interface{})
	if !ok {
		return "", false
	}

	events, ok := response["events"].([]interface{})
	if !ok || len(events) == 0 {
		return "", false
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

		return pkgPath, true
	}

	return "", false
}
