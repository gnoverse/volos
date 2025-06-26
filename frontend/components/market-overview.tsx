import { MarketHistory } from "@/app/(app)/borrow/mock-history";
import { useNetBorrowHistoryQuery, useNetSupplyHistoryQuery } from "@/app/(app)/borrow/queries-mutations";
import { MarketInfo } from "@/app/types";
import { formatApyVariation, parseTokenAmount } from "@/app/utils/format.utils";
import { InfoCard } from "@/components/info-card";
import { MarketChart } from "@/components/market-chart";

interface MarketOverviewProps {
  history: MarketHistory[];
  market: MarketInfo;
  apyVariations: {
    sevenDay: number;
    ninetyDay: number;
  };
  cardStyles: string;
}

export function MarketOverview({ history, market, apyVariations, cardStyles }: MarketOverviewProps) {
  const { data: netSupplyHistory, isLoading } = useNetSupplyHistoryQuery(market.poolPath); //poolPath will become marketId
  const { data: netBorrowHistory, isLoading: isNetBorrowLoading } = useNetBorrowHistoryQuery(market.poolPath);

  if (isLoading || isNetBorrowLoading) return <div>Loading...</div>;

  const supplyChartData = netSupplyHistory?.map(item => ({
    supply: parseTokenAmount(item.value.toString(), market.loanTokenDecimals),
    name: item.block_height,
  })) ?? [];

  const netBorrowChartData = netBorrowHistory?.map(item => ({
    netBorrow: parseTokenAmount(item.value.toString(), market.loanTokenDecimals),
    name: item.block_height,
  })) ?? [];

  return (
    <>
      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <MarketChart
          data={supplyChartData}
          title="Total Supply"
          description="Total assets supplied to the market"
          dataKey="supply"
          color="rgba(34, 197, 94, 0.95)"
          className={cardStyles}
        />
        <MarketChart
          data={netBorrowChartData as any[]}
          title="Net Borrow"
          description="Net borrow (borrow - repay) over time"
          dataKey="netBorrow"
          color="rgba(239, 68, 68, 0.95)"
          className={cardStyles}
        />
        <MarketChart
          data={history}
          title="Utilization Rate"
          description="Percentage of supplied assets being borrowed"
          dataKey="utilization"
          color="rgba(99, 102, 241, 0.95)"
          className={cardStyles}
        />
        <MarketChart
          data={history}
          title="APR"
          description="Annual Percentage Yield"
          dataKey="apy"
          color="rgba(245, 158, 11, 0.95)"
          className={cardStyles}
        />
      </div>

      {/* Performance Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <InfoCard
          title="7D APY"
          value={formatApyVariation(market.borrowAPR, apyVariations.sevenDay, 18, 2)}
        />
        <InfoCard
          title="30D APY"
          value={formatApyVariation(market.borrowAPR, 1, 18, 2)}
        />
        <InfoCard
          title="90D APY"
          value={formatApyVariation(market.borrowAPR, apyVariations.ninetyDay, 18, 2)}
        />
      </div>
    </>
  )
} 
