// views-dashboard.js — Dashboard Anggaran Keluarga Rahmawati.
// Menampilkan ringkasan pemasukan / pengeluaran / tabungan, grafik tren
// 6 bulan (SVG), perbandingan bulan ini vs bulan lalu, pengingat tagihan
// jatuh tempo, grafik batang per kategori, 5 transaksi terbaru, riwayat
// 6 bulan lengkap dengan baris rata-rata, serta tips hemat yang dihitung
// langsung dari data keluarga (bukan teks tempelan: semua angka berasal
// dari data.js).

import { CATEGORY_ORDER } from "./data.js";
import {
  compareMonths,
  totalsComparison,
  formatDelta,
  formatPct,
  deltaClass,
  bestImprovement,
} from "./compare.js";
import { trendChart, trendInsight } from "./views-trend.js";
import { urgentBills, dueBadge } from "./due.js";

const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function rupiahFallback(n) {
  return "Rp " + Math.round(asNumber(n)).toLocaleString("id-ID");
}

function pickFormatter(fmt) {
  if (fmt && typeof fmt.formatRupiah === "function") return fmt.formatRupiah;
  return rupiahFallback;
}

function sumField(items, field) {
  let total = 0;
  for (const item of items) total += asNumber(item && item[field]);
  return total;
}

function newestFirst(list) {
  return [...list].sort((a, b) =>
    String(b.date || "").localeCompare(String(a.date || "")));
}

function biggestCategory(expenses) {
  let top = null;
  for (const item of expenses) {
    if (!top || asNumber(item.amount) > asNumber(top.amount)) top = item;
  }
  return top;
}

function monthAverages(history) {
  const count = history.length || 1;
  const incomeAvg = Math.round(sumField(history, "income") / count);
  const expenseAvg = Math.round(sumField(history, "expenses") / count);
  return { incomeAvg, expenseAvg, savedAvg: incomeAvg - expenseAvg };
}

function cheapestMonth(history) {
  let best = null;
  for (const row of history) {
    if (!best || asNumber(row.expenses) < asNumber(best.expenses)) best = row;
  }
  return best;
}

function findGoal(goals, name) {
  if (!Array.isArray(goals)) return null;
  for (const goal of goals) {
    if (goal && goal.name === name) return goal;
  }
  return null;
}

function barChart(expenses, format) {
  const top = Math.max(1, ...expenses.map((e) => asNumber(e.amount)));
  return expenses
    .map((e) => {
      const amount = asNumber(e.amount);
      const height = Math.max(2, Math.round((amount / top) * 100));
      return `
      <div class="chart-col">
        <span class="chart-value">${esc(format(amount))}</span>
        <div class="chart-track">
          <div class="chart-bar" style="--bar-height:${height}%"></div>
        </div>
        <span class="chart-label">${esc(e.category)}</span>
      </div>`;
    })
    .join("");
}

function recentRows(transactions, format) {
  return newestFirst(transactions)
    .slice(0, 5)
    .map(
      (t) => `
      <tr>
        <td class="col-date">${esc(t.date)}</td>
        <td>${esc(t.name)}</td>
        <td>${esc(t.category)}</td>
        <td class="amount">${esc(format(t.amount))}</td>
      </tr>`
    )
    .join("");
}

function historyRows(history, format) {
  return history
    .map((h) => {
      const saved = asNumber(h.income) - asNumber(h.expenses);
      return `
      <tr>
        <td>${esc(h.month)}</td>
        <td class="amount">${esc(format(h.income))}</td>
        <td class="amount">${esc(format(h.expenses))}</td>
        <td class="amount">${esc(format(saved))}</td>
      </tr>`;
    })
    .join("");
}

function averageRow(history, format) {
  const avg = monthAverages(history);
  return `
      <tr class="average-row">
        <td>Rata-rata</td>
        <td class="amount">${esc(format(avg.incomeAvg))}</td>
        <td class="amount">${esc(format(avg.expenseAvg))}</td>
        <td class="amount">${esc(format(avg.savedAvg))}</td>
      </tr>`;
}

