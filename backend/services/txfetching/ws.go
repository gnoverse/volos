// Package txfetching provides transaction fetching utilities for the backend.
//
// This file implements a WebSocket-based transaction listener for the Volos protocol.
// It establishes a WebSocket connection to a GraphQL endpoint and uses a GraphQL
// subscription-type query to receive real-time transaction events. The listener
// automatically handles connection initialization, subscription setup, and incoming
// messages, logging all received transaction data as JSON.
//
// todo: process transactions instead of just logging
//
package txfetching

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"volos-backend/indexer"
	"volos-backend/model"

	"github.com/coder/websocket"
	"github.com/coder/websocket/wsjson"
)

const (
	wsURL    = "ws://localhost:3100/graphql/query"
	protocol = "graphql-transport-ws"
)

func StartVolosTransactionListener(ctx context.Context) error {
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
			jsonData, _ := json.MarshalIndent(msg, "", "  ")
			log.Printf("Received: %s", jsonData)
		}
	}()

	<-ctx.Done()
	return nil
}
