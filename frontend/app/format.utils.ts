import { formatUnits } from "viem";

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
  const num = Number(formatUnits(BigInt(value), decimals));
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