package processor

import (
	"log/slog"

	"cloud.google.com/go/firestore"
)

// processGnoswapPoolTransaction handles transactions from the gnoswap pool package,
// focusing only on CreatePool and Swap events, extracting the "sqrtPriceX96" attribute.
func processGnoswapPoolTransaction(tx map[string]interface{}, client *firestore.Client) {
	events := extractEventsFromTx(tx)
	if events == nil {
		return
	}

	_, txHash := extractCallerAndHash(tx)

	for _, eventInterface := range events {
		event, eventType := getEventAndType(eventInterface)
		if event == nil || eventType == "" {
			continue
		}

		switch eventType {
		case "CreatePool", "Swap":
			if sqrt, ok := extractPrice(event); ok {
				slog.Info("gnoswap sqrtPriceX96 extracted", "event_type", eventType, "sqrtPriceX96", sqrt, "tx_hash", txHash)
			}
		case "StorageDeposit":
			continue
		}
	}
}

// extractSqrtFromAttrs uses extractEventFields to read the price from event attrs.
func extractPrice(event map[string]interface{}) (string, bool) {
	fields, ok := extractEventFields(event, []string{}, []string{"sqrtPriceX96", "sqrt_price_x96"})
	if !ok {
		slog.Error("failed to extract price", "event", event)
		return "", false
	}

	return fields["sqrtPriceX96"], true
}
