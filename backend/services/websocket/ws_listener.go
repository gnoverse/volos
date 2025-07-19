package websocket

import (
	"context"
	"log"

	"github.com/coder/websocket"
)

const indexerWSURL = "ws://localhost:3100/ws"

// StartWSListener connects to the indexer websocket and prints received messages.
func StartWSListener(ctx context.Context) {
	c, _, err := websocket.Dial(ctx, indexerWSURL, nil)
	if err != nil {
		log.Fatalf("failed to connect to indexer websocket: %v", err)
	}
	defer c.Close(websocket.StatusInternalError, "closing")

	log.Println("Connected to indexer websocket at", indexerWSURL)

	for {
		_, msg, err := c.Read(ctx)
		if err != nil {
			log.Printf("websocket read error: %v", err)
			break
		}
		log.Printf("Received message: %s", string(msg))
	}

	c.Close(websocket.StatusNormalClosure, "done")
}
