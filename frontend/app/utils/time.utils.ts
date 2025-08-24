/**
 * Returns a stable timestamp for the given period that doesn't change on every call.
 * This is useful for React Query keys to prevent unnecessary refetches.
 * @param period The time period ("15s", "30s", "1m", "2m", "1 week", "1 month", "3 months", "6 months", "all time")
 * @returns ISO string that remains stable for the duration of the period
 */
export function getStableTimePeriodStartDateISO(period: "15s" | "30s" | "1m" | "2m" | "1 week" | "1 month" | "3 months" | "6 months" | "all time"): string {
  const now = new Date()
  const nowTime = now.getTime()
  
  // Round down to the nearest hour to create stable timestamps
  const stableTime = Math.floor(nowTime / (60 * 60 * 1000)) * (60 * 60 * 1000)
  
  let startTime: number
  switch (period) {
    case "15s":
      startTime = stableTime - 15 * 1000
      break
    case "30s":
      startTime = stableTime - 30 * 1000
      break
    case "1m":
      startTime = stableTime - 60 * 1000
      break
    case "2m":
      startTime = stableTime - 2 * 60 * 1000
      break
    case "1 week":
      startTime = stableTime - 7 * 24 * 60 * 60 * 1000
      break
    case "1 month":
      startTime = stableTime - 30 * 24 * 60 * 60 * 1000
      break
    case "3 months":
      startTime = stableTime - 90 * 24 * 60 * 60 * 1000
      break
    case "6 months":
      startTime = stableTime - 180 * 24 * 60 * 60 * 1000
      break
    case "all time":
      startTime = 0
      break
    default:
      startTime = stableTime - 30 * 24 * 60 * 60 * 1000 // Default to 1 month
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

