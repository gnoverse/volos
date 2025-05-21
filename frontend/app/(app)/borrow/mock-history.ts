export type MarketHistory = {
  name: string
  supply: number
  borrow: number
  utilization: number
  price: number
  apy: number
}

export type MarketHistoryMap = {
  [marketId: string]: MarketHistory[]
}

export const marketHistory: MarketHistoryMap = {
  "eth:usdc:3000": [
    { name: "2023-04-01", supply: 420.34, borrow: 154.21, utilization: 36.69, price: 2423.45, apy: 5.12 },
    { name: "2023-04-02", supply: 436.27, borrow: 168.93, utilization: 38.72, price: 2467.82, apy: 5.23 },
    { name: "2023-04-03", supply: 451.83, borrow: 172.45, utilization: 38.17, price: 2512.33, apy: 5.18 },
    { name: "2023-04-04", supply: 442.76, borrow: 177.32, utilization: 40.05, price: 2487.65, apy: 5.32 },
    { name: "2023-04-05", supply: 459.12, borrow: 183.74, utilization: 40.02, price: 2534.21, apy: 5.31 },
    { name: "2023-04-06", supply: 478.35, borrow: 189.26, utilization: 39.57, price: 2567.89, apy: 5.28 },
    { name: "2023-04-07", supply: 492.18, borrow: 195.87, utilization: 39.80, price: 2612.34, apy: 5.29 },
    { name: "2023-04-08", supply: 483.45, borrow: 199.32, utilization: 41.23, price: 2578.91, apy: 5.38 },
    { name: "2023-04-09", supply: 471.23, borrow: 193.75, utilization: 41.12, price: 2545.67, apy: 5.37 },
    { name: "2023-04-10", supply: 467.89, borrow: 185.43, utilization: 39.63, price: 2512.45, apy: 5.28 },
    { name: "2023-04-11", supply: 482.34, borrow: 188.76, utilization: 39.13, price: 2534.78, apy: 5.25 },
    { name: "2023-04-12", supply: 496.78, borrow: 193.21, utilization: 38.89, price: 2567.32, apy: 5.24 },
    { name: "2023-04-13", supply: 513.45, borrow: 201.87, utilization: 39.32, price: 2612.45, apy: 5.26 },
    { name: "2023-04-14", supply: 528.93, borrow: 212.45, utilization: 40.17, price: 2643.78, apy: 5.32 },
    { name: "2023-04-15", supply: 517.32, borrow: 208.98, utilization: 40.40, price: 2623.45, apy: 5.33 },
    { name: "2023-04-16", supply: 498.76, borrow: 198.45, utilization: 39.79, price: 2589.34, apy: 5.29 },
    { name: "2023-04-17", supply: 486.54, borrow: 193.21, utilization: 39.71, price: 2567.21, apy: 5.29 },
    { name: "2023-04-18", supply: 475.23, borrow: 186.78, utilization: 39.30, price: 2543.78, apy: 5.26 },
    { name: "2023-04-19", supply: 463.87, borrow: 178.43, utilization: 38.47, price: 2512.34, apy: 5.21 },
    { name: "2023-04-20", supply: 456.43, borrow: 176.21, utilization: 38.61, price: 2498.76, apy: 5.22 },
    { name: "2023-04-21", supply: 471.87, borrow: 182.43, utilization: 38.66, price: 2523.45, apy: 5.22 },
    { name: "2023-04-22", supply: 487.32, borrow: 189.76, utilization: 38.94, price: 2556.78, apy: 5.24 },
    { name: "2023-04-23", supply: 497.65, borrow: 197.43, utilization: 39.67, price: 2587.32, apy: 5.28 },
    { name: "2023-04-24", supply: 512.34, borrow: 207.89, utilization: 40.58, price: 2623.45, apy: 5.34 },
    { name: "2023-04-25", supply: 527.89, borrow: 217.65, utilization: 41.23, price: 2654.78, apy: 5.38 },
    { name: "2023-04-26", supply: 519.43, borrow: 211.23, utilization: 40.67, price: 2632.34, apy: 5.35 },
    { name: "2023-04-27", supply: 506.87, borrow: 203.45, utilization: 40.14, price: 2612.45, apy: 5.32 },
    { name: "2023-04-28", supply: 493.21, borrow: 195.78, utilization: 39.70, price: 2587.34, apy: 5.29 },
    { name: "2023-04-29", supply: 483.76, borrow: 190.45, utilization: 39.37, price: 2567.21, apy: 5.27 },
    { name: "2023-04-30", supply: 475.17, borrow: 181.75, utilization: 38.25, price: 2500.00, apy: 5.26 }
  ],
  
  "btc:usdc:3000": [
    { name: "2023-04-01", supply: 112.45, borrow: 78.34, utilization: 69.67, price: 43256.78, apy: 2.43 },
    { name: "2023-04-02", supply: 115.78, borrow: 80.21, utilization: 69.28, price: 43789.45, apy: 2.41 },
    { name: "2023-04-03", supply: 119.34, borrow: 83.45, utilization: 69.93, price: 44123.67, apy: 2.44 },
    { name: "2023-04-04", supply: 122.78, borrow: 85.67, utilization: 69.78, price: 44567.89, apy: 2.43 },
    { name: "2023-04-05", supply: 124.35, borrow: 87.21, utilization: 70.13, price: 44879.23, apy: 2.45 },
    { name: "2023-04-06", supply: 126.87, borrow: 88.56, utilization: 69.80, price: 45123.45, apy: 2.43 },
    { name: "2023-04-07", supply: 128.45, borrow: 90.21, utilization: 70.23, price: 45456.78, apy: 2.46 },
    { name: "2023-04-08", supply: 127.32, borrow: 89.76, utilization: 70.50, price: 45234.56, apy: 2.47 },
    { name: "2023-04-09", supply: 125.67, borrow: 88.43, utilization: 70.37, price: 44987.23, apy: 2.47 },
    { name: "2023-04-10", supply: 123.45, borrow: 86.78, utilization: 70.30, price: 44678.90, apy: 2.46 },
    { name: "2023-04-11", supply: 121.78, borrow: 85.23, utilization: 70.00, price: 44321.45, apy: 2.45 },
    { name: "2023-04-12", supply: 120.34, borrow: 84.12, utilization: 69.90, price: 44123.67, apy: 2.44 },
    { name: "2023-04-13", supply: 119.56, borrow: 83.67, utilization: 69.98, price: 44034.56, apy: 2.45 },
    { name: "2023-04-14", supply: 121.23, borrow: 84.89, utilization: 70.02, price: 44234.78, apy: 2.45 },
    { name: "2023-04-15", supply: 123.45, borrow: 86.43, utilization: 70.01, price: 44567.89, apy: 2.45 },
    { name: "2023-04-16", supply: 125.67, borrow: 87.98, utilization: 70.01, price: 44879.23, apy: 2.45 },
    { name: "2023-04-17", supply: 126.89, borrow: 88.76, utilization: 69.95, price: 45012.34, apy: 2.44 },
    { name: "2023-04-18", supply: 125.45, borrow: 87.65, utilization: 69.87, price: 44856.78, apy: 2.44 },
    { name: "2023-04-19", supply: 123.78, borrow: 86.34, utilization: 69.75, price: 44567.89, apy: 2.43 },
    { name: "2023-04-20", supply: 122.34, borrow: 85.23, utilization: 69.67, price: 44321.45, apy: 2.43 },
    { name: "2023-04-21", supply: 121.56, borrow: 84.67, utilization: 69.65, price: 44123.67, apy: 2.43 },
    { name: "2023-04-22", supply: 122.78, borrow: 85.43, utilization: 69.58, price: 44234.56, apy: 2.42 },
    { name: "2023-04-23", supply: 123.89, borrow: 86.21, utilization: 69.59, price: 44456.78, apy: 2.42 },
    { name: "2023-04-24", supply: 124.56, borrow: 86.98, utilization: 69.83, price: 44678.90, apy: 2.44 },
    { name: "2023-04-25", supply: 125.34, borrow: 87.65, utilization: 69.93, price: 44879.23, apy: 2.44 },
    { name: "2023-04-26", supply: 124.89, borrow: 87.32, utilization: 69.92, price: 44789.45, apy: 2.44 },
    { name: "2023-04-27", supply: 123.67, borrow: 86.54, utilization: 70.00, price: 44567.89, apy: 2.45 },
    { name: "2023-04-28", supply: 122.45, borrow: 85.76, utilization: 70.04, price: 44321.45, apy: 2.45 },
    { name: "2023-04-29", supply: 121.89, borrow: 85.21, utilization: 69.91, price: 44123.67, apy: 2.44 },
    { name: "2023-04-30", supply: 124.30, borrow: 89.75, utilization: 72.20, price: 45000.00, apy: 2.54 }
  ],
  
  "link:usdc:3000": [
    { name: "2023-04-01", supply: 196.34, borrow: 112.45, utilization: 57.27, price: 16.78, apy: 4.12 },
    { name: "2023-04-02", supply: 201.56, borrow: 115.67, utilization: 57.39, price: 16.95, apy: 4.13 },
    { name: "2023-04-03", supply: 207.89, borrow: 119.34, utilization: 57.41, price: 17.12, apy: 4.13 },
    { name: "2023-04-04", supply: 213.45, borrow: 123.56, utilization: 57.89, price: 17.34, apy: 4.16 },
    { name: "2023-04-05", supply: 212.67, borrow: 124.89, utilization: 58.72, price: 17.23, apy: 4.22 },
    { name: "2023-04-06", supply: 218.32, borrow: 127.56, utilization: 58.43, price: 17.89, apy: 4.20 },
    { name: "2023-04-30", supply: 214.59, borrow: 128.75, utilization: 60.00, price: 18.00, apy: 4.45 }
  ],
}

