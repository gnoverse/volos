package dbfetcher

import (
	"context"
	"strings"

	"cloud.google.com/go/firestore"
)

// todo : when markets are populated in the db, they will be converted with maps in the db instead of collectiions
// key:value -> timestamp:value
// this will change this function

// FetchMarketData retrieves data from Firestore for a given marketId and path
// It's used to fetch data from Firestore for the frontend.
func FetchMarketData(client *firestore.Client, marketId, path string) ([]map[string]interface{}, error) {
	ctx := context.Background()
	safeMarketId := strings.ReplaceAll(marketId, "/", "_")
	subcollection := client.Collection("markets").Doc(safeMarketId).Collection(path)
	docs, err := subcollection.Documents(ctx).GetAll()
	if err != nil {
		return nil, err
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

	return dataArray, nil
}