function savingTips(data, totals, format) {
  const tips = [];
  const top = biggestCategory(totals.expenses);
  if (top) {
    const share = totals.expenseTotal > 0
      ? Math.round((asNumber(top.amount) / totals.expenseTotal) * 100)
      : 0;
    const boost = totals.savedTotal > 0
      ? Math.round((100000 / totals.savedTotal) * 100)
      : 0;
    tips.push(
      `<strong>${esc(top.category)}</strong> adalah pos terbesar: ` +
      `${esc(format(top.amount))} (${share}% dari pengeluaran). ` +
      `Memangkas Rp 100.000 di sini menaikkan tabungan sekitar ${boost}%.`
    );
  }
  if (totals.history.length > 0) {
    const avg = monthAverages(totals.history);
    const best = cheapestMonth(totals.history);
    const gap = totals.expenseTotal - avg.expenseAvg;
    const direction = gap >= 0 ? "di atas" : "di bawah";
    tips.push(
      `Pengeluaran November ${esc(format(totals.expenseTotal))}, ` +
      `${esc(format(Math.abs(gap)))} ${direction} rata-rata 6 bulan ` +
      `(${esc(format(avg.expenseAvg))}). Bulan paling hemat: ` +
      `${esc(best.month)} (${esc(format(best.expenses))}).`
    );
  }
  const emergency = findGoal(data && data.goals, "Dana darurat");
  if (emergency) {
    const target = asNumber(emergency.target);
    const saved = asNumber(emergency.saved);
    const pct = target > 0 ? Math.round((saved / target) * 100) : 0;
    tips.push(
      `Tabungan bulan ini ${esc(format(totals.savedTotal))} ` +
      `(${totals.savedPct}% dari pemasukan). Dana darurat sudah ${pct}% ` +
      `dari target ${esc(format(target))} — sisa ` +
      `${esc(format(Math.max(target - saved, 0)))} lagi.`
    );
  }
  if (tips.length === 0) return "";
  const items = tips.map((tip) => `<li class="tip-item">${tip}</li>`).join("");
  return `
      <section class="card section tips-card">
        <div class="card-head"><h2>Tips hemat bulan ini</h2></div>
        <ul class="tips-list">${items}
        </ul>
      </section>`;
}

// Tabel perbandingan bulan ini vs bulan lalu, per kategori + total.
// Turun = hemat (hijau), naik = merah; tabungan dibalik (naik = hijau).
function comparisonTable(data, format) {
  const prev = data && data.previousMonth;
  if (!prev || !Array.isArray(prev.expenses)) return "";
  const expenses = Array.isArray(data.expenses) ? data.expenses : [];
  const rows = compareMonths(expenses, prev.expenses, CATEGORY_ORDER);
  const totals = totalsComparison(
    { expenses, income: asNumber(data.income && data.income.total) },
    { expenses: prev.expenses, income: asNumber(prev.income) }
  );
  const best = bestImprovement(rows);
  const body = rows
    .map(
      (row) => `
      <tr>
        <td>${esc(row.category)}</td>
        <td class="amount">${esc(format(row.current))}</td>
        <td class="amount">${esc(format(row.previous))}</td>
        <td class="amount ${deltaClass(row.delta, false)}">${esc(formatDelta(row.delta, format))}</td>
        <td class="amount ${deltaClass(row.delta, false)}">${esc(formatPct(row.pct))}</td>
      </tr>`
    )
    .join("");
  return `
      <section class="card section">
        <div class="card-head"><h2>Bulan ini vs ${esc(prev.month || "bulan lalu")}</h2></div>
        <div class="table-wrap">
          <table class="table compare-table">
            <thead>
              <tr><th>Kategori</th><th class="amount">Bulan ini</th><th class="amount">Bulan lalu</th><th class="amount">Selisih</th><th class="amount">%</th></tr>
            </thead>
            <tbody>${body}
            </tbody>
            <tfoot>
              <tr>
                <td>Total pengeluaran</td>
                <td class="amount">${esc(format(totals.currentTotal))}</td>
                <td class="amount">${esc(format(totals.previousTotal))}</td>
                <td class="amount ${deltaClass(totals.expenseDelta, false)}">${esc(formatDelta(totals.expenseDelta, format))}</td>
                <td class="amount ${deltaClass(totals.expenseDelta, false)}">${esc(formatPct(totals.expensePct))}</td>
              </tr>
              <tr>
                <td>Tabungan</td>
                <td class="amount">${esc(format(totals.currentSaved))}</td>
                <td class="amount">${esc(format(totals.previousSaved))}</td>
                <td class="amount ${deltaClass(totals.savedDelta, true)}">${esc(formatDelta(totals.savedDelta, format))}</td>
                <td class="amount ${deltaClass(totals.savedDelta, true)}">${esc(formatPct(totals.savedPct))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p class="compare-note">Pengeluaran ${totals.expenseDelta <= 0 ? "turun" : "naik"} ${esc(formatDelta(totals.expenseDelta, format))} (${esc(formatPct(totals.expensePct))}) dari ${esc(prev.month || "bulan lalu")}; tabungan ${totals.savedDelta >= 0 ? "naik" : "turun"} ${esc(formatDelta(totals.savedDelta, format))} (${esc(formatPct(totals.savedPct))}).${best ? ` Penghematan terbesar: <strong>${esc(best.category)}</strong> (${esc(formatDelta(best.delta, format))}).` : ""}</p>
      </section>`;
}

