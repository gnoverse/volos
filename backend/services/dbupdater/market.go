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
	loanTokenName string,
	loanTokenSymbol string,
	loanTokenDecimals string,
	collateralTokenName string,
	collateralTokenSymbol string,
	collateralTokenDecimals string,
	timestamp string,
	lltv string,
) {
	sanitizedMarketID := strings.ReplaceAll(marketID, "/", "_")
	timestampInt := utils.ParseTimestamp(timestamp, "market creation")
	if timestampInt == 0 {
		return
	}

	loanDecimals := utils.ParseInt64(loanTokenDecimals, "market creation loanTokenDecimals")
	collDecimals := utils.ParseInt64(collateralTokenDecimals, "market creation collateralTokenDecimals")
	lltvPercent := utils.WadToPercent(lltv, "market creation lltv")

	marketData := map[string]interface{}{
		"id":                        marketID,
		"loan_token":                loanToken,
		"collateral_token":          collateralToken,
		"loan_token_name":           loanTokenName,
		"loan_token_symbol":         loanTokenSymbol,
		"loan_token_decimals":       loanDecimals,
		"collateral_token_name":     collateralTokenName,
		"collateral_token_symbol":   collateralTokenSymbol,
		"collateral_token_decimals": collDecimals,
		"created_at":                time.Unix(timestampInt, 0),
		"lltv":                      lltvPercent,
	}

	_, err := client.Collection("markets").Doc(sanitizedMarketID).Set(context.Background(), marketData)
	if err != nil {
		slog.Error("failed to create market in database", "market_id", marketID, "loan_token", loanToken, "collateral_token", collateralToken, "error", err)
		return
	}

	slog.Info("market created", "market_id", marketID)
}
