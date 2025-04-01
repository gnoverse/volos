export type MarketHistory = {
  name: string // Date as string for x-axis
  supply: number
  borrow: number
  utilization: number
  price: number
  apy: number
}

export type MarketHistoryMap = {
  [marketId: string]: MarketHistory[]
}
// AI generated mock history data
const generateHistoryData = (
  days: number,
  baseSupply: number,
  baseBorrow: number,
  basePrice: number,
  baseApy: number,
): MarketHistory[] => {
  const history: MarketHistory[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i) // Subtract days to go backwards from today
    
    // Extreme daily variations
    const dailyNoise = Math.random() * 0.6 - 0.3      // Random -30% to +30%
    const suddenSpike = Math.random() > 0.85          // 15% chance of spikes
      ? (Math.random() * 0.8 - 0.4)                  // -40% to +40% spike
      : 0
    const miniSpike = Math.random() > 0.7            // 30% chance of mini spikes
      ? (Math.random() * 0.3 - 0.15)                // -15% to +15% mini spike
      : 0
    const weeklyTrend = Math.sin(i / 7) * 0.25       // Weekly cycle ±25%
    const monthlyTrend = Math.sin(i / 30) * 0.35     // Monthly cycle ±35%
    
    const variation = dailyNoise + suddenSpike + miniSpike + weeklyTrend + monthlyTrend
    
    history.push({
      name: date.toISOString().split('T')[0], // Store as YYYY-MM-DD
      supply: baseSupply * (1 + variation),
      borrow: baseBorrow * (1 + variation * 1.6),     // 60% more volatile
      utilization: (baseBorrow / baseSupply) * 100 * (1 + variation * 0.8),
      price: basePrice * (1 + variation * 2.2),       // 120% more volatile
      apy: baseApy * (1 + variation)                  // Same volatility as base
    })
  }
  
  return history
}

export const marketHistory: MarketHistoryMap = {
  "eth:usdc:3000": generateHistoryData(
    30,
    475.17,
    181.75,
    2500,
    5.26
  ),
  "btc:usdc:3000": generateHistoryData(
    30,
    124.3,
    89.75,
    45000,
    2.54
  ),
  "link:usdc:3000": generateHistoryData(
    30,
    214.59,
    128.75,
    18,
    4.45
  ),
  "matic:usdc:3000": generateHistoryData(
    30,
    756.24,
    453.75,
    1.5,
    5.87
  ),
  "usdt:usdc:3000": generateHistoryData(
    30,
    850.00,
    510.00,
    1.0,
    4.25
  ),
  "dai:usdc:3000": generateHistoryData(
    30,
    920.45,
    552.27,
    1.0,
    3.85
  ),
  "avax:usdc:3000": generateHistoryData(
    30,
    345.67,
    207.40,
    35.5,
    6.12
  ),
  "sol:usdc:3000": generateHistoryData(
    30,
    567.89,
    340.73,
    110.25,
    5.95
  ),
  "dot:usdc:3000": generateHistoryData(
    30,
    234.56,
    140.74,
    7.85,
    4.78
  ),
  "uni:usdc:3000": generateHistoryData(
    30,
    189.32,
    113.59,
    7.25,
    5.34
  ),
  "aave:usdc:3000": generateHistoryData(
    30,
    156.78,
    94.07,
    95.50,
    4.92
  ),
  "atom:usdc:3000": generateHistoryData(
    30,
    278.45,
    167.07,
    9.75,
    5.15
  )
} 
