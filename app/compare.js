// compare.js — perbandingan bulan ini vs bulan lalu.
// Semua angka dihitung dari data.js (expenses + previousMonth); tidak ada
// angka yang ditulis tetap di sini, supaya perbandingan selalu konsisten
// dengan data bila pengguna mengubah anggaran atau menambah transaksi.

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function amountByCategory(list, category) {
  if (!Array.isArray(list)) return 0;
  for (const item of list) {
    if (item && item.category === category) return asNumber(item.amount);
  }
  return 0;
}

function sumList(list) {
  if (!Array.isArray(list)) return 0;
  let total = 0;
  for (const item of list) total += asNumber(item && item.amount);
  return total;
}

// Satu baris per kategori: nilai bulan ini, bulan lalu, selisih, persen.
// direction: "down" = pengeluaran turun (bagus), "up" = naik,
// "flat" = sama persis.
export function compareMonths(currentExpenses, previousExpenses, order) {
  const categories = Array.isArray(order) && order.length > 0
    ? order
    : [...new Set([
        ...(Array.isArray(currentExpenses) ? currentExpenses.map((e) => e && e.category) : []),
        ...(Array.isArray(previousExpenses) ? previousExpenses.map((e) => e && e.category) : []),
      ].filter(Boolean))];
  return categories.map((category) => {
    const current = amountByCategory(currentExpenses, category);
    const previous = amountByCategory(previousExpenses, category);
    const delta = current - previous;
    const pct = previous !== 0
      ? Math.round((delta / previous) * 1000) / 10
      : 0;
    const direction = delta < 0 ? "down" : delta > 0 ? "up" : "flat";
    return { category, current, previous, delta, pct, direction };
  });
}

// Ringkasan total: selisih pengeluaran dan selisih tabungan antar bulan.
// savings = income - expenses, dihitung dari angka yang diberikan.
export function totalsComparison(current, previous) {
  const currentTotal = sumList(current && current.expenses);
  const previousTotal = sumList(previous && previous.expenses);
  const currentIncome = asNumber(current && current.income);
  const previousIncome = asNumber(previous && previous.income);
  const currentSaved = currentIncome - currentTotal;
  const previousSaved = previousIncome - previousTotal;
  const expenseDelta = currentTotal - previousTotal;
  const savedDelta = currentSaved - previousSaved;
  return {
    currentTotal,
    previousTotal,
    expenseDelta,
    expensePct: previousTotal !== 0
      ? Math.round((expenseDelta / previousTotal) * 1000) / 10
      : 0,
    currentSaved,
    previousSaved,
    savedDelta,
    savedPct: previousSaved !== 0
      ? Math.round((savedDelta / previousSaved) * 1000) / 10
      : 0,
  };
}

// Format selisih Rupiah: "−Rp 30.000", "+Rp 10.000", atau "Rp 0".
// format adalah formatRupiah dari format.js (atau fallback apa pun yang
// mengembalikan string "Rp ..." untuk angka positif).
export function formatDelta(delta, format) {
  const value = asNumber(delta);
  if (value === 0) return "Rp 0";
  const text = typeof format === "function"
    ? format(Math.abs(value))
    : `Rp ${Math.round(Math.abs(value)).toLocaleString("id-ID")}`;
  return value < 0 ? `−${text}` : `+${text}`;
}

// Format persen satu desimal dengan koma Indonesia: "-1,4%", "+1,6%", "0%".
export function formatPct(pct) {
  const value = asNumber(pct);
  const rounded = Math.round(value * 10) / 10;
  const text = String(rounded).replace(".", ",");
  if (rounded > 0) return `+${text}%`;
  return `${text}%`;
}

// Kategori dengan penghematan terbesar (selisih paling negatif).
// Dipakai dashboard untuk satu kalimat sorotan di bawah tabel.
export function bestImprovement(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;
  let best = null;
  for (const row of rows) {
    if (!row) continue;
    if (!best || asNumber(row.delta) < asNumber(best.delta)) best = row;
  }
  return best && asNumber(best.delta) < 0 ? best : null;
}

// Kelas CSS untuk selisih: turun = hijau (hemat), naik = merah,
// sama = abu-abu. Untuk tabungan, maknanya dibalik oleh pemanggil
// (naik = bagus) lewat parameter goodWhenUp.
export function deltaClass(delta, goodWhenUp) {
  const value = asNumber(delta);
  if (value === 0) return "delta-flat";
  if (goodWhenUp) return value > 0 ? "delta-good" : "delta-bad";
  return value < 0 ? "delta-good" : "delta-bad";
}
