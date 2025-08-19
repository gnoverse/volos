// Package txlistener provides transaction fetching utilities for the backend.
//
// TransactionListener implements a hybrid approach to monitoring Volos transactions:
// 1. Primary: WebSocket-based real-time listening using GraphQL subscriptions
// 2. Fallback: Polling-based transaction fetching when WebSocket fails
//
// The listener starts both mechanisms simultaneously:
// - WebSocket listener runs in a goroutine and handles real-time events
// - Polling runs in the main goroutine and only activates when WebSocket is down
//
// The listener automatically switches between real-time (WebSocket) and batch (polling)
// modes based on connection health, ensuring continuous transaction monitoring.
package txlistener

import (
	"context"
	"log"
	"time"

	"volos-backend/model"
	"volos-backend/services/processor"
)

type TransactionListener struct {
	LastBlockHeight int
	PollInterval    time.Duration
	RetryInterval   time.Duration
	wsCtx           context.Context
	wsCancel        context.CancelFunc
	pool            *processor.TransactionProcessorPool
}

func NewTransactionListener(pool *processor.TransactionProcessorPool) *TransactionListener {
	ctx, cancel := context.WithCancel(context.Background())
	return &TransactionListener{
		LastBlockHeight: model.BlockHeightOnDeploy,
		PollInterval:    5 * time.Second,
		RetryInterval:   1 * time.Hour,
		wsCtx:           ctx,
		wsCancel:        cancel,
		pool:            pool,
	}
}

func (tl *TransactionListener) Start(ctx context.Context) {
	go tl.startWebSocketListener(ctx)

	tl.startPolling(ctx)
}

func (tl *TransactionListener) startWebSocketListener(ctx context.Context) {
	for {
		select {
		case <-ctx.Done():
			return
		default:
			log.Println("Starting WebSocket listener...")

			wsCtx, wsCancel := context.WithCancel(context.Background())
			tl.wsCtx = wsCtx
			tl.wsCancel = wsCancel

			// Attempt to establish WebSocket connection and process transactions in real-time.
			// If successful, updates LastBlockHeight with a safety lag of 1 block to avoid
			// missing transactions if websocket connection is lost mid-block.
			err := StartVolosTransactionListener(wsCtx, tl.pool, func(bh int) {
				const safetyLag = 1
				adjusted := bh - safetyLag
				if adjusted < 0 {
					adjusted = 0
				}

				if adjusted > tl.LastBlockHeight {
					tl.LastBlockHeight = adjusted
				}
			})
			if err != nil {
				log.Printf("WebSocket listener failed: %v", err)
				log.Println("Falling back to polling mode...")

				tl.wsCancel()

				select {
				case <-ctx.Done():
					return
				case <-time.After(tl.RetryInterval):
					log.Println("Retrying WebSocket connection...")
					continue
				}
			}
		}
	}
}

func (tl *TransactionListener) startPolling(ctx context.Context) {
	ticker := time.NewTicker(tl.PollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			// Check if websocket is still active
			select {
			case <-tl.wsCtx.Done():
				// WebSocket is down, use polling
				tl.pollNewTransactions()
			default:
				// WebSocket is active, skip polling
				continue
			}
		}
	}
}
