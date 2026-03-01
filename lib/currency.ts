/**
 * Currency formatting utilities for Tiny Tales
 * Standardized to "RS" prefix
 */

/**
 * Format an amount exactly as "RS 1,200.00"
 */
export function formatRs(amount: number): string {
    return `RS ${new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)}`
}

/**
 * Compact display format: "RS 1,200" (no decimals for display cards)
 */
export function formatRsCompact(amount: number): string {
    return `RS ${new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount)}`
}
