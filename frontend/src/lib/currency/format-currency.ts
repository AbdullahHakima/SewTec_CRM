export function formatEgp(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0 ج.م";
  }
  return `${amount.toLocaleString("en-US")} ج.م`;
}

export function formatCompactEgp(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0 ج.م";
  }
  if (amount >= 1_000_000) {
    const millions = (amount / 1_000_000).toFixed(1).replace(/\.0$/, "");
    return `${millions}M ج.م`;
  }
  if (amount >= 1_000) {
    const thousands = (amount / 1_000).toFixed(0);
    return `${thousands}K ج.م`;
  }
  return `${amount.toLocaleString("en-US")} ج.م`;
}
