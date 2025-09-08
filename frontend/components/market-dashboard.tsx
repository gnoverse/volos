import { MarketInfo } from "@/app/types";
import { formatPercentage, formatTokenAmount, wadToPercentage } from "@/app/utils/format.utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
interface MarketDashboardProps {
  market: MarketInfo;
  cardStyles: string;
}

export function MarketDashboard({ market, cardStyles }: MarketDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Market Overview Card */}
      <Card className={cardStyles}>
        <CardHeader className="pb-1">
          <CardTitle className="text-logo-600 flex items-center">
            <span>Market Overview</span>
          </CardTitle>
          <CardDescription className="text-gray-400">Basic information about the market</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 pt-1">
          {/* Loan Token */}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
              <span className="text-blue-400 font-bold">{market.loanTokenSymbol.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-400">Loan Token</div>
              <div className="font-medium text-gray-200 flex items-center">
                {market.loanTokenName} 
                <span className="ml-1 text-gray-400 text-[10px]">({market.loanTokenSymbol})</span>
              </div>
            </div>
          </div>
          
          {/* Collateral Token */}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
              <span className="text-purple-400 font-bold">{market.collateralTokenSymbol.charAt(0)}</span>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-400">Collateral Token</div>
              <div className="font-medium text-gray-200 flex items-center">
                {market.collateralTokenName}
                <span className="ml-1 text-gray-400 text-[10px]">({market.collateralTokenSymbol})</span>
              </div>
            </div>
          </div>
          
          {/* Price */}
          <div className="mt-1 pt-1 border-t border-gray-700/50 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-400">Current Price</div>
              <span className="text-[10px] font-light text-gray-400">
                ({market.loanTokenSymbol} / {market.collateralTokenSymbol})
              </span>
            </div>
            <div className="flex items-baseline flex-wrap">
              <span className="text-2xl font-bold text-gray-200 break-all">
                {formatTokenAmount(market.currentPrice, 36, 2, 6)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Size Card */}
      <Card className={cardStyles}>
        <CardHeader className="pb-1">
          <CardTitle className="text-logo-600 flex items-center">
            <span>Market Size</span>
          </CardTitle>
          <CardDescription className="text-gray-400">Supply and borrow information</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 pt-1">
          {/* Total Supply */}
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Total Supply</div>
            <div className="text-2xl font-bold text-gray-200">
              {formatTokenAmount(market.totalSupplyAssets, market.loanTokenDecimals)} <span className="text-gray-400 text-base">{market.loanTokenSymbol}</span>
            </div>
          </div>
          
          {/* Total Borrow */}
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Total Borrow</div>
            <div className="text-2xl font-bold text-gray-200">
              {formatTokenAmount(market.totalBorrowAssets, market.loanTokenDecimals)} <span className="text-gray-400 text-base">{market.loanTokenSymbol}</span>
            </div>
          </div>
          
          {/* Utilization Visualization */}
          <div className="mt-1 pt-1 border-t border-gray-700/50">
            <div className="text-xs text-gray-400 mb-1">Utilization Rate</div>
            <div className="flex items-center gap-2">
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full" 
                  style={{ width: `${formatPercentage(wadToPercentage(market.utilization))}` }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-gray-200 whitespace-nowrap">
                {formatPercentage(wadToPercentage(market.utilization))}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parameters Card */}
      <Card className={cardStyles}>
        <CardHeader className="pb-1">
          <CardTitle className="text-logo-600 flex items-center">
            <span>Parameters</span>
          </CardTitle>
          <CardDescription className="text-gray-400">Market parameters and rates</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 pt-1">
          {/* APR Rates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Supply APR</div>
              <div className="text-2xl text-gray-200">
                {formatPercentage(wadToPercentage(market.supplyAPR, 2))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Borrow APR</div>
              <div className="text-2xl text-gray-200">
                {formatPercentage(wadToPercentage(market.borrowAPR, 2))}
              </div>
            </div>
          </div>
          
          {/* Risk Parameters */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Liq. LTV</div>
              <div className="text-2xl text-gray-200">
                {formatPercentage(wadToPercentage(market.lltv))}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">Market Fee</div>
              <div className="text-2xl text-gray-200">
                {formatPercentage(wadToPercentage(market.fee))}
              </div>
            </div>
          </div>
          
          {/* Health Factor Indicator */}
          <div className="mt-1 pt-1 border-t border-gray-700/50">
            <div className="text-xs text-gray-400 mb-0.5">Risk Level</div>
            <div className="flex items-center gap-2">
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div 
                  className="h-2 rounded-full" 
                  style={{ 
                    width: `${formatPercentage(wadToPercentage(market.utilization))}`, //TODO: use risk level
                    background: "linear-gradient(to right, #10b981, #f59e0b, #ef4444)"
                  }}
                ></div>
              </div>
              <span className="text-xs font-semibold text-gray-200 whitespace-nowrap">
                {formatPercentage(wadToPercentage(market.utilization))} {/* TODO: use risk level */}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