function generateFallbackHistoryData(
  days: number,
  baseSupply: number,
  baseBorrow: number,
  basePrice: number,
  baseApy: number,
): MarketHistory[] {
  const history: MarketHistory[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const variation = Math.random() * 0.2 - 0.1
    
    history.push({
      name: date.toISOString().split('T')[0],
      supply: baseSupply * (1 + variation),
      borrow: baseBorrow * (1 + variation),
      utilization: (baseBorrow / baseSupply) * 100,
      price: basePrice * (1 + variation),
      apy: baseApy * (1 + variation)
    })
  }
  
  return history
}

const getMarketHistory = (marketId: string): MarketHistory[] => {
  if (!marketHistory[marketId]) {
    const defaultValues = {
      "matic:usdc:3000": [756.24, 453.75, 1.5, 5.87],
      "usdt:usdc:3000": [850.00, 510.00, 1.0, 4.25],
      "dai:usdc:3000": [920.45, 552.27, 1.0, 3.85],
      "avax:usdc:3000": [345.67, 207.40, 35.5, 6.12],
      "sol:usdc:3000": [567.89, 340.73, 110.25, 5.95],
      "dot:usdc:3000": [234.56, 140.74, 7.85, 4.78],
      "uni:usdc:3000": [189.32, 113.59, 7.25, 5.34],
      "aave:usdc:3000": [156.78, 94.07, 95.50, 4.92],
      "atom:usdc:3000": [278.45, 167.07, 9.75, 5.15]
    }[marketId] || [500, 300, 10, 5]
    
    marketHistory[marketId] = generateFallbackHistoryData(
      30,
      defaultValues[0],
      defaultValues[1],
      defaultValues[2],
      defaultValues[3]
    )
  }
  
  return marketHistory[marketId]
}

