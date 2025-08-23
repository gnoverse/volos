import { useAPRHistoryQuery, useNetBorrowHistoryQuery, useNetSupplyHistoryQuery, useUtilizationHistoryQuery } from "@/app/(app)/borrow/queries-mutations";
import { MarketInfo } from "@/app/types";
import { getStableTimePeriodStartDateISO } from "@/app/utils/format.utils";
import { InfoCard } from "@/components/info-card";
import { useMemo, useState } from "react";
import { APRChart } from "./apr-chart";
import { TimePeriod } from "./chart-dropdown";
import { Chart } from "./universal-chart";

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
  const [supplyTimePeriod, setSupplyTimePeriod] = useState<TimePeriod>("1 month");
  const [borrowTimePeriod, setBorrowTimePeriod] = useState<TimePeriod>("1 month");
  const [utilizationTimePeriod, setUtilizationTimePeriod] = useState<TimePeriod>("1 month");
  const [aprTimePeriod, setAprTimePeriod] = useState<TimePeriod>("1 month");

  const supplyStartTime = useMemo(() => getStableTimePeriodStartDateISO(supplyTimePeriod), [supplyTimePeriod]);
  const borrowStartTime = useMemo(() => getStableTimePeriodStartDateISO(borrowTimePeriod), [borrowTimePeriod]);
  const utilizationStartTime = useMemo(() => getStableTimePeriodStartDateISO(utilizationTimePeriod), [utilizationTimePeriod]);
  const aprStartTime = useMemo(() => getStableTimePeriodStartDateISO(aprTimePeriod), [aprTimePeriod]);

  const { data: netSupplyHistory = [], isLoading: isSupplyLoading } = useNetSupplyHistoryQuery(market.marketId!, supplyStartTime);
  const { data: netBorrowHistory = [], isLoading: isBorrowLoading } = useNetBorrowHistoryQuery(market.marketId!, borrowStartTime);
  const { data: utilizationHistory = [], isLoading: isUtilizationLoading } = useUtilizationHistoryQuery(market.marketId!, utilizationStartTime);
  const { data: aprHistory = [], isLoading: isAprLoading } = useAPRHistoryQuery(market.marketId!, aprStartTime);

  if (isSupplyLoading || isBorrowLoading || isUtilizationLoading || isAprLoading) { //todo add a loading spinner
    return <div>Loading chart data...</div>;
  }

  const noMarketInfo = (!netSupplyHistory || netSupplyHistory.length === 0) && 
                      (!netBorrowHistory || netBorrowHistory.length === 0) && 
                      (!utilizationHistory || utilizationHistory.length === 0) && 
                      (!aprHistory || aprHistory.length === 0);

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
    setSupplyTimePeriod(period);
  }

  const onBorrowTimePeriodChangeAction = (period: TimePeriod) => {
    setBorrowTimePeriod(period);
  }

  const onUtilizationTimePeriodChangeAction = (period: TimePeriod) => {
    setUtilizationTimePeriod(period);
  }

  const onAprTimePeriodChangeAction = (period: TimePeriod) => {
    setAprTimePeriod(period);
  }

  return (
    <>
      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {netSupplyHistory && (
        <Chart
          data={netSupplyHistory}
          title="Total Supply"
          description="Total assets supplied to the market"
          color="rgba(34, 197, 94, 0.95)"
          className={cardStyles}
          onTimePeriodChangeAction={onSupplyTimePeriodChangeAction}
        />
        )}
        {netBorrowHistory && (
        <Chart
          data={netBorrowHistory}
          title="Net Borrow"
          description="Net borrow (borrow - repay) over time"
          color="rgba(239, 68, 68, 0.95)"
          className={cardStyles}
          onTimePeriodChangeAction={onBorrowTimePeriodChangeAction}
        />
        )}
        {utilizationHistory && (
        <Chart
          data={utilizationHistory}
          title="Utilization Rate"
          description="Percentage of supplied assets being borrowed"
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
