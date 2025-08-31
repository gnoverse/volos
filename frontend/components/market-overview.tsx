import { MarketInfo } from "@/app/types";
import { InfoCard } from "@/components/info-card";
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

  return (
    <>
      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        {/* Utilization and APR Chart */}
        <UtilizationAPRChart
          marketId={market.marketId!}
          title="Utilization & APR"
          description="Compare utilization rate and APR trends"
          className={cardStyles}
        />
        {/* Supply and Borrow Chart */}
        <SupplyBorrowChart
          marketId={market.marketId!}
          title="Supply & Borrow"
          description="Compare total supply and borrow amounts over time"
          className={cardStyles}
          symbol={market.loanTokenSymbol}
        />
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
