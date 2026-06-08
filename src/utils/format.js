
export function formatMoney(n) {
  return Number(n || 0).toFixed(2).replace('.', ',');
}
