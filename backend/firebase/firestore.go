// This file is responsible for updating Firestore with the latest market data.
// It does so by calling the functions in the update_db package (e.g., update_db/total_borrow.go, etc.),
// which query the indexer for the latest blockchain data and return results.
// The results are then written to the appropriate Firestore collections and subcollections for each market.
// This enables fast, precomputed API responses for the frontend, without recalculating on every request.
package firebase

import (
	"context"
	"log"
	"strings"
	update "volos-backend/firebase/update_db"
	"volos-backend/model"
	"volos-backend/services"

	"encoding/json"

	"cloud.google.com/go/firestore"
)

// UpdateFirestoreData updates Firestore with the latest market data, starting from a minimum block height.
func UpdateFirestoreData(client *firestore.Client, minBlockHeight int, override bool) error {
	ctx := context.Background()

	marketIds, err := services.GetAllMarketIDs()
	if err != nil {
		log.Printf("Error fetching market IDs: %v", err)
		return err
	}

	log.Printf("Found %d market IDs", len(marketIds))

	for _, marketId := range marketIds {
		log.Printf("Filling subcollections for marketId: %s", marketId)
		if err := fillMarketSubcollections(ctx, client, marketId, minBlockHeight, override); err != nil {
			log.Printf("Error filling subcollections for marketId %s: %v", marketId, err)
		}
	}

	log.Println("Successfully filled all Firestore subcollections for all market IDs!")
	return nil
}

func fillMarketSubcollections(ctx context.Context, client *firestore.Client, marketId string, minBlockHeight int, override bool) error {
	safeMarketId := strings.ReplaceAll(marketId, "/", "_") // necessary to avoid invalid firestore collection names
	mbh := &minBlockHeight
	if err := fillSubcollection(ctx, client, safeMarketId, "total_borrow", update.GetTotalBorrowHistory, marketId, mbh, override); err != nil {
		return err
	}
	if err := fillSubcollection(ctx, client, safeMarketId, "total_supply", update.GetTotalSupplyHistory, marketId, mbh, override); err != nil {
		return err
	}
	if err := fillSubcollection(ctx, client, safeMarketId, "apr", update.GetAPRHistory, marketId, mbh, override); err != nil {
		return err
	}
	if err := fillMarketActivitySubcollection(ctx, client, safeMarketId, marketId, update.GetMarketActivity, mbh, override); err != nil {
		return err
	}
	if err := fillSubcollection(ctx, client, safeMarketId, "total_utilization", update.GetUtilizationHistory, marketId, mbh, override); err != nil {
		return err
	}
	return nil
}

type dataFetcher func(string, *int, float64) ([]model.Data, error)
type marketActivityFetcher func(string, *int, float64) ([]model.MarketActivity, error)

// fillSubcollection updates a single subcollection with incremental logic.
// If override is true or minBlockHeight == BlockHeightOnDeploy, it starts from zero (used on initial db population).
// Otherwise, it reads the last value from Firestore and continues the running total from there, appending only new data.
func fillSubcollection(ctx context.Context, client *firestore.Client, marketId, subcollectionName string, fetcher dataFetcher, fetchId string, minBlockHeight *int, override bool) error {
	var startingValue float64 = 0
	if !override && minBlockHeight != nil && *minBlockHeight > model.BlockHeightOnDeploy {
		marketDoc := client.Collection("markets").Doc(marketId)
		subcollection := marketDoc.Collection(subcollectionName)
		q := subcollection.OrderBy("timestamp", firestore.Desc).Limit(1)
		docs, err := q.Documents(ctx).GetAll()
		if err == nil && len(docs) > 0 {
			if v, ok := docs[0].Data()["value"]; ok {
				switch val := v.(type) {
				case float64:
					startingValue = val
				case int64:
					startingValue = float64(val)
				}
			}
		}
	}

	data, err := fetcher(fetchId, minBlockHeight, startingValue)
	if err != nil {
		log.Printf("Error fetching data for %s/%s: %v", marketId, subcollectionName, err)
		return err
	}
	if data == nil {
		return nil
	}

	marketDoc := client.Collection("markets").Doc(marketId)
	subcollection := marketDoc.Collection(subcollectionName)

	if override {
		docs, err := subcollection.Documents(ctx).GetAll()
		if err != nil {
			return err
		}
		for _, doc := range docs {
			doc.Ref.Delete(ctx)
		}
	}

	for _, item := range data {
		m := structToLowercaseMap(item)
		_, err := subcollection.Doc(item.Timestamp).Set(ctx, m)
		if err != nil {
			return err
		}
	}

	log.Printf("Filled markets/%s/%s subcollection with %d documents", marketId, subcollectionName, len(data))
	return nil
}

// fillMarketActivitySubcollection updates the market_activity subcollection with incremental logic.
// Similar to fillSubcollection, but works with MarketActivity data type instead of running totals.
// If override is true or minBlockHeight == BlockHeightOnDeploy, it starts from zero (full fill).
// Otherwise, it appends only new activity events since the last block.
func fillMarketActivitySubcollection(ctx context.Context, client *firestore.Client, safeMarketId string, marketId string, fetcher marketActivityFetcher, minBlockHeight *int, override bool) error {
	var startingValue float64 = 0
	if !override && minBlockHeight != nil && *minBlockHeight > model.BlockHeightOnDeploy {
		marketDoc := client.Collection("markets").Doc(safeMarketId)
		subcollection := marketDoc.Collection("market_activity")
		q := subcollection.OrderBy("timestamp", firestore.Desc).Limit(1)
		docs, err := q.Documents(ctx).GetAll()
		if err == nil && len(docs) > 0 {
			if v, ok := docs[0].Data()["value"]; ok {
				switch val := v.(type) {
				case float64:
					startingValue = val
				case int64:
					startingValue = float64(val)
				}
			}
		}
	}

	data, err := fetcher(marketId, minBlockHeight, startingValue)
	if err != nil {
		log.Printf("Error fetching data for %s/market_activity: %v", marketId, err)
		return err
	}
	if data == nil {
		return nil
	}

	marketDoc := client.Collection("markets").Doc(safeMarketId)
	subcollection := marketDoc.Collection("market_activity")

	if override {
		docs, err := subcollection.Documents(ctx).GetAll()
		if err != nil {
			return err
		}
		for _, doc := range docs {
			doc.Ref.Delete(ctx)
		}
	}

	for _, item := range data {
		safeHash := strings.ReplaceAll(item.Hash, "/", "~")
		m := structToLowercaseMap(item)
		_, err := subcollection.Doc(safeHash).Set(ctx, m)
		if err != nil {
			return err
		}
	}

	log.Printf("Filled markets/%s/market_activity subcollection with %d documents", safeMarketId, len(data))
	return nil
}

// Helper to convert struct to map with lower-cased keys
func structToLowercaseMap(v interface{}) map[string]interface{} {
	b, _ := json.Marshal(v)
	var m map[string]interface{}
	json.Unmarshal(b, &m)
	lower := make(map[string]interface{})
	for k, v := range m {
		lower[strings.ToLower(k)] = v
	}
	return lower
}
