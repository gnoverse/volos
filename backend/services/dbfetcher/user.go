package dbfetcher

import (
	"context"
	"log/slog"
	"math/big"
	"strings"

	"volos-backend/model"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
)

// GetUser retrieves user data from Firestore by user address
func GetUser(client *firestore.Client, userAddress string) (*model.User, error) {
	ctx := context.Background()

	doc, err := client.Collection("users").Doc(userAddress).Get(ctx)
	if err != nil {
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
// Returns cumulative total loan amounts in fiat (USD) ordered by timestamp in ascending order.
func GetUserLoanHistory(client *firestore.Client, userAddress string) ([]model.UserLoan, error) {
	ctx := context.Background()
	var results []model.UserLoan
	cumulativeTotalUSD := big.NewFloat(0)

	query := client.CollectionGroup("market_history").
		Where("caller", "==", userAddress).
		Where("event_type", "in", []string{"Borrow", "Repay"}).
		OrderBy("timestamp", firestore.Asc)

	historyIter := query.Documents(ctx)
	defer historyIter.Stop()

	for {
		historyDoc, err := historyIter.Next()
		if err != nil {
			break
		}

		var history model.MarketHistory
		if err := historyDoc.DataTo(&history); err != nil {
			slog.Error("Error parsing market history", "error", err)
			continue
		}

		amount := utils.ParseAmount(history.Delta, "GetUserLoanHistory")
		if amount.Sign() == 0 {
			continue
		}

		marketRef := historyDoc.Ref.Parent.Parent
		if marketRef == nil {
			slog.Error("Invalid document path structure", "docPath", historyDoc.Ref.Path)
			continue
		}

		marketID := marketRef.ID

		marketData, err := marketRef.Get(ctx)
		if err != nil {
			slog.Error("Error getting market data", "error", err, "marketPath", marketRef.Path)
			continue
		}

		var market model.Market
		if err := marketData.DataTo(&market); err != nil {
			slog.Error("Error parsing market data", "error", err)
			continue
		}

		// Convert denom amount to USD value: (amount / 10^decimals) * price_per_token
		amountFloat := new(big.Float).SetInt(amount)
		priceFloat := new(big.Float).SetFloat64(history.LoanPrice)

		decimals := big.NewInt(1)
		decimals.Exp(big.NewInt(10), big.NewInt(int64(market.LoanTokenDecimals)), nil)
		decimalsFloat := new(big.Float).SetInt(decimals)

		actualTokens := new(big.Float).Quo(amountFloat, decimalsFloat)
		eventValueUSD := new(big.Float).Mul(actualTokens, priceFloat)

		switch history.Operation {
		case "+":
			cumulativeTotalUSD.Add(cumulativeTotalUSD, eventValueUSD)
		case "-":
			cumulativeTotalUSD.Sub(cumulativeTotalUSD, eventValueUSD)
		}

		point := model.UserLoan{
			Value:                 cumulativeTotalUSD.Text('f', -1),
			Timestamp:             history.Timestamp,
			MarketID:              marketID,
			EventType:             history.EventType,
			Operation:             history.Operation,
			LoanTokenSymbol:       market.LoanTokenSymbol,
			CollateralTokenSymbol: market.CollateralTokenSymbol,
		}

		results = append(results, point)
	}

	return results, nil
}

// GetUserMarketPosition fetches a single per-market aggregate for a user from users/{address}/markets/{marketId}
// and calculates maxBorrow and healthFactor based on the Gno contract logic
func GetUserMarketPosition(client *firestore.Client, userAddress string, marketID string) (*model.UserMarketPosition, error) {
	ctx := context.Background()

	dsnap, err := client.Collection("users").Doc(userAddress).Collection("markets").Doc(strings.ReplaceAll(marketID, "/", "_")).Get(ctx)
	if err != nil {
		return nil, err
	}

	var pos model.UserMarketPosition
	if err := dsnap.DataTo(&pos); err != nil {
		return nil, err
	}

	marketDoc, err := client.Collection("markets").Doc(strings.ReplaceAll(marketID, "/", "_")).Get(ctx)
	if err != nil {
		return nil, err
	}

	var market model.Market
	if err := marketDoc.DataTo(&market); err != nil {
		return nil, err
	}

	pos.MaxBorrow, pos.HealthFactor = calculateMaxBorrowAndHealthFactor(pos, market)

	return &pos, nil
}

// calculateMaxBorrowAndHealthFactor calculates maxBorrow and healthFactor based on Gno contract logic
func calculateMaxBorrowAndHealthFactor(pos model.UserMarketPosition, market model.Market) (string, float64) {
	borrowAmount := utils.ParseAmount(pos.Borrow, "calculateMaxBorrowAndHealthFactor loan")
	collateralAmount := utils.ParseAmount(pos.CollateralSupply, "calculateMaxBorrowAndHealthFactor collateral")
	currentPrice := utils.ParseAmount(market.CurrentPrice, "calculateMaxBorrowAndHealthFactor price")

	// Parse LLTV - convert percentage to WAD-scaled value
	// market.LLTV is stored as percentage (e.g., 75 for 75%)
	// Convert to WAD: 75% = 0.75 * 1e18 = 750000000000000000000
	lltvPercentage := big.NewFloat(market.LLTV)
	lltvWad := new(big.Float).Mul(lltvPercentage, big.NewFloat(1e16))

	if collateralAmount.Sign() == 0 {
		return "0", 0.0
	}

	// Calculate collateral value in loan token terms
	// collateralValue = (collateralAmount * currentPrice) / ORACLE_PRICE_SCALE
	oraclePriceScale := new(big.Int).Exp(big.NewInt(10), big.NewInt(36), nil)
	collateralValue := new(big.Int).Mul(collateralAmount, currentPrice)
	collateralValue = new(big.Int).Div(collateralValue, oraclePriceScale)

	// Calculate maxBorrow = collateralValue * LLTV
	// Convert LLTV from float64 to big.Int for calculation
	lltvInt := new(big.Int)
	lltvWad.Int(lltvInt) // This converts the WAD-scaled float to int
	maxBorrow := new(big.Int).Mul(collateralValue, lltvInt)
	maxBorrow = new(big.Int).Div(maxBorrow, new(big.Int).Exp(big.NewInt(10), big.NewInt(18), nil)) // Divide by WAD

	// Calculate healthFactor
	// healthFactor = maxBorrow / loanAmount (if loanAmount > 0)
	healthFactor := 0.0
	if borrowAmount.Sign() > 0 {
		maxBorrowFloat := new(big.Float).SetInt(maxBorrow)
		borrowAmountFloat := new(big.Float).SetInt(borrowAmount)
		healthRatio := new(big.Float).Quo(maxBorrowFloat, borrowAmountFloat)
		healthFactor, _ = healthRatio.Float64()
	} else {
		// If no loan, healthFactor is infinite (represented as a large number)
		healthFactor = 999999.0
	}

	return maxBorrow.String(), healthFactor
}
