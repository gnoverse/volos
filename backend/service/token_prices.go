package service

// TokenPrices is a global map that stores the fiat price of each loan token denomination by market ID.
// In the future, this file will contain logic to fetch real-time token prices from external APIs
// and update this map periodically.
// For now, it contains mock values for development purposes.
var TokenPrices = map[string]float64{
	// Mock token prices - these will be replaced with real price fetching logic
	// Format: "market_id": fiat_price_in_usd
	"gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/gns:3000":  0.00001, // Example market ID for GNOT token denom
	"gno.land/r/demo/wugnot:gno.land/r/gnoswap/v1/test_token/bar:3000": 0.00001, // Example market ID for uGNOT token denom
}

// GetTokenPrice returns the fiat price for a given market ID.
// If the market ID is not found, it returns a default price of 1.0.
func GetTokenPrice(marketId string) float64 {
	if price, exists := TokenPrices[marketId]; exists {
		return price
	}
	// Default price for unknown tokens
	return 1.0
}
