import { MarketInfo } from "@/app/types";
import { formatLTV, formatTokenAmount, formatUtilization } from "@/app/utils/format.utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
interface MarketDashboardProps {
  market: MarketInfo;
  cardStyles: string;
}

export function MarketDashboard({ market, cardStyles }: MarketDashboardProps) {
  // mock data from utilization for risk level
  const utilizationPercent = Number(formatUtilization(market.utilization).replace('%', ''));
  const riskLevel = Math.min(utilizationPercent, 100);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
      {/* Market Overview Card */}
      <Card className={cardStyles}>
        <CardHeader className="pb-2">
          <CardTitle className="text-logo-600 flex items-center">
            <span>Market Overview</span>
          </CardTitle>
          <CardDescription className="text-gray-400">Basic information about the market</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 pt-2">
          {/* Loan Token */}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
              <span className="text-blue-400 font-bold">{market.loanTokenSymbol.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400">Loan Token</div>
              <div className="font-medium text-gray-200 flex items-center">
                {market.loanTokenName} 
                <span className="ml-1 text-gray-400 text-xs">({market.loanTokenSymbol})</span>
              </div>
            </div>
          </div>
          
          {/* Collateral Token */}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
              <span className="text-purple-400 font-bold">{market.collateralTokenSymbol.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-400">Collateral Token</div>
              <div className="font-medium text-gray-200 flex items-center">
                {market.collateralTokenName}
                <span className="ml-1 text-gray-400 text-xs">({market.collateralTokenSymbol})</span>
              </div>
            </div>
          </div>
          
          {/* Price */}
          <div className="mt-2 pt-2 border-t border-gray-700/50 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-400">Current Price</div>
              <span className="text-xs font-light text-gray-400">
                ({market.loanTokenSymbol} / {market.collateralTokenSymbol})
              </span>
            </div>
            <div className="flex items-baseline flex-wrap">
              <span className="text-3xl font-bold text-gray-200 break-all">
                {formatTokenAmount(market.currentPrice, 36, 2, 6)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Size Card */}
      <Card className={cardStyles}>
        <CardHeader className="pb-2">
          <CardTitle className="text-logo-600 flex items-center">
            <span>Market Size</span>
          </CardTitle>
          <CardDescription className="text-gray-400">Supply and borrow information</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 pt-2">
          {/* Total Supply */}
          <div>
            <div className="text-sm text-gray-400 mb-1">Total Supply</div>
            <div className="text-3xl font-bold text-gray-200">
              {formatTokenAmount(market.totalSupplyAssets, market.loanTokenDecimals)} <span className="text-gray-400 text-lg">{market.loanTokenSymbol}</span>
            </div>
          </div>
          
          {/* Total Borrow */}
          <div>
            <div className="text-sm text-gray-400 mb-1">Total Borrow</div>
            <div className="text-3xl font-bold text-gray-200">
              {formatTokenAmount(market.totalBorrowAssets, market.loanTokenDecimals)} <span className="text-gray-400 text-lg">{market.loanTokenSymbol}</span>
            </div>
          </div>
          
          {/* Utilization Visualization */}
          <div className="mt-2 pt-2 border-t border-gray-700/50">
            <div className="text-sm text-gray-400 mb-2">Utilization Rate</div>
            <div className="flex items-center gap-2">
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full" 
                  style={{ width: `${formatUtilization(market.utilization)}` }}
                ></div>
              </div>
              <span className="text-sm font-semibold text-gray-200 whitespace-nowrap">
                {formatUtilization(market.utilization)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameters Card */}
      <Card className={cardStyles}>
        <CardHeader className="pb-2">
          <CardTitle className="text-logo-600 flex items-center">
            <span>Parameters</span>
          </CardTitle>
          <CardDescription className="text-gray-400">Market parameters and rates</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 pt-2">
          {/* APR Rates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Supply Rate</div>
              <div className="text-3xl font-medium text-gray-200">
                {market.supplyAPR}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Borrow Rate</div>
              <div className="text-3xl font-medium text-gray-200">
                {market.borrowAPR}
              </div>
            </div>
          </div>
          
          {/* Risk Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-400 mb-1">Liq. LTV</div>
              <div className="text-3xl font-medium text-gray-200">
                {formatLTV(market.lltv, 18)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-400 mb-1">Market Fee</div>
              <div className="text-3xl font-medium text-gray-200">
                {/* {formatRate(market.fee, 18, true)} */}
                3.00%
              </div>
            </div>
          </div>
          
          {/* Health Factor Indicator */}
          <div className="mt-2 pt-2 border-t border-gray-700/50">
            <div className="text-sm text-gray-400 mb-1">Risk Level</div>
            <div className="flex items-center gap-2">
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="h-2 rounded-full" 
                  style={{ 
                    width: `${riskLevel}%`,
                    background: "linear-gradient(to right, #10b981, #f59e0b, #ef4444)"
                  }}
                ></div>
              </div>
              <span className="text-sm font-semibold text-gray-200 whitespace-nowrap">
                {riskLevel}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
