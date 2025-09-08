// Package processor provides sequential transaction processing utilities for the backend.
//
// This package defines a TransactionProcessorQueue, which enables ordered, thread-safe
// processing of Volos protocol transactions received from both WebSocket and polling sources.
// The processor handles transactions from both core and governance packages, routing them
// to appropriate handlers based on their package path.
//
// The TransactionProcessorQueue uses a buffered channel as a job queue and processes
// transactions sequentially in a single goroutine to maintain proper ordering and data consistency.
// Transactions are submitted to the queue via the Submit method, and the processor calls
// ProcessTransaction to handle the transaction logic based on its package path and event type.
//
// This design ensures that transaction processing maintains data consistency by processing
// transactions in the order they are received, preventing race conditions and ensuring
// that state changes are applied in the correct sequence.
//
// Usage:
//
//	queue := processor.NewTransactionProcessorQueue(gnoClient, firestoreClient)
//	queue.Start()
//	...
//	queue.Submit(tx)
//
// Both WebSocket and polling ingestion should submit transactions to the same queue for unified processing.
// The processor automatically routes transactions to core or governance handlers based on package path.
package processor

import (
	"fmt"
	"log/slog"
	"os"
	"strconv"
	"sync"

	"volos-backend/model"

	"cloud.google.com/go/firestore"
	"github.com/gnolang/gno/gno.land/pkg/gnoclient"
)

// TransactionProcessorQueue processes transactions sequentially to maintain proper ordering.
// It handles transactions from both core and governance packages, routing them to
// appropriate processing functions based on their package path.
type TransactionProcessorQueue struct {
	jobs            chan map[string]interface{}
	logger          *slog.Logger
	gnoClient       *gnoclient.Client
	firestoreClient *firestore.Client

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

// NewTransactionProcessorQueue creates a new sequential processor.
func NewTransactionProcessorQueue(gnoClient *gnoclient.Client, firestoreClient *firestore.Client) *TransactionProcessorQueue {
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

	return &TransactionProcessorQueue{
		jobs:            make(chan map[string]interface{}, 1000),
		logger:          slog.Default().With("component", "TransactionProcessorQueue"),
		gnoClient:       gnoClient,
		firestoreClient: firestoreClient,
		seen:            make(map[string]struct{}, defaultCap),
		seenQueue:       make([]string, 0, defaultCap),
		seenCap:         defaultCap,
	}
}

// Start launches a single goroutine that processes transactions sequentially from both core and governance packages.
func (q *TransactionProcessorQueue) Start() {
	q.logger.Info("starting sequential transaction processor",
		"queue_capacity", cap(q.jobs),
		"dedup_capacity", q.seenCap,
	)

	go func() {
		for tx := range q.jobs {
			ProcessTransaction(tx, q.firestoreClient, q.gnoClient)
		}
	}()
}

// Submit adds a transaction to the processing queue. The transaction will be routed
// to either core or governance processing based on its package path.
//
// De-duplication: WebSocket and polling can overlap (e.g., WS dies mid-block and polling
// resumes slightly before). To avoid double-processing the same transaction, we keep a
// bounded in-memory set of recently seen transaction keys (prefer hash; fallback to
// block_height:index). If a key is already present, the submission is dropped.
func (q *TransactionProcessorQueue) Submit(tx map[string]interface{}) {
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
		q.seenMu.Lock()
		if _, exists := q.seen[key]; exists {
			q.seenMu.Unlock()
			return
		}
		q.seen[key] = struct{}{}
		q.seenQueue = append(q.seenQueue, key)
		if len(q.seenQueue) > q.seenCap {
			oldest := q.seenQueue[0]
			q.seenQueue = q.seenQueue[1:]
			delete(q.seen, oldest)
		}
		q.seenMu.Unlock()
	}

	select {
	case q.jobs <- tx:
		// Transaction submitted successfully
	default:
		q.logger.Warn("transaction processor job queue full, dropping transaction",
			"tx_key", key,
			"queue_capacity", cap(q.jobs),
		)
	}
}

// ProcessTransaction processes a single transaction JSON object by determining its package path
// and routing it to the appropriate processor (core or governance).
func ProcessTransaction(tx map[string]interface{}, firestoreClient *firestore.Client, gnoClient *gnoclient.Client) {
	pkgPath, ok := getPackagePath(tx)
	if !ok {
		if h, _ := tx["hash"].(string); h != "" {
			slog.Warn("missing package path, skipping transaction", "tx_hash", h)
		}
		return
	}

	switch pkgPath {
	case model.CorePkgPath:
		processCoreTransaction(tx, firestoreClient, gnoClient)
	case model.GovernancePkgPath, model.StakerPkgPath, model.VlsPkgPath, model.XvlsPkgPath:
		processGovernanceTransaction(tx, firestoreClient)
	case model.GnoswapPool:
		processGnoswapPoolTransaction(tx, firestoreClient)
	}
}

// getPackagePath extracts the package path from the transaction structure by navigating
// through the events array to find the pkg_path field in GnoEvent, ignoring StorageDeposit and UnlockDeposit events.
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

		if eventType == "StorageDeposit" || eventType == "UnlockDeposit" {
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
