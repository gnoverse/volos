package firebase

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"

	"cloud.google.com/go/firestore"
)

// FetchMarketData retrieves data from Firestore for a given marketId and path
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
		dataArray = append(dataArray, data)
	}

	jsonData, err := json.Marshal(dataArray)
	if err != nil {
		log.Printf("Error marshaling JSON: %v", err)
		return "", err
	}

	return string(jsonData), nil
} 
