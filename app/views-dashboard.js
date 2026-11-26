// views-dashboard.js — halaman Dashboard: ringkasan, grafik batang kategori,
// 5 transaksi terakhir, riwayat 6 bulan, dan tautan ke semua halaman.

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function dashboard(data, fmt) {
  const format = fmt && typeof fmt.formatRupiah === "function"
    ? fmt.formatRupiah
    : (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");

  const incomeTotal = data && data.income ? Number(data.income.total) || 0 : 0;
  const expenses = Array.isArray(data && data.expenses) ? data.expenses : [];
  const expenseTotal = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const savedTotal = incomeTotal - expenseTotal;
  const savedPct = incomeTotal > 0 ? Math.round((savedTotal / incomeTotal) * 100) : 0;
  const transactions = Array.isArray(data && data.transactions) ? data.transactions : [];
  const history = Array.isArray(data && data.history) ? data.history : [];
  const household = data && data.household ? data.household : {};
  const maxExpense = Math.max(1, ...expenses.map((e) => Number(e.amount) || 0));

  const recent = [...transactions]
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 5);

  const bars = expenses.map((e) => {
    const amount = Number(e.amount) || 0;
    const pct = Math.max(2, Math.round((amount / maxExpense) * 100));
    return `
      <div class="chart-col">
        <span class="chart-value">${escapeHtml(format(amount))}</span>
        <div class="chart-track">
          <div class="chart-bar" style="--bar-height:${pct}%"></div>
        </div>
        <span class="chart-label">${escapeHtml(e.category)}</span>
      </div>`;
  }).join("");

  const recentRows = recent.map((t) => `
      <tr>
        <td class="col-date">${escapeHtml(t.date)}</td>
        <td>${escapeHtml(t.name)}</td>
        <td>${escapeHtml(t.category)}</td>
        <td class="amount">${escapeHtml(format(t.amount))}</td>
      </tr>`).join("");

  const historyRows = history.map((h) => `
      <tr>
        <td>${escapeHtml(h.month)}</td>
        <td class="amount">${escapeHtml(format(h.income))}</td>
        <td class="amount">${escapeHtml(format(h.expenses))}</td>
        <td class="amount">${escapeHtml(format((Number(h.income) || 0) - (Number(h.expenses) || 0)))}</td>
      </tr>`).join("");

  return `
    <section class="dashboard-page">
      <div class="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>${escapeHtml(household.keluarga || "Keluarga")} &middot; ${escapeHtml(household.bulan || "")} &middot; ${escapeHtml(String(household.anggota || ""))} anggota keluarga</p>
        </div>
      </div>

      <div class="summary-grid">
        <article class="summary-card is-income">
          <span class="summary-label">Pemasukan</span>
          <span class="summary-value">${escapeHtml(format(incomeTotal))}</span>
          <span class="summary-note">per bulan</span>
        </article>
        <article class="summary-card is-expense">
          <span class="summary-label">Pengeluaran</span>
          <span class="summary-value">${escapeHtml(format(expenseTotal))}</span>
          <span class="summary-note">${expenseTotal > 0 ? Math.round((expenseTotal / incomeTotal) * 100) + "% dari pemasukan" : ""}</span>
        </article>
        <article class="summary-card is-balance">
          <span class="summary-label">Tabungan</span>
          <span class="summary-value">${escapeHtml(format(savedTotal))}</span>
          <span class="summary-note">sisa bulan ini &middot; ${savedPct}% dari pemasukan</span>
        </article>
      </div>

      <section class="card section">
        <div class="card-head"><h2>Pengeluaran per kategori</h2></div>
        <div class="chart">${bars}
        </div>
      </section>

      <section class="card section">
        <div class="card-head"><h2>Transaksi terbaru</h2><a href="#/transaksi">Lihat semua</a></div>
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr><th>Tanggal</th><th>Nama</th><th>Kategori</th><th class="amount">Jumlah</th></tr>
            </thead>
            <tbody>${recentRows}
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
            <tbody>${historyRows}
            </tbody>
          </table>
        </div>
      </section>

      <nav class="page-links" aria-label="Tautan cepat">
        <a href="#/anggaran">Anggaran</a>
        <a href="#/transaksi">Transaksi</a>
        <a href="#/tagihan">Tagihan</a>
        <a href="#/tabungan">Tabungan</a>
      </nav>
    </section>
  `;
}
