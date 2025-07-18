package services

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"cloud.google.com/go/firestore"
)

// FetchMarketData retrieves data from Firestore for a given marketId and path
// It's used to fetch data from Firestore for the frontend.
func FetchMarketData(client *firestore.Client, marketId, path string) (string, error) {
	ctx := context.Background()
	safeMarketId := strings.ReplaceAll(marketId, "/", "_")
	collectionPath := fmt.Sprintf("markets/%s/%s", safeMarketId, path)
	subcollection := client.Collection("markets").Doc(safeMarketId).Collection(path)
	docs, err := subcollection.Documents(ctx).GetAll()
	if err != nil {
		log.Printf("Error fetching documents from %s: %v", collectionPath, err)
		return "", err
	}

	var dataArray []map[string]interface{}
	for _, doc := range docs {
		data := doc.Data()
		// If this is market_activity, unsanitize the hash field
		if path == "market_activity" {
			if hash, ok := data["hash"].(string); ok {
				data["hash"] = strings.ReplaceAll(hash, "~", "/")
			}
		}
		dataArray = append(dataArray, data)
	}

	jsonData, err := json.Marshal(dataArray)
	if err != nil {
		log.Printf("Error marshaling JSON: %v", err)
		return "", err
	}

	return string(jsonData), nil
}
