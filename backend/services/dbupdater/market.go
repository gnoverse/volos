package dbupdater

import (
	"context"
	"log/slog"
	"strings"
	"time"
	"volos-backend/services/utils"

	"cloud.google.com/go/firestore"
)

// CreateMarket creates a new market in the Firestore database.
// It uses sanitizedMarketID (replacing "/" with "_") to avoid issues with Firestore document IDs.
func CreateMarket(client *firestore.Client,
	marketID, loanToken, collateralToken string,
	isToken0Loan string,
	loanTokenName string,
	loanTokenSymbol string,
	loanTokenDecimals string,
	collateralTokenName string,
	collateralTokenSymbol string,
	collateralTokenDecimals string,
	timestamp string,
) {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	timestampInt := utils.ParseTimestamp(timestamp, "market creation")
	if timestampInt == 0 {
		return
	}

	marketData := map[string]interface{}{
		"id":                        marketID,
		"loan_token":                loanToken,
		"collateral_token":          collateralToken,
		"is_token0_loan":            isToken0Loan,
		"loan_token_name":           loanTokenName,
		"loan_token_symbol":         loanTokenSymbol,
		"loan_token_decimals":       loanTokenDecimals,
		"collateral_token_name":     collateralTokenName,
		"collateral_token_symbol":   collateralTokenSymbol,
		"collateral_token_decimals": collateralTokenDecimals,
		"created_at":                time.Unix(timestampInt, 0),
	}

	_, err := client.Collection("markets").Doc(sanitizedMarketID).Set(context.Background(), marketData)
	if err != nil {
		slog.Error("failed to create market in database", "market_id", marketID, "loan_token", loanToken, "collateral_token", collateralToken, "error", err)
		return
	}

	slog.Info("market created", "market_id", marketID)
}
