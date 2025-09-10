package services

// TokenPrices is a global map that stores the fiat price of each loan token by market ID.
// In the future, this file will contain logic to fetch real-time token prices from external APIs
// and update this map periodically.
// For now, it contains mock values for development purposes.
var TokenPrices = map[string]float64{
	// Mock token prices - these will be replaced with real price fetching logic
	// Format: "market_id": fiat_price_in_usd_per_whole_token
	//
	// Mock prices are set to $100 per whole token for development.
	// In the future, these prices will be fetched from real price feeds.
	"gno.land/r/gnoland/wugnot:gno.land/r/gnoswap/gns:3000:0":            10.0, // Example market ID for GNOT token
	"gno.land/r/gnoland/wugnot:gno.land/r/gnoswap/test_token/bar:3000:0": 10.0, // Example market ID for test token
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
