import { useAPRHistoryQuery, useMarketSnapshotsQuery, useUtilizationHistoryQuery } from "@/app/(app)/borrow/queries-mutations"
import { getSnapshotResolution, getStableTimePeriodStartDateISO } from "@/app/utils/time.utils"
import { TimePeriod } from "@/components/chart-dropdown"
import { useMemo } from "react"

interface ChartMetrics {
  utilization: boolean
  supplyApr: boolean
  borrowApr: boolean
}

interface ChartDataPoint {
  timestamp: number
  utilization?: string
  supplyApr?: string
  borrowApr?: string
}

/**
 * Custom hook that fetches and transforms utilization & APR data for chart visualization.
 * 
 * This hook handles two data sources:
 * 1. **History data**: Used for "1 week" period - fetches raw transaction history
 * 2. **Snapshot data**: Used for all other periods - fetches pre-aggregated snapshots
 * 
 * The hook automatically:
 * - Calculates the appropriate time range based on the selected period
 * - Fetches data from the correct source (history vs snapshots)
 * - Transforms raw data into chart-ready format
 * - Filters data based on selected metrics (utilization/supply APR/borrow APR visibility)
 * - Provides loading states and data availability flags
 * 
 * @param marketId - The market identifier to fetch data for
 * @param selectedTimePeriod - The time period selected by the user
 * @param selectedMetrics - Which metrics (utilization/supply APR/borrow APR) should be displayed
 * @returns Object containing transformed data, loading state, and data availability
 */
export function useUtilizationAPRData(marketId: string, selectedTimePeriod: TimePeriod, selectedMetrics: ChartMetrics) {
  const startTime = useMemo(() => getStableTimePeriodStartDateISO(selectedTimePeriod), [selectedTimePeriod])

  const useHistory = selectedTimePeriod === "1 week"
  const useSnapshots = !useHistory

  const { data: utilizationHistoryData = [], isLoading: isUtilizationHistoryLoading } = useUtilizationHistoryQuery(
    marketId, 
    useHistory ? startTime : undefined, 
  )
  
  const { data: aprHistoryData = [], isLoading: isAprHistoryLoading } = useAPRHistoryQuery(
    marketId, 
    useHistory ? startTime : undefined, 
  )

  const { data: snapshotData = [], isLoading: isSnapshotLoading } = useMarketSnapshotsQuery(
    marketId,
    getSnapshotResolution(selectedTimePeriod),
    useSnapshots ? startTime : undefined,
  )

  const transformedData = useMemo((): ChartDataPoint[] => {
    if (useHistory) {
      const dataMap = new Map<number, ChartDataPoint>()

      utilizationHistoryData.forEach(item => {
        const timestamp = new Date(item.timestamp).getTime()
        if (!dataMap.has(timestamp)) {
          dataMap.set(timestamp, { timestamp })
        }
        dataMap.get(timestamp)!.utilization = item.value
      })

      aprHistoryData.forEach(item => {
        const timestamp = new Date(item.timestamp).getTime()
        if (!dataMap.has(timestamp)) {
          dataMap.set(timestamp, { timestamp })
        }
        dataMap.get(timestamp)!.supplyApr = item.supply_apr
        dataMap.get(timestamp)!.borrowApr = item.borrow_apr
      })

      return Array.from(dataMap.values())
        .filter(item => {
          if (selectedMetrics.utilization && item.utilization !== undefined) return true;
          if (selectedMetrics.supplyApr && item.supplyApr !== undefined) return true;
          if (selectedMetrics.borrowApr && item.borrowApr !== undefined) return true;
          return false;
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    } else {
      return snapshotData && snapshotData
        .map(snapshot => ({
          timestamp: new Date(snapshot.timestamp).getTime(),
          utilization: selectedMetrics.utilization ? snapshot.utilization_rate : undefined,
          supplyApr: selectedMetrics.supplyApr ? snapshot.supply_apr : undefined,
          borrowApr: selectedMetrics.borrowApr ? snapshot.borrow_apr : undefined,
        }))
        .filter(item => {
          if (selectedMetrics.utilization && item.utilization !== undefined) return true;
          if (selectedMetrics.supplyApr && item.supplyApr !== undefined) return true;
          if (selectedMetrics.borrowApr && item.borrowApr !== undefined) return true;
          return false;
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }
  }, [useHistory, utilizationHistoryData, aprHistoryData, snapshotData, selectedMetrics])

  const isLoading = useHistory 
    ? (isUtilizationHistoryLoading || isAprHistoryLoading)
    : isSnapshotLoading

  const hasData = useHistory
    ? ((utilizationHistoryData && utilizationHistoryData.length > 0) || (aprHistoryData && aprHistoryData.length > 0))
    : (snapshotData && snapshotData.length > 0)

  return {
    transformedData,
    isLoading,
    hasData,
  }
}