export const getHistoryForMarket = (marketId: string): MarketHistory[] => {
  return marketHistory[marketId] || getMarketHistory(marketId)
}

export type PositionHistory = {
  name: string
  collateral: number
  borrowed: number
  healthFactor: number
}

export type PositionHistoryMap = {
  [marketId: string]: PositionHistory[]
}

export const positionHistory: PositionHistoryMap = {
  "eth:usdc:3000": [
    { name: "2023-04-01", collateral: 2.5, borrowed: 1500, healthFactor: 2.1 },
    { name: "2023-04-02", collateral: 2.5, borrowed: 1520, healthFactor: 2.05 },
    { name: "2023-04-03", collateral: 2.7, borrowed: 1520, healthFactor: 2.23 },
    { name: "2023-04-04", collateral: 2.7, borrowed: 1600, healthFactor: 2.11 },
    { name: "2023-04-05", collateral: 2.7, borrowed: 1650, healthFactor: 2.05 },
    { name: "2023-04-06", collateral: 3.0, borrowed: 1650, healthFactor: 2.28 },
    { name: "2023-04-07", collateral: 3.0, borrowed: 1700, healthFactor: 2.21 },
    { name: "2023-04-08", collateral: 3.0, borrowed: 1750, healthFactor: 2.14 },
    { name: "2023-04-09", collateral: 3.0, borrowed: 1800, healthFactor: 2.08 },
    { name: "2023-04-10", collateral: 3.2, borrowed: 1800, healthFactor: 2.22 },
    { name: "2023-04-11", collateral: 3.2, borrowed: 1850, healthFactor: 2.16 },
    { name: "2023-04-12", collateral: 3.2, borrowed: 1900, healthFactor: 2.10 },
    { name: "2023-04-13", collateral: 3.5, borrowed: 1900, healthFactor: 2.30 },
    { name: "2023-04-14", collateral: 3.5, borrowed: 1950, healthFactor: 2.24 },
    { name: "2023-04-15", collateral: 3.5, borrowed: 2000, healthFactor: 2.18 },
    { name: "2023-04-16", collateral: 3.5, borrowed: 2050, healthFactor: 2.13 },
    { name: "2023-04-17", collateral: 3.8, borrowed: 2050, healthFactor: 2.32 },
    { name: "2023-04-18", collateral: 3.8, borrowed: 2100, healthFactor: 2.26 },
    { name: "2023-04-19", collateral: 3.8, borrowed: 2150, healthFactor: 2.21 },
    { name: "2023-04-20", collateral: 4.0, borrowed: 2150, healthFactor: 2.32 },
    { name: "2023-04-21", collateral: 4.0, borrowed: 2200, healthFactor: 2.27 },
    { name: "2023-04-22", collateral: 4.0, borrowed: 2250, healthFactor: 2.22 },
    { name: "2023-04-23", collateral: 4.0, borrowed: 2300, healthFactor: 2.17 },
    { name: "2023-04-24", collateral: 4.2, borrowed: 2300, healthFactor: 2.28 },
    { name: "2023-04-25", collateral: 4.2, borrowed: 2350, healthFactor: 2.23 },
    { name: "2023-04-26", collateral: 4.2, borrowed: 2400, healthFactor: 2.18 },
    { name: "2023-04-27", collateral: 4.5, borrowed: 2400, healthFactor: 2.34 },
    { name: "2023-04-28", collateral: 4.5, borrowed: 2450, healthFactor: 2.29 },
    { name: "2023-04-29", collateral: 4.5, borrowed: 2500, healthFactor: 2.25 },
    { name: "2023-04-30", collateral: 4.5, borrowed: 2550, healthFactor: 2.20 }
  ],
}

