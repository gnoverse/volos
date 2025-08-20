package dbupdater

import (
	"context"
	"log"
	"strconv"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
)

// CreateMarket creates a new market in the Firestore database.
// It uses sanitizedMarketID (replacing "/" with "_") to avoid issues with Firestore document IDs.
func CreateMarket(client *firestore.Client, marketID, loanToken, collateralToken, timestamp string) {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	timestampInt, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		log.Printf("Error parsing timestamp for market %s: %v", marketID, err)
		return
	}

	marketData := map[string]interface{}{
		"id":               marketID,
		"loan_token":       loanToken,
		"collateral_token": collateralToken,
		"created_at":       time.Unix(timestampInt, 0),
	}

	_, err = client.Collection("markets").Doc(sanitizedMarketID).Set(context.Background(), marketData)
	if err != nil {
		log.Printf("Error creating market document %s: %v", marketID, err)
		return
	}

	log.Printf("Successfully created market document: %s", marketID)
}
