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
	"volos-backend/services"

	"cloud.google.com/go/firestore"
)


func InitFirestoreData(client *firestore.Client) error {
	ctx := context.Background()

	marketIds, err := services.GetAllMarketIDs()
	if err != nil {
		log.Printf("Error fetching market IDs: %v", err)
		return err
	}

	log.Printf("Found %d market IDs", len(marketIds))

	for _, marketId := range marketIds {
		log.Printf("Filling subcollections for marketId: %s", marketId)
		if err := fillMarketSubcollections(ctx, client, marketId); err != nil {
			log.Printf("Error filling subcollections for marketId %s: %v", marketId, err)
		}
	}

	log.Println("Successfully filled all Firestore subcollections for all market IDs!")
	return nil
}

func fillMarketSubcollections(ctx context.Context, client *firestore.Client, marketId string) error {
	safeMarketId := strings.ReplaceAll(marketId, "/", "_")
	if err := fillSubcollection(ctx, client, safeMarketId, "total_borrow", update.GetTotalBorrowHistory, marketId, nil); err != nil {
		return err
	}
	if err := fillSubcollection(ctx, client, safeMarketId, "total_supply", update.GetTotalSupplyHistory, marketId, nil); err != nil {
		return err
	}
	if err := fillSubcollection(ctx, client, safeMarketId, "apr", update.GetAPRHistory, marketId, nil); err != nil {
		return err
	}
	if err := fillSubcollection(ctx, client, safeMarketId, "total_utilization", update.GetUtilizationHistory, marketId, nil); err != nil {
		return err
	}
	return nil
}

type dataFetcher func(string, *int) ([]services.Data, error)

func fillSubcollection(ctx context.Context, client *firestore.Client, marketId, subcollectionName string, fetcher dataFetcher, fetchId string, minBlockHeight *int) error {
	data, err := fetcher(fetchId, minBlockHeight)
	if err != nil {
		log.Printf("Error fetching data for %s/%s: %v", marketId, subcollectionName, err)
		return err
	}
	if data == nil {
		log.Printf("No data returned for %s/%s", marketId, subcollectionName)
		return nil
	}

	marketDoc := client.Collection("markets").Doc(marketId)
	subcollection := marketDoc.Collection(subcollectionName)

	docs, err := subcollection.Documents(ctx).GetAll()
	if err != nil {
		return err
	}
	for _, doc := range docs {
		doc.Ref.Delete(ctx)
	}

	for _, item := range data {
		_, err := subcollection.Doc(item.Timestamp).Set(ctx, item)
		if err != nil {
			return err
		}
	}

	log.Printf("Filled markets/%s/%s subcollection with %d documents", marketId, subcollectionName, len(data))
	return nil
}
