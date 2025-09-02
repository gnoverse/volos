package processor

import (
	"log/slog"
	"volos-backend/services/dbupdater"

	"cloud.google.com/go/firestore"
)

// processGnoswapPoolTransaction handles transactions from the gnoswap pool package,
// focusing only on CreatePool and Swap events, extracting the "sqrtPriceX96" attribute.
func processGnoswapPoolTransaction(tx map[string]interface{}, firestoreClient *firestore.Client) {
	events := extractEventsFromTx(tx)
	if events == nil {
		return
	}

	for _, eventInterface := range events {
		event, eventType := getEventAndType(eventInterface)
		if event == nil || eventType == "" {
			continue
		}

		switch eventType {
		case "Swap":
			if sqrt, poolPath, ok := extractPrice(event); ok {
				dbupdater.UpdatePrice(firestoreClient, sqrt, poolPath)
			}
		case "StorageDeposit":
			continue
		}
	}
}

// extractPrice extracts the "sqrtPriceX96" and "poolPath" attributes from an event payload.
func extractPrice(event map[string]interface{}) (string, string, bool) {
	fields, ok := extractEventFields(event, []string{}, []string{"sqrtPriceX96", "poolPath"})
	if !ok {
		slog.Error("failed to extract price", "event", event)
		return "", "", false
	}

	return fields["sqrtPriceX96"], fields["poolPath"], true
}
