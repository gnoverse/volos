// Package txlistener provides transaction fetching utilities for the backend.
//
// This file implements a WebSocket-based transaction listener for the Volos protocol.
// It establishes a WebSocket connection to a GraphQL endpoint and uses a GraphQL
// subscription-type query to receive real-time transaction events. The listener
// automatically handles connection initialization, subscription setup, and incoming
// messages, logging all received transaction data as JSON.
package txlistener

import (
	"context"
	"fmt"
	"log"

	"volos-backend/indexer"
	"volos-backend/model"
	"volos-backend/services/processor"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
)

const (
	wsURL    = "ws://localhost:3100/graphql/query"
	protocol = "graphql-transport-ws"
)

func StartVolosTransactionListener(ctx context.Context, pool *processor.TransactionProcessorPool) error {
	opts := &websocket.DialOptions{
		Subprotocols: []string{protocol},
	}

	conn, _, err := websocket.Dial(ctx, wsURL, opts)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer conn.Close(websocket.StatusNormalClosure, "done")

	initMsg := map[string]interface{}{
		"type": "connection_init",
	}
	if err := wsjson.Write(ctx, conn, initMsg); err != nil {
		return fmt.Errorf("failed to send connection_init: %w", err)
	}

	var ack map[string]interface{}
	if err := wsjson.Read(ctx, conn, &ack); err != nil {
		return fmt.Errorf("failed to read connection_ack: %w", err)
	}
	if ack["type"] != "connection_ack" {
		return fmt.Errorf("expected connection_ack, got: %v", ack)
	}

	qb := indexer.NewQueryBuilder("VolosTxSub", indexer.UniversalTransactionFields)
	qb.Subscription()
	qb.Where().PkgPath(model.VolosPkgPath)
	query := qb.Build()

	subMsg := map[string]interface{}{
		"id":   "1",
		"type": "subscribe",
		"payload": map[string]interface{}{
			"query": query,
		},
	}
	if err := wsjson.Write(ctx, conn, subMsg); err != nil {
		return fmt.Errorf("failed to send subscribe: %w", err)
	}

	go func() {
		for {
			var msg map[string]interface{}
			err := wsjson.Read(ctx, conn, &msg)
			if err != nil {
				log.Printf("read error: %v", err)
				return
			}

			if payload, ok := msg["payload"].(map[string]interface{}); ok {
				if data, ok := payload["data"].(map[string]interface{}); ok {
					if tx, ok := data["getTransactions"].(map[string]interface{}); ok {
						pool.Submit(tx)
						continue
					}
				}
			}
		}
	}()

	<-ctx.Done()
	return nil
}
