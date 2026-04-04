export function formatNumber(value: number, digits = 2): string {
  return value.toFixed(digits);
}

export function formatOptionalNumber(value: number | null | undefined, digits = 2, fallback = '—'): string {
  return typeof value === 'number' ? formatNumber(value, digits) : fallback;
}