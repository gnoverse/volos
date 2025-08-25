// Package txlistener provides transaction fetching utilities for the backend.
//
// This file implements a WebSocket-based transaction listener for the Volos protocol.
// It establishes a WebSocket connection to a GraphQL endpoint and uses a GraphQL
// subscription-type query to receive real-time transaction events from both the core
// and governance packages. The listener automatically handles connection initialization,
// subscription setup, and incoming messages, logging all received transaction data as JSON.
//
// The WebSocket listener monitors transactions from:
// - gno.land/r/volos/core: Core protocol transactions (supply, borrow, etc.)
// - gno.land/r/volos/gov/governance: Governance transactions (proposals, voting, etc.)
// - gno.land/r/volos/gov/staker: Staker transactions (staking, unstaking, etc.)
package txlistener

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"volos-backend/indexer"
	"volos-backend/model"
	"volos-backend/services/processor"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
	_ "github.com/joho/godotenv/autoload"
)

const protocol = "graphql-transport-ws"

var wsURL = func() string {
	if url := os.Getenv("WS_URL"); url != "" {
		return url
	}
	return "ws://localhost:3100/graphql/query"
}()

// StartVolosTransactionListener establishes a WebSocket connection to the GraphQL endpoint
// and subscribes to real-time transactions from both core and governance packages.
// It uses a logical OR condition to listen to transactions from either package path
// and submits all received transactions to the provided processor pool.
func StartVolosTransactionListener(ctx context.Context, pool *processor.TransactionProcessorPool, onBlockHeight func(int)) error {
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

	query := buildWebSocketQuery()

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
				slog.Error("websocket read error", "error", err)
				return
			}

			if payload, ok := msg["payload"].(map[string]interface{}); ok {
				if data, ok := payload["data"].(map[string]interface{}); ok {
					if tx, ok := data["getTransactions"].(map[string]interface{}); ok {
						pool.Submit(tx)
						if bh, ok := tx["block_height"].(float64); ok && onBlockHeight != nil {
							onBlockHeight(int(bh))
						}
						continue
					}
				}
			}
		}
	}()

	<-ctx.Done()
	return nil
}

// buildWebSocketQuery constructs the GraphQL subscription query for WebSocket
func buildWebSocketQuery() string {
	return fmt.Sprintf(`
		subscription {
			getTransactions(
				where: {
					response: {
						events: {
							GnoEvent: {
								_or: [
									{ pkg_path: { eq: "%s" } },
									{ pkg_path: { eq: "%s" } },
									{ pkg_path: { eq: "%s" } }
								]
							}
						}
					}
				}
			) {
				%s
			}
		}`, model.GovernancePkgPath, model.CorePkgPath, model.StakerPkgPath, indexer.UniversalTransactionFields)
}
