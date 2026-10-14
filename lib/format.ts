const shekel = new Intl.NumberFormat("en-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

const shekelExact = new Intl.NumberFormat("en-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatILS(value: number): string {
  if (!Number.isFinite(value)) return shekel.format(0);
  return shekelExact.format(Math.round(value));
}

export function formatCompactILS(value: number): string {
  const amount = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const digits = millions >= 10 ? 0 : 1;
    return `${sign}₪${millions.toFixed(digits)}M`;
  }
  if (amount >= 1_000) {
    return `${sign}₪${Math.round(amount / 1_000)}k`;
  }
  return `${sign}₪${Math.round(amount)}`;
}

export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "0%";
  return `${value.toFixed(digits)}%`;
}

export function formatShare(value: number): string {
  return `${Math.round(value)}%`;
}