function generateFallbackPositionHistory(
  days: number,
  baseCollateral: number,
  baseBorrowed: number,
  baseHealthFactor: number
): PositionHistory[] {
  const history: PositionHistory[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const variation = Math.random() * 0.1 - 0.05   
    
    const collateral = baseCollateral * (1 + variation * 0.5)
    const borrowed = baseBorrowed * (1 + variation)
    const healthFactor = baseHealthFactor * (1 - variation * 0.5)
    
    history.push({
      name: date.toISOString().split('T')[0],
      collateral,
      borrowed,
      healthFactor
    })
  }
  
  return history
}

export const getPositionHistoryForMarket = (marketId: string): PositionHistory[] => {
  if (!positionHistory[marketId]) {
    const defaultValues = {
      "matic:usdc:3000": [10, 5000, 2.5],
      "usdt:usdc:3000": [1000, 800, 1.8],
      "dai:usdc:3000": [1200, 900, 2.0],
      "avax:usdc:3000": [15, 400, 2.2],
      "sol:usdc:3000": [25, 1500, 1.9],
      "btc:usdc:3000": [0.15, 3000, 2.3],
      "link:usdc:3000": [100, 800, 2.1]
    }[marketId] || [5, 2000, 2.0]
    
    positionHistory[marketId] = generateFallbackPositionHistory(
      30,
      defaultValues[0],
      defaultValues[1],
      defaultValues[2]
    )
  }
  
  return positionHistory[marketId]
} 
export const getUserLoanHistory = (): PositionHistory[] => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const history: PositionHistory[] = []

  for (let i = 30; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    // Generate random variations around a base value
    const baseValue = 5000
    const variation = Math.random() * 0.15 - 0.075 // Random variation between -7.5% and +7.5%
    const value = baseValue * (1 + variation)
    
    history.push({
      name: date.toISOString().split('T')[0],
      collateral: 0,
      borrowed: value,
      healthFactor: 0
    })
  }

  return history
}
