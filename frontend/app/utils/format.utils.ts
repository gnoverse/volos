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
 * Formats a rate (e.g., APR) as a percentage string with 2 decimals.
 */
export function formatRate(
  value: string | bigint,
  decimals: number = 18,
  multiplyBy100: boolean = false,
  fractionDigits: number = 2
): string {
  let num = Number(formatUnits(BigInt(value), decimals));
  if (multiplyBy100) num *= 100;
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
 * Formats a variable APR (e.g., 7D, 90D) given a base APR, a variation multiplier, and decimals.
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

