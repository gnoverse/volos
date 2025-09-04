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
 * Formats a plain number as a percentage string with fixed decimals.
 * Accepts number or numeric string. Example: 5.2 => "5.20%"
 */
export function formatPercentage(
  value: number | string,
  maxFractionDigits: number = 2
): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (Number.isNaN(num)) return `0%`;
  const formatted = num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
  return `${formatted}%`;
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
 * Returns the appropriate X-axis formatter function based on the selected time period.
 * Each period uses different formatting to match the data resolution and provide optimal readability.
 * 
 * @param period The time period ("1 week", "1 month", "3 months", "6 months", "all time")
 * @returns A function that formats timestamps for X-axis labels
 */
export function getXAxisFormatter(period: "1 week" | "1 month" | "3 months" | "6 months" | "all time") {
  switch (period) {
    case "1 week":
      return (timestamp: number | string | Date) => {
        const date = new Date(timestamp);
        const hour = date.getHours();
        if (hour === 0) {
          return formatShortDate(timestamp);
        } else if (hour === 12) {
          return "12:00";
        }
        return "";
      }
    case "1 month":
      return (timestamp: number | string | Date) => {
        const date = new Date(timestamp);
        return formatShortDate(timestamp) + ' ' + date.toLocaleTimeString('en-GB', {
          hour: '2-digit',
          hour12: false
        });
      }
    case "3 months":
    case "6 months":
      return formatShortDate;
    case "all time":
      return (timestamp: number | string | Date) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', { 
          month: 'short',
          year: '2-digit'
        });
      }
    default:
      return formatShortDate;
  }
}