// Widget pengingat: 2 tagihan belum lunas paling mendesak
// (paling lama terlambat dulu, lalu jatuh tempo terdekat).
function remindersSection(data, format) {
  const bills = Array.isArray(data && data.bills) ? data.bills : [];
  const urgent = urgentBills(bills, new Date(), 2);
  if (urgent.length === 0) return "";
  const items = urgent
    .map(({ bill }) => {
      const badge = dueBadge(bill, new Date());
      return `
        <li class="reminder-item">
          <div class="reminder-main">
            <strong>${esc(bill.name)}</strong>
            <span class="reminder-amount">${esc(format(bill.amount))}</span>
          </div>
          <span class="due-badge due-tone-${esc(badge.tone)}">${esc(badge.text)}</span>
        </li>`;
    })
    .join("");
  return `
      <section class="card section reminder-card">
        <div class="card-head"><h2>Pengingat tagihan</h2><a href="#/tagihan">Lihat semua</a></div>
        <ul class="reminder-list">${items}
        </ul>
      </section>`;
}

// Wawasan satu kalimat dari tren 6 bulan.
function trendNote(history, format) {
  const insight = trendInsight(history);
  if (!insight) return "";
  const cheap = insight.cheapest;
  const rich = insight.richest;
  const cheapSaved = asNumber(cheap.income) - asNumber(cheap.expenses);
  const richSaved = asNumber(rich.income) - asNumber(rich.expenses);
  const same = cheap.month === rich.month;
  return `
        <p class="trend-insight">Bulan paling hemat: <strong>${esc(cheap.month)}</strong> (${esc(format(cheap.expenses))}).${same ? ` Tabungan tertinggi juga di bulan itu (${esc(format(cheapSaved))}).` : ` Tabungan tertinggi: <strong>${esc(rich.month)}</strong> (${esc(format(richSaved))}).`}</p>`;
}

export function dashboard(data, fmt) {
  const format = pickFormatter(fmt);
  const safe = data || {};
  const incomeTotal = asNumber(safe.income && safe.income.total);
  const expenses = Array.isArray(safe.expenses) ? safe.expenses : [];
  const expenseTotal = sumField(expenses, "amount");
  const savedTotal = incomeTotal - expenseTotal;
  const savedPct = incomeTotal > 0 ? Math.round((savedTotal / incomeTotal) * 100) : 0;
  const transactions = Array.isArray(safe.transactions) ? safe.transactions : [];
  const history = Array.isArray(safe.history) ? safe.history : [];
  const family = safe.household || {};
  const totals = { expenses, expenseTotal, savedTotal, savedPct, history };

  return `
    <section class="dashboard-page">
      <div class="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>${esc(family.keluarga || "Keluarga")} &middot; ${esc(family.bulan || "")} &middot; ${esc(String(family.anggota || ""))} anggota keluarga</p>
        </div>
      </div>

      <div class="summary-grid">
        <article class="summary-card is-income">
          <span class="summary-label">Pemasukan</span>
          <span class="summary-value">${esc(format(incomeTotal))}</span>
          <span class="summary-note">per bulan</span>
        </article>
        <article class="summary-card is-expense">
          <span class="summary-label">Pengeluaran</span>
          <span class="summary-value">${esc(format(expenseTotal))}</span>
          <span class="summary-note">${expenseTotal > 0 && incomeTotal > 0 ? Math.round((expenseTotal / incomeTotal) * 100) + "% dari pemasukan" : ""}</span>
        </article>
        <article class="summary-card is-balance">
          <span class="summary-label">Tabungan</span>
          <span class="summary-value">${esc(format(savedTotal))}</span>
          <span class="summary-note">sisa bulan ini &middot; ${savedPct}% dari pemasukan</span>
        </article>
      </div>

      <section class="card section">
        <div class="card-head"><h2>Tren 6 bulan</h2></div>
        ${trendChart(history, format)}
        ${trendNote(history, format)}
      </section>

      ${comparisonTable(safe, format)}

      ${remindersSection(safe, format)}

      <section class="card section">
        <div class="card-head"><h2>Pengeluaran per kategori</h2></div>
        <div class="chart">${barChart(expenses, format)}
        </div>
      </section>

      <section class="card section">
        <div class="card-head"><h2>Transaksi terbaru</h2><a href="#/transaksi">Lihat semua</a></div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr><th>Tanggal</th><th>Nama</th><th>Kategori</th><th class="amount">Jumlah</th></tr>
            </thead>
            <tbody>${recentRows(transactions, format)}
            </tbody>
          </table>
        </div>
      </section>

      <section class="card section">
        <div class="card-head"><h2>Riwayat 6 bulan</h2></div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr><th>Bulan</th><th class="amount">Pemasukan</th><th class="amount">Pengeluaran</th><th class="amount">Tabungan</th></tr>
            </thead>
            <tbody>${historyRows(history, format)}
            </tbody>
            <tfoot>${averageRow(history, format)}
            </tfoot>
          </table>
        </div>
      </section>
${savingTips(safe, totals, format)}
      <nav class="page-links" aria-label="Tautan cepat">
        <a href="#/anggaran">Anggaran</a>
        <a href="#/transaksi">Transaksi</a>
        <a href="#/tagihan">Tagihan</a>
        <a href="#/tabungan">Tabungan</a>
      </nav>
    </section>
  `;
}
