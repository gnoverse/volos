/**
 * Returns a stable timestamp for the given period that doesn't change on every call.
 * This is useful for React Query keys to prevent unnecessary refetches.
 * @param period The time period ("15s", "30s", "1m", "2m", "1 week", "1 month", "3 months", "6 months", "all time")
 * @returns ISO string that remains stable for the duration of the period
 */
export function getStableTimePeriodStartDateISO(period: "15s" | "30s" | "1m" | "2m" | "1 week" | "1 month" | "3 months" | "6 months" | "all time"): string {
  const now = new Date()
  const nowTime = now.getTime()
  
  let startTime: number
  switch (period) {
    case "15s":
      // Round down to nearest 15 seconds for stability
      const stableTime15s = Math.floor(nowTime / (15 * 1000)) * (15 * 1000)
      startTime = stableTime15s - 15 * 1000
      break
    case "30s":
      // Round down to nearest 30 seconds for stability
      const stableTime30s = Math.floor(nowTime / (30 * 1000)) * (30 * 1000)
      startTime = stableTime30s - 30 * 1000
      break
    case "1m":
      // Round down to nearest minute for stability
      const stableTime1m = Math.floor(nowTime / (60 * 1000)) * (60 * 1000)
      startTime = stableTime1m - 60 * 1000
      break
    case "2m":
      // Round down to nearest 2 minutes for stability
      const stableTime2m = Math.floor(nowTime / (2 * 60 * 1000)) * (2 * 60 * 1000)
      startTime = stableTime2m - 2 * 60 * 1000
      break
    case "1 week":
      // Round down to nearest hour for stability
      const stableTime1w = Math.floor(nowTime / (60 * 60 * 1000)) * (60 * 60 * 1000)
      startTime = stableTime1w - 7 * 24 * 60 * 60 * 1000
      break
    case "1 month":
      // Round down to nearest hour for stability
      const stableTime1mo = Math.floor(nowTime / (60 * 60 * 1000)) * (60 * 60 * 1000)
      startTime = stableTime1mo - 30 * 24 * 60 * 60 * 1000
      break
    case "3 months":
      // Round down to nearest hour for stability
      const stableTime3mo = Math.floor(nowTime / (60 * 60 * 1000)) * (60 * 60 * 1000)
      startTime = stableTime3mo - 90 * 24 * 60 * 60 * 1000
      break
    case "6 months":
      // Round down to nearest hour for stability
      const stableTime6mo = Math.floor(nowTime / (60 * 60 * 1000)) * (60 * 60 * 1000)
      startTime = stableTime6mo - 180 * 24 * 60 * 60 * 1000
      break
    case "all time":
      startTime = 0
      break
    default:
      // Round down to nearest hour for stability
      const stableTimeDefault = Math.floor(nowTime / (60 * 60 * 1000)) * (60 * 60 * 1000)
      startTime = stableTimeDefault - 30 * 24 * 60 * 60 * 1000 // Default to 1 month
  }
  
  return new Date(startTime).toISOString()
}

/**
 * Returns the appropriate snapshot resolution based on the selected time period.
 * @param period The time period ("15s", "30s", "1m", "2m", "1 week", "1 month", "3 months", "6 months", "all time")
 * @returns The snapshot resolution ('15s', '30s', '60s', '120s', '4hour', 'daily', or 'weekly')
 */
export function getSnapshotResolution(period: "15s" | "30s" | "1m" | "2m" | "1 week" | "1 month" | "3 months" | "6 months" | "all time"): '15s' | '30s' | '60s' | '120s' | '4hour' | 'daily' | 'weekly' {
  switch (period) {
    case "15s":
      return '15s'
    case "30s":
      return '30s'
    case "1m":
      return '60s'
    case "2m":
      return '120s'
    case "1 month":
      return '4hour'
    case "3 months":
    case "6 months":
      return 'daily'
    case "all time":
      return 'weekly'
    default:
      return 'daily'
  }
}

