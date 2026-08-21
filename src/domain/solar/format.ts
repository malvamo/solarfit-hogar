const numberFormatters = new Map<number, Intl.NumberFormat>();

function formatter(decimals: number) {
  const cached = numberFormatters.get(decimals);
  if (cached) return cached;
  const created = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  numberFormatters.set(decimals, created);
  return created;
}

export function formatNumber(value: number, decimals = 1) {
  return formatter(decimals).format(value);
}

export function formatKwh(value: number, decimals = 0) {
  return `${formatNumber(value, decimals)} kWh`;
}

export function formatPercent(value: number, decimals = 0) {
  return `${formatNumber(value, decimals)} %`;
}

export function formatSigned(value: number, decimals = 0) {
  return `${value >= 0 ? "+" : "−"}${formatNumber(Math.abs(value), decimals)}`;
}
