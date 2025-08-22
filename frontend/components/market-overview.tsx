import { getAPRHistory, getTotalBorrowHistory, getTotalSupplyHistory, getUtilizationHistory } from "@/app/services/api.service";
import { MarketInfo } from "@/app/types";
import { InfoCard } from "@/components/info-card";
import { useQuery } from '@tanstack/react-query';
import { APRChart } from "./apr-chart";
import { TokenChart } from "./tokens-chart";
import { TimePeriod } from "./chart-dropdown";

interface MarketOverviewProps {
  market: MarketInfo;
  apyVariations: {
    sevenDay: number;
    ninetyDay: number;
  };
  cardStyles: string
}

export function MarketOverview({ 
  market, 
  cardStyles
}: MarketOverviewProps) {

  const { data: netSupplyHistory = [], isLoading: isSupplyLoading } = useQuery({
    queryKey: ['netSupplyHistory', market.poolPath],
    queryFn: () => getTotalSupplyHistory(market.poolPath!),
    enabled: !!market.poolPath
  });

  const { data: netBorrowHistory = [], isLoading: isBorrowLoading } = useQuery({
    queryKey: ['netBorrowHistory', market.poolPath],
    queryFn: () => getTotalBorrowHistory(market.poolPath!),
    enabled: !!market.poolPath
  });

  const { data: utilizationHistory = [], isLoading: isUtilizationLoading } = useQuery({
    queryKey: ['utilizationHistory', market.poolPath],
    queryFn: () => getUtilizationHistory(market.poolPath!),
    enabled: !!market.poolPath
  });

  const { data: aprHistory = [], isLoading: isAprLoading } = useQuery({
    queryKey: ['aprHistory', market.poolPath],
    queryFn: () => getAPRHistory(market.poolPath!),
    enabled: !!market.poolPath
  });

  if (isSupplyLoading || isBorrowLoading || isUtilizationLoading || isAprLoading) { //todo add a loading spinner
    return <div>Loading chart data...</div>;
  }

  const noMarketInfo = !netSupplyHistory && !netBorrowHistory && !utilizationHistory && !aprHistory;

  if (noMarketInfo) {
    return (
      <div className="min-h-[300px] flex flex-col items-center justify-center text-gray-400 p-8">
        <div className="text-2xl mb-4">No Market Info Available</div>
        <p className="text-center max-w-md">
          There is no historical data available for this market at the moment.
        </p>
      </div>
    );
  }

  const onSupplyTimePeriodChangeAction = (period: TimePeriod) => {
    console.log(period)
  }

  const onBorrowTimePeriodChangeAction = (period: TimePeriod) => {
    console.log(period)
  }

  const onUtilizationTimePeriodChangeAction = (period: TimePeriod) => {
    console.log(period)
  }

  const onAprTimePeriodChangeAction = (period: TimePeriod) => {
    console.log(period)
  }

  return (
    <>
      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {netSupplyHistory && (
        <TokenChart
          data={netSupplyHistory}
          title="Total Supply"
          description="Total assets supplied to the market"
          dataKey="total"
          color="rgba(34, 197, 94, 0.95)"
          className={cardStyles}
          onTimePeriodChangeAction={onSupplyTimePeriodChangeAction}
        />
        )}
        {netBorrowHistory && (
        <TokenChart
          data={netBorrowHistory}
          title="Net Borrow"
          description="Net borrow (borrow - repay) over time"
          dataKey="total"
          color="rgba(239, 68, 68, 0.95)"
          className={cardStyles}
          onTimePeriodChangeAction={onBorrowTimePeriodChangeAction}
        />
        )}
        {utilizationHistory && (
        <TokenChart
          data={utilizationHistory}
          title="Utilization Rate"
          description="Percentage of supplied assets being borrowed"
          dataKey="total"
          color="rgba(99, 102, 241, 0.95)"
          className={cardStyles}
          onTimePeriodChangeAction={onUtilizationTimePeriodChangeAction}
        />
        )}
        {aprHistory && (
        <APRChart
          data={aprHistory}
          title="APR"
          description="Annual Percentage Rate"
          className={cardStyles}
          onTimePeriodChangeAction={onAprTimePeriodChangeAction}
        />
        )}
      </div>

      {/* Performance Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <InfoCard
          title="7D APY"
          value={market.borrowAPR}
        />
        <InfoCard
          title="30D APY"
          value={market.borrowAPR}
        />
        <InfoCard
          title="90D APY"
          value={market.borrowAPR}
        />
      </div>
    </>
  )
} 
