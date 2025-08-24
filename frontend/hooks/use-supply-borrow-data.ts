import { useMarketSnapshotsQuery, useNetBorrowHistoryQuery, useNetSupplyHistoryQuery } from "@/app/(app)/borrow/queries-mutations"
import { getSnapshotResolution, getStableTimePeriodStartDateISO } from "@/app/utils/time.utils"
import { TimePeriod } from "@/components/chart-dropdown"
import { useMemo } from "react"

interface ChartMetrics {
  supply: boolean
  borrow: boolean
}

interface ChartDataPoint {
  timestamp: number
  supply?: number
  borrow?: number
}

/**
 * Custom hook that fetches and transforms supply & borrow data for chart visualization.
 * 
 * This hook handles two data sources:
 * 1. **History data**: Used for "1 week" period - fetches raw transaction history
 * 2. **Snapshot data**: Used for all other periods - fetches pre-aggregated snapshots
 * 
 * The hook automatically:
 * - Calculates the appropriate time range based on the selected period
 * - Fetches data from the correct source (history vs snapshots)
 * - Transforms raw data into chart-ready format
 * - Filters data based on selected metrics (supply/borrow visibility)
 * - Provides loading states and data availability flags
 * 
 * @param marketId - The market identifier to fetch data for
 * @param selectedTimePeriod - The time period selected by the user
 * @param selectedMetrics - Which metrics (supply/borrow) should be displayed
 * @returns Object containing transformed data, loading state, and data availability
 */
export function useSupplyBorrowData(marketId: string, selectedTimePeriod: TimePeriod, selectedMetrics: ChartMetrics) {
  const startTime = useMemo(() => getStableTimePeriodStartDateISO(selectedTimePeriod), [selectedTimePeriod])

  const useHistory = selectedTimePeriod === "1 week"
  const useSnapshots = !useHistory

  const { data: supplyHistoryData = [], isLoading: isSupplyHistoryLoading } = useNetSupplyHistoryQuery(
    marketId, 
    useHistory ? startTime : undefined, 
  )
  
  const { data: borrowHistoryData = [], isLoading: isBorrowHistoryLoading } = useNetBorrowHistoryQuery(
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

      supplyHistoryData.forEach(item => {
        const timestamp = new Date(item.timestamp).getTime()
        if (!dataMap.has(timestamp)) {
          dataMap.set(timestamp, { timestamp })
        }
        dataMap.get(timestamp)!.supply = Number(item.value)
      })

      borrowHistoryData.forEach(item => {
        const timestamp = new Date(item.timestamp).getTime()
        if (!dataMap.has(timestamp)) {
          dataMap.set(timestamp, { timestamp })
        }
        dataMap.get(timestamp)!.borrow = Number(item.value)
      })

      return Array.from(dataMap.values())
        .filter(item => {
          if (selectedMetrics.supply && item.supply !== undefined) return true;
          if (selectedMetrics.borrow && item.borrow !== undefined) return true;
          return false;
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    } else {
      return snapshotData && snapshotData
        .map(snapshot => ({
          timestamp: new Date(snapshot.timestamp).getTime(),
          supply: selectedMetrics.supply ? Number(snapshot.total_supply) : undefined,
          borrow: selectedMetrics.borrow ? Number(snapshot.total_borrow) : undefined,
        }))
        .filter(item => {
          if (selectedMetrics.supply && item.supply !== undefined) return true;
          if (selectedMetrics.borrow && item.borrow !== undefined) return true;
          return false;
        })
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }
  }, [useHistory, supplyHistoryData, borrowHistoryData, snapshotData, selectedMetrics])

  const isLoading = useHistory 
    ? (isSupplyHistoryLoading || isBorrowHistoryLoading)
    : isSnapshotLoading

  const hasData = useHistory
    ? ((supplyHistoryData && supplyHistoryData.length > 0) || (borrowHistoryData && borrowHistoryData.length > 0))
    : (snapshotData && snapshotData.length > 0)

  return {
    transformedData,
    isLoading,
    hasData,
  }
}
