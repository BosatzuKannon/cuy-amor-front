const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

export function formatCop(valueInCents: number): string {
  return copFormatter.format(valueInCents / 100);
}

export function formatCoins(coins: number): string {
  return coins.toLocaleString('es-CO');
}
