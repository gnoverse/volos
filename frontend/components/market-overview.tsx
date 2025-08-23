import { useAPRHistoryQuery, useNetBorrowHistoryQuery, useNetSupplyHistoryQuery, useUtilizationHistoryQuery } from "@/app/(app)/borrow/queries-mutations";
import { MarketInfo } from "@/app/types";
import { getStableTimePeriodStartDateISO } from "@/app/utils/format.utils";
import { InfoCard } from "@/components/info-card";
import { useMemo, useState } from "react";
import { TimePeriod } from "./chart-dropdown";
import { SupplyBorrowChart } from "./supply-borrow-chart";
import { UtilizationAPRChart } from "./utilization-apr-chart";

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
  const [supplyBorrowTimePeriod, setSupplyBorrowTimePeriod] = useState<TimePeriod>("1 month");
  const [utilizationAprTimePeriod, setUtilizationAprTimePeriod] = useState<TimePeriod>("1 month");

  const supplyBorrowStartTime = useMemo(() => getStableTimePeriodStartDateISO(supplyBorrowTimePeriod), [supplyBorrowTimePeriod]);
  const utilizationAprStartTime = useMemo(() => getStableTimePeriodStartDateISO(utilizationAprTimePeriod), [utilizationAprTimePeriod]);

  const { data: netSupplyHistory = [], isLoading: isSupplyLoading } = useNetSupplyHistoryQuery(market.marketId!, supplyBorrowStartTime);
  const { data: netBorrowHistory = [], isLoading: isBorrowLoading } = useNetBorrowHistoryQuery(market.marketId!, supplyBorrowStartTime);
  const { data: utilizationHistory = [], isLoading: isUtilizationLoading } = useUtilizationHistoryQuery(market.marketId!, utilizationAprStartTime);
  const { data: aprHistory = [], isLoading: isAprLoading } = useAPRHistoryQuery(market.marketId!, utilizationAprStartTime);

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

  const onSupplyBorrowTimePeriodChangeAction = (period: TimePeriod) => {
    setSupplyBorrowTimePeriod(period);
  }

  const onUtilizationAprTimePeriodChangeAction = (period: TimePeriod) => {
    setUtilizationAprTimePeriod(period);
  }

  return (
    <>
      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Utilization and APR Chart */}
        {(utilizationHistory || aprHistory) && (
          <UtilizationAPRChart
            utilizationData={utilizationHistory}
            aprData={aprHistory}
            title="Utilization & APR"
            description="Compare utilization rate and APR trends"
            className={cardStyles}
            selectedTimePeriod={utilizationAprTimePeriod}
            onTimePeriodChangeAction={onUtilizationAprTimePeriodChangeAction}
          />
        )}
        {/* Supply and Borrow Chart */}
        {(netSupplyHistory || netBorrowHistory) && (
          <SupplyBorrowChart
            supplyData={netSupplyHistory}
            borrowData={netBorrowHistory}
            title="Supply & Borrow"
            description="Compare total supply and borrow amounts over time"
            className={cardStyles}
            selectedTimePeriod={supplyBorrowTimePeriod}
            onTimePeriodChangeAction={onSupplyBorrowTimePeriodChangeAction}
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
