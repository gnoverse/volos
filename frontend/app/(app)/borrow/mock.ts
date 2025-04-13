export type Asset = {
  id: string                    // marketId (poolPath from Gno)
  loanToken: string            // from GetMarketParamsLoanToken
  collateralToken: string      // from GetMarketParamsCollateralToken
  loanSymbol: string           // derived from token path
  collateralSymbol: string     // derived from token path
  totalSupplyAssets: string    // from GetMarketTotalSupplyAssets
  totalSupplyShares: string    // from GetMarketTotalSupplyShares
  totalBorrowAssets: string    // from GetMarketTotalBorrowAssets
  totalBorrowShares: string    // from GetMarketTotalBorrowShares
  lastUpdate: number           // from GetMarketLastUpdate
  fee: string                  // from GetMarketFee
  lltv: string                 // from GetMarketParamsLLTV
  irm: string                  // from GetMarketParamsIRM
  apy: number                  // calculated from IRM's BorrowRate
  price: string               // from GetMarketPrice
}

// Sample data for the table
export const assets: Asset[] = [
  {
    id: "eth:usdc:3000",
    loanToken: "r/tokens/eth",
    collateralToken: "r/tokens/usdc",
    loanSymbol: "ETH",
    collateralSymbol: "USDC",
    totalSupplyAssets: "475170000000000000000",
    totalSupplyShares: "475170000000000000000",
    totalBorrowAssets: "181750000000000000000",
    totalBorrowShares: "181750000000000000000",
    lastUpdate: 1710831600,
    fee: "500000000000000000", // 5%
    lltv: "850000000000000000", // 85%
    irm: "default",
    apy: 5.26,
    price: "2500000000000000000000"
  },
  {
    id: "btc:usdc:3000",
    loanToken: "r/tokens/btc",
    collateralToken: "r/tokens/usdc",
    loanSymbol: "BTC",
    collateralSymbol: "USDC",
    totalSupplyAssets: "124300000000000000000",
    totalSupplyShares: "124300000000000000000",
    totalBorrowAssets: "89750000000000000000",
    totalBorrowShares: "89750000000000000000",
    lastUpdate: 1710831600,
    fee: "500000000000000000",
    lltv: "800000000000000000",
    irm: "default",
    apy: 2.54,
    price: "45000000000000000000000"
  },
  {
    id: "sol:usdc:3000",
    loanToken: "r/tokens/sol",
    collateralToken: "r/tokens/usdc",
    loanSymbol: "SOL",
    collateralSymbol: "USDC",
    totalSupplyAssets: "125467000000000000000",
    totalSupplyShares: "125467000000000000000",
    totalBorrowAssets: "75280200000000000000",
    totalBorrowShares: "75280200000000000000",
    lastUpdate: 1710831600,
    fee: "500000000000000000",
    lltv: "700000000000000000",
    irm: "default",
    apy: 5.32,
    price: "125000000000000000000"
  },
  {
    id: "usdc:eth:3000",
    loanToken: "r/tokens/usdc",
    collateralToken: "r/tokens/eth",
    loanSymbol: "USDC",
    collateralSymbol: "ETH", 
    totalSupplyAssets: "500000000000000000000",
    totalSupplyShares: "500000000000000000000",
    totalBorrowAssets: "250000000000000000000",
    totalBorrowShares: "250000000000000000000",
    lastUpdate: 1710831600,
    fee: "500000000000000000",
    lltv: "900000000000000000",
    irm: "default",
    apy: 4.78,
    price: "1000000000000000"
  },
  {
    id: "ada:usdc:3000",
    loanToken: "r/tokens/ada",
    collateralToken: "r/tokens/usdc",
    loanSymbol: "ADA",
    collateralSymbol: "USDC",
    totalSupplyAssets: "324587000000000000000",
    totalSupplyShares: "324587000000000000000",
    totalBorrowAssets: "194752200000000000000",
    totalBorrowShares: "194752200000000000000",
    lastUpdate: 1710831600,
    fee: "500000000000000000",
    lltv: "650000000000000000",
    irm: "default",
    apy: 4.12,
    price: "0600000000000000000"
  },
  {
    id: "dot:usdc:3000",
    loanToken: "r/tokens/dot",
    collateralToken: "r/tokens/usdc",
    loanSymbol: "DOT",
    collateralSymbol: "USDC",
    totalSupplyAssets: "187632000000000000000",
    totalSupplyShares: "187632000000000000000",
    totalBorrowAssets: "112579200000000000000",
    totalBorrowShares: "112579200000000000000",
    lastUpdate: 1710831600,
    fee: "500000000000000000",
    lltv: "600000000000000000",
    irm: "default",
    apy: 7.85,
    price: "8000000000000000000"
  },
  {
    id: "avax:usdc:3000",
    loanToken: "r/tokens/avax",
    collateralToken: "r/tokens/usdc",
    loanSymbol: "AVAX",
    collateralSymbol: "USDC",
    totalSupplyAssets: "65218000000000000000",
    totalSupplyShares: "65218000000000000000",
    totalBorrowAssets: "39130800000000000000",
    totalBorrowShares: "39130800000000000000",
    lastUpdate: 1710831600,
    fee: "500000000000000000",
    lltv: "750000000000000000",
    irm: "default",
    apy: 6.25,
    price: "35000000000000000000"
  },
  {
    id: "link:usdc:3000",
    loanToken: "r/tokens/link",
    collateralToken: "r/tokens/usdc",
    loanSymbol: "LINK",
    collateralSymbol: "USDC",
    totalSupplyAssets: "214590000000000000000",
    totalSupplyShares: "214590000000000000000",
    totalBorrowAssets: "128754000000000000000",
    totalBorrowShares: "128754000000000000000",
    lastUpdate: 1710831600,
    fee: "500000000000000000",
    lltv: "620000000000000000",
    irm: "default",
    apy: 4.45,
    price: "18000000000000000000"
  },
  {
    id: "matic:usdc:3000",
    loanToken: "r/tokens/matic",
    collateralToken: "r/tokens/usdc",
    loanSymbol: "MATIC",
    collateralSymbol: "USDC",
    totalSupplyAssets: "756244000000000000000",
    totalSupplyShares: "756244000000000000000",
    totalBorrowAssets: "453746400000000000000",
    totalBorrowShares: "453746400000000000000",
    lastUpdate: 1710831600,
    fee: "500000000000000000",
    lltv: "680000000000000000",
    irm: "default",
    apy: 5.87,
    price: "1500000000000000000"
  },
  {
    id: "usdt:usdc:3000",
    loanToken: "r/tokens/usdt",
    collateralToken: "r/tokens/usdc",
    loanSymbol: "USDT",
    collateralSymbol: "USDC",
    totalSupplyAssets: "850000000000000000000",
    totalSupplyShares: "850000000000000000000",
    totalBorrowAssets: "510000000000000000000",
    totalBorrowShares: "510000000000000000000",
    lastUpdate: 1710831600,
    fee: "500000000000000000",
    lltv: "880000000000000000",
    irm: "default",
    apy: 4.25,
    price: "1000000000000000000"
  }
]
