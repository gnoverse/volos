import { getAPRHistory, getTotalBorrowHistory, getTotalSupplyHistory, getUtilizationHistory } from "@/app/services/api.service";
import { MarketInfo } from "@/app/types";
import { formatApyVariation } from "@/app/utils/format.utils";
import { Chart } from "@/components/chart";
import { InfoCard } from "@/components/info-card";
import { useQuery } from '@tanstack/react-query';

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
  apyVariations, 
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

  // these may be undefined ? covers those cases
  const supplyHistory = netSupplyHistory?.map(item => ({
    ...item,
    value: item.value / Math.pow(10, market.loanTokenDecimals)
  }));
  const borrowHistory = netBorrowHistory?.map(item => ({
    ...item,
    value: item.value / Math.pow(10, market.loanTokenDecimals)
  }));
  const utilizationHistoryMapped = utilizationHistory?.map(item => ({
    ...item,
    value: item.value / 100
  }));
  const aprHistoryMapped = aprHistory?.map(item => ({
    value: item.value,
    timestamp: item.timestamp
  }));

  const noMarketInfo = !supplyHistory && !borrowHistory && !utilizationHistoryMapped && !aprHistoryMapped;

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

  return (
    <>
      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {supplyHistory && (
          <Chart
            data={supplyHistory}
            title="Total Supply"
            description="Total assets supplied to the market"
            dataKey="value"
            color="rgba(34, 197, 94, 0.95)"
            className={cardStyles}
          />
        )}
        {borrowHistory && (
          <Chart
            data={borrowHistory}
            title="Net Borrow"
            description="Net borrow (borrow - repay) over time"
            dataKey="value"
            color="rgba(239, 68, 68, 0.95)"
            className={cardStyles}
          />
        )}
        {utilizationHistoryMapped && (
          <Chart
            data={utilizationHistoryMapped}
            title="Utilization Rate"
            description="Percentage of supplied assets being borrowed"
            dataKey="value"
            color="rgba(99, 102, 241, 0.95)"
            className={cardStyles}
          />
        )}
        {aprHistoryMapped && (
          <Chart
            data={aprHistoryMapped}
            title="APR"
            description="Annual Percentage Rate"
            dataKey="value"
            color="rgba(245, 158, 11, 0.95)"
            className={cardStyles}
          />
        )}
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
