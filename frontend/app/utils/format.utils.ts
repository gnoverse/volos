import { formatUnits } from "viem";

/**
 * Formats a number with decimals only when needed (2 decimal places for non-integers)
 * Example: 5 => "5", 5.2 => "5.20"
 */
export function formatNumber(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2);
}

/**
 * Formats a BigInt or string value to a localized string with custom decimals and fraction digits.
 */
export function formatTokenAmount(
  value: string | bigint,
  decimals: number = 18,
  minFractionDigits: number = 2,
  maxFractionDigits: number = 2
): string {
  const num = Number(formatUnits(BigInt(value), decimals));
  return num.toLocaleString(undefined, {
    minimumFractionDigits: minFractionDigits,
    maximumFractionDigits: maxFractionDigits,
  });
}

/**
 * Formats a rate (e.g., APY) as a percentage string with 2 decimals.
 */
export function formatRate(
  value: string | bigint,
  decimals: number = 18,
  multiplyBy100: boolean = false,
  fractionDigits: number = 2
): string {
  let num 
  if (multiplyBy100)
     num = Number(formatUnits(BigInt(value), decimals - 2));
  else
     num = Number(formatUnits(BigInt(value), decimals));
  return `${num.toFixed(fractionDigits)}%`;
}

/**
 * Formats a utilization value as a percentage string with 2 decimals.
 */
export function formatUtilization(
  value: string | bigint,
  decimals: number = 18,
  fractionDigits: number = 2
): string {
  const num = Number(formatUnits(BigInt(value), decimals)) * 100;
  return `${num.toFixed(fractionDigits)}%`;
}

/**
 * Formats a Loan-to-Value (LTV) ratio as a percentage string with 0 decimals.
 */
export function formatLTV(
  value: string | bigint,
  decimals: number = 18
): string {
  const num = Number(formatUnits(BigInt(value), decimals)) * 100;
  return `${num.toFixed(0)}%`;
}

/**
 * Formats a variable APY (e.g., 7D, 90D) given a base APR, a variation multiplier, and decimals.
 */
export function formatApyVariation(
  apr: string | bigint,
  variation: number,
  decimals: number = 18,
  fractionDigits: number = 2
): string {
  const base = Number(formatUnits(BigInt(apr), decimals));
  const apy = base * 100 * variation;
  return `${apy.toFixed(fractionDigits)}%`;
}

/**
 * Converts a WAD-scaled string (1e18 = 1.00) to a float with 2 decimals.
 * Example: "2500000000000000000" => "2.50"
 */
export function formatHealthFactor(wadString: string | undefined | null, decimals = 2): string {
  if (!wadString) return "0.00";
  const WAD = 1e18;
  const num = Number(wadString);
  if (isNaN(num)) return "0.00";
  return (num / WAD).toFixed(decimals);
}

/**
 * Formats a number as USD currency string with 2 decimal places.
 * Example: 1234.5678 => "$1,234.57"
 */
export function formatCurrency(value: string | number): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
}

/**
 * Converts a raw token amount string to a float value using the token's decimals.
 * Example: "1000000" with 6 decimals => 1.0
 */
export function parseTokenAmount(
  amount: string | undefined | null,
  decimals: number = 18
): number {
  if (!amount) return 0;
  try {
    return parseFloat(amount) / Math.pow(10, decimals);
  } catch (error) {
    console.error("Error parsing token amount:", error);
    return 0;
  }
}

/**
 * Formats a timestamp (milliseconds) to a readable date string.
 * Format: "01 Jan 2025, 20:00"
 * Returns "Not available" if timestamp is 0, null, or undefined.
 */
export function formatTimestamp(timestamp: number | null | undefined): string {
  if (!timestamp || timestamp === 0) {
    return "Not available";
  }
  
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ', ' + date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  } catch (error) {
    console.error("Error formatting timestamp:", error);
    return "Not available";
  }
}

/**
 * Formats a timestamp to a short date string in "dd MMM" format.
 * Example: "15 Jan", "22 Feb", "03 Mar"
 * @param timestamp The timestamp to format
 * @returns Formatted date string
 */
export function formatShortDate(timestamp: number | string | Date): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short' 
    });
  } catch (error) {
    console.error("Error formatting short date:", error);
    return "N/A";
  }
}

/**
 * Returns the appropriate Tailwind CSS classes for proposal status badges.
 * @param status The proposal status (active, executed, defeated, etc.)
 * @returns CSS classes for styling the status badge
 */
export function getProposalStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'passed':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'failed':
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
}

/**
 * Calculates the start date for a given time period relative to now.
 * @param period The time period ("1 week", "1 month", "3 months", "6 months", "all time")
 * @returns The start date for the specified period
 */
export function getTimePeriodStartDate(period: "1 week" | "1 month" | "3 months" | "6 months" | "all time"): Date {
  const now = new Date()
  const nowTime = now.getTime()
  
  switch (period) {
    case "1 week":
      return new Date(nowTime - 7 * 24 * 60 * 60 * 1000)
    case "1 month":
      return new Date(nowTime - 30 * 24 * 60 * 60 * 1000)
    case "3 months":
      return new Date(nowTime - 90 * 24 * 60 * 60 * 1000)
    case "6 months":
      return new Date(nowTime - 180 * 24 * 60 * 60 * 1000)
    case "all time":
      return new Date(0) // TODO: set time to contract deployment
    default:
      return new Date(nowTime - 30 * 24 * 60 * 60 * 1000) // Default to 1 month
  }
}

/**
 * Returns the exact ISO format required for Firestore queries.
 * Format: "2025-08-23T12:44:30Z"
 * @param period The time period ("1 week", "1 month", "3 months", "6 months", "all time")
 * @returns ISO string in the exact format required by Firestore
 */
export function getTimePeriodStartDateISO(period: "1 week" | "1 month" | "3 months" | "6 months" | "all time"): string {
  const date = getTimePeriodStartDate(period)
  return date.toISOString()
}

/**
 * Returns a stable timestamp for the given period that doesn't change on every call.
 * This is useful for React Query keys to prevent unnecessary refetches.
 * @param period The time period ("1 week", "1 month", "3 months", "6 months", "all time")
 * @returns ISO string that remains stable for the duration of the period
 */
export function getStableTimePeriodStartDateISO(period: "1 week" | "1 month" | "3 months" | "6 months" | "all time"): string {
  const now = new Date()
  const nowTime = now.getTime()
  
  // Round down to the nearest hour to create stable timestamps
  const stableTime = Math.floor(nowTime / (60 * 60 * 1000)) * (60 * 60 * 1000)
  
  let startTime: number
  switch (period) {
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



