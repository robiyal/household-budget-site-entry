const CATEGORIES = [
  { key: 'harian', name: 'Belanja harian', budget: 2150000 },
  { key: 'listrik', name: 'Listrik & air', budget: 650000 },
  { key: 'transport', name: 'Transport', budget: 400000 },
  { key: 'sekolah', name: 'Sekolah anak', budget: 750000 },
  { key: 'lain', name: 'Lain-lain', budget: 1325000 }
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function defaultFormat(n) {
  try {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(n);
  } catch (e) {
    return 'Rp ' + Math.round(n).toLocaleString('id-ID');
  }
}

function toNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getBudget(data, cat) {
  if (data && data.budgets && typeof data.budgets === 'object') {
    if (data.budgets[cat.name] != null) return toNumber(data.budgets[cat.name], cat.budget);
    if (data.budgets[cat.key] != null) return toNumber(data.budgets[cat.key], cat.budget);
  }
  if (data && Array.isArray(data.categories)) {
    const found = data.categories.find(c => c && (c.name === cat.name || c.key === cat.key || c.id === cat.key));
    if (found && found.budget != null) return toNumber(found.budget, cat.budget);
  }
  return cat.budget;
}

// Realisasi = jumlah transaksi per kategori (dihitung dari data.transactions).
function getActual(data, cat) {
  if (!data || !Array.isArray(data.transactions)) return 0;
  let total = 0;
  for (const t of data.transactions) {
    if (t && t.category === cat.name) total += Number(t.amount) || 0;
  }
  return total;
}

export function budgetPage(data, fmt) {
  const format = fmt && typeof fmt.formatRupiah === "function" ? fmt.formatRupiah : defaultFormat;

  const rows = CATEGORIES.map(cat => {
    const budget = getBudget(data, cat);
    const actual = getActual(data, cat);
    const remaining = budget - actual;
    const pct = budget > 0 ? Math.min(100, Math.max(0, (actual / budget) * 100)) : 0;
    const over = remaining < 0;

    return `
      <tr data-budget-row="${escapeHtml(cat.key)}" data-actual="${actual}" data-budget-value="${budget}">
        <td>${escapeHtml(cat.name)}</td>
        <td data-budget>${escapeHtml(format(budget))}</td>
        <td data-actual>${escapeHtml(format(actual))}</td>
        <td data-remaining class="${over ? 'negative' : ''}">${escapeHtml(format(remaining))}</td>
        <td>
          <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}">
            <div class="progress-bar" data-bar style="width:${pct}%"></div>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const options = CATEGORIES.map(cat =>
    `<option value="${escapeHtml(cat.key)}">${escapeHtml(cat.name)}</option>`
  ).join('');

  return `
    <section class="budget-page">
      <h1>Anggaran</h1>
      <p>Anggaran bulanan per kategori dan realisasinya di November 2026.</p>
      <div class="table-wrap">
      <table class="budget-table">
        <thead>
          <tr>
            <th>Kategori</th>
            <th>Anggaran</th>
            <th>Realisasi</th>
            <th>Sisa</th>
            <th>Progres</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      </div>
      <form id="budget-form" class="budget-form" data-budget-form>
        <h2>Ubah anggaran</h2>
        <label>
          Kategori
          <select name="category" required>
            ${options}
          </select>
        </label>
        <label>
          Jumlah
          <input type="number" name="amount" min="0" step="1000" required>
        </label>
        <button type="submit">Simpan anggaran</button>
        <div id="budget-message" role="status" aria-live="polite"></div>
      </form>
    </section>
  `;
}
