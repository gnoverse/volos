package dbfetcher

import (
	"context"
	"math/big"
	"sort"
	"time"

	"volos-backend/model"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
)

// GetUser retrieves user data from Firestore by user address
func GetUser(client *firestore.Client, userAddress string) (*model.User, error) {
	ctx := context.Background()

	doc, err := client.Collection("users").Doc(userAddress).Get(ctx)
	if err != nil {
		// If user doesn't exist, return default user data - failsafe
		if err.Error() == "not found" {
			return &model.User{
				Address:   userAddress,
				DAOMember: false,
				StakedVLS: make(map[string]int64),
				CreatedAt: time.Time{},
			}, nil
		}
		return nil, err
	}

	var user model.User
	if err := doc.DataTo(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

// GetUserPendingUnstakes retrieves all pending unstake documents from a user's pendingUnstakes subcollection
func GetUserPendingUnstakes(client *firestore.Client, userAddress string) ([]model.PendingUnstake, error) {
	ctx := context.Background()

	var pendingUnstakes []model.PendingUnstake

	iter := client.Collection("users").Doc(userAddress).Collection("pendingUnstakes").Documents(ctx)
	defer iter.Stop()

	for {
		doc, err := iter.Next()
		if err != nil {
			break
		}

		var pendingUnstake model.PendingUnstake
		if err := doc.DataTo(&pendingUnstake); err != nil {
			continue
		}

		pendingUnstakes = append(pendingUnstakes, pendingUnstake)
	}

	return pendingUnstakes, nil
}

// GetUserLoanHistory retrieves all borrow/repay events for a user across all markets.
// Returns all user loans in fiat (USD) ordered by timestamp in ascending order.
func GetUserLoanHistory(client *firestore.Client, userAddress string) ([]model.UserLoan, error) {
	ctx := context.Background()
	var results []model.UserLoan

	marketsIter := client.Collection("markets").Documents(ctx)
	defer marketsIter.Stop()

	for {
		marketDoc, err := marketsIter.Next()
		if err != nil {
			break
		}

		marketID := marketDoc.Ref.ID

		marketData, err := client.Collection("markets").Doc(marketID).Get(ctx)
		if err != nil {
			continue
		}

		var market model.Market
		if err := marketData.DataTo(&market); err != nil {
			continue
		}

		query := client.Collection("markets").Doc(marketID).Collection("market_history").
			Where("caller", "==", userAddress).
			Where("event_type", "in", []string{"Borrow", "Repay"})
			//TODO : .OrderBy("timestamp", firestore.Asc) - optimization instead of sorting in the end (requires Firebase index)

		historyIter := query.Documents(ctx)
		defer historyIter.Stop()

		for {
			historyDoc, err := historyIter.Next()
			if err != nil {
				break
			}

			var history model.MarketHistory
			if err := historyDoc.DataTo(&history); err != nil {
				continue
			}

			amount := utils.ParseAmount(history.Value, "GetUserLoanHistory")
			if amount.Sign() == 0 {
				continue
			}

			// Convert denom amount to USD value: (amount / 10^decimals) * price_per_token
			amountFloat := new(big.Float).SetInt(amount)
			priceFloat := new(big.Float).SetFloat64(history.LoanPrice)

			decimals := big.NewInt(1)
			decimals.Exp(big.NewInt(10), big.NewInt(int64(market.LoanTokenDecimals)), nil)
			decimalsFloat := new(big.Float).SetInt(decimals)

			actualTokens := new(big.Float).Quo(amountFloat, decimalsFloat)
			valueFloat := new(big.Float).Mul(actualTokens, priceFloat)

			valueInUSD := valueFloat.Text('f', -1)

			point := model.UserLoan{
				Value:                 valueInUSD,
				Timestamp:             history.Timestamp,
				MarketID:              marketID,
				EventType:             history.EventType,
				Operation:             history.Operation,
				LoanTokenSymbol:       market.LoanTokenSymbol,
				CollateralTokenSymbol: market.CollateralTokenSymbol,
			}

			results = append(results, point)
		}
	}

	sort.Slice(results, func(i, j int) bool {
		return results[i].Timestamp.Before(results[j].Timestamp)
	})

	return results, nil
}
