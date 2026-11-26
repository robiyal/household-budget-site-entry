// format.js — helper format & hitung untuk Anggaran Keluarga Rahmawati.
// Semua fungsi aman untuk 0 dan nilai negatif.
const toFiniteNumber = (value) => {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : 0;
};

export function formatRupiah(n) {
  const value = toFiniteNumber(n);
  const rounded = Math.round(Math.abs(value));
  const sign = value < 0 && rounded !== 0 ? "-" : "";
  const digits = String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `Rp ${sign}${digits}`;
}

export function sumAmounts(items) {
  if (!Array.isArray(items)) return 0;

  return items.reduce((total, item) => {
    return total + toFiniteNumber(item && item.amount);
  }, 0);
}

export function categoryTotals(transactions) {
  const totals = new Map();

  if (!Array.isArray(transactions)) return {};

  for (const transaction of transactions) {
    if (transaction == null) continue;

    const category =
      transaction.category == null
        ? "Uncategorized"
        : String(transaction.category);
    const amount = toFiniteNumber(transaction.amount);

    totals.set(category, (totals.get(category) || 0) + amount);
  }

  return Object.fromEntries(totals);
}

export function savings(income, expenses) {
  return toFiniteNumber(income) - toFiniteNumber(expenses);
}
