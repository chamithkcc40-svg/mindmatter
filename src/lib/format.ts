/** Formatting helpers shared across Mind Matter experiences. */

const numberFormatter = new Intl.NumberFormat('en-US');

/** 4879 -> "4,879" */
export function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value));
}

/** 57900000 -> "57.9 million km"; 1432000000 -> "1.43 billion km". */
export function formatKilometres(km: number): string {
  if (km >= 1_000_000_000) {
    return `${(km / 1_000_000_000).toFixed(2)} billion km`;
  }
  if (km >= 1_000_000) {
    const millions = km / 1_000_000;
    if (millions >= 100) return `${formatNumber(millions)} million km`;
    return `${millions.toFixed(1)} million km`;
  }
  return `${formatNumber(km)} km`;
}

/** Clamp a number to an inclusive range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
