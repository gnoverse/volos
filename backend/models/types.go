package types

// Market represents a lending market for a specific token pair
type Market struct {
	TotalSupplyAssets string `json:"totalSupplyAssets"`
	TotalSupplyShares string `json:"totalSupplyShares"`
	TotalBorrowAssets string `json:"totalBorrowAssets"`
	TotalBorrowShares string `json:"totalBorrowShares"`
	LastUpdate        int64  `json:"lastUpdate"`
	Fee               string `json:"fee"`
}

// Position represents a user's position in a market
type Position struct {
	SupplyShares string `json:"supplyShares"`
	BorrowShares string `json:"borrowShares"`
	Collateral   string `json:"collateral"`
}

// MarketParams defines parameters for market creation
type MarketParams struct {
	PoolPath     string `json:"poolPath"`
	IRM          string `json:"irm"`
	LLTV         string `json:"lltv"`
	IsToken0Loan bool   `json:"isToken0Loan"`
}

// MarketInfo combines Market, MarketParams, and Position plus extra fields
type MarketInfo struct {
	Market       Market       `json:"market"`
	Params       MarketParams `json:"params"`
	UserPosition Position     `json:"userPosition"`

	// Additional fields
	LoanToken       string `json:"loanToken"`
	CollateralToken string `json:"collateralToken"`
	CurrentPrice    string `json:"currentPrice"`
	BorrowAPR       string `json:"borrowAPR"`
	SupplyAPR       string `json:"supplyAPR"`
	Utilization     string `json:"utilization"`

	// Token information fields
	LoanTokenName           string `json:"loanTokenName"`
	LoanTokenSymbol         string `json:"loanTokenSymbol"`
	LoanTokenDecimals       int    `json:"loanTokenDecimals"`
	CollateralTokenName     string `json:"collateralTokenName"`
	CollateralTokenSymbol   string `json:"collateralTokenSymbol"`
	CollateralTokenDecimals int    `json:"collateralTokenDecimals"`

	MarketId string `json:"marketId,omitempty"`
}

// ChartData for history endpoints
type ChartData struct {
	Value     float64 `json:"value"`
	Timestamp int64   `json:"timestamp"`
}

// LoanAmount for user loan queries
type LoanAmount struct {
	Amount string `json:"amount"`
}

// UserLoan for user loan list
type UserLoan struct {
	Token  string `json:"token"`
	Amount string `json:"amount"`
}

// HealthFactor for health factor queries
type HealthFactor struct {
	HealthFactor string `json:"healthFactor"`
}
