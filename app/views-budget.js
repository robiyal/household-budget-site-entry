// views-budget.js — halaman Anggaran: anggaran bulanan per kategori,
// realisasi yang dihitung dari transaksi, sisa, dan progres.
// Mengubah anggaran tersimpan di perangkat (ditangani main.js).

const BUDGET_CATEGORIES = [
  { key: "harian", name: "Belanja harian", budget: 2150000 },
  { key: "listrik", name: "Listrik & air", budget: 650000 },
  { key: "transport", name: "Transport", budget: 400000 },
  { key: "sekolah", name: "Sekolah anak", budget: 750000 },
  { key: "lain", name: "Lain-lain", budget: 1325000 },
];

const ESCAPE_TABLE = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ESCAPE_TABLE[ch]);
}

function asNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function rupiahFallback(n) {
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);
  } catch (e) {
    return "Rp " + Math.round(n).toLocaleString("id-ID");
  }
}

function pickFormatter(fmt) {
  if (fmt && typeof fmt.formatRupiah === "function") return fmt.formatRupiah;
  return rupiahFallback;
}

// Anggaran efektif: simpanan pengguna (berdasarkan nama atau kunci kategori)
// menang atas nilai baku; data.categories juga dihormati bila ada.
function resolveBudget(data, cat) {
  if (data && data.budgets && typeof data.budgets === "object") {
    if (data.budgets[cat.name] != null) return asNumber(data.budgets[cat.name], cat.budget);
    if (data.budgets[cat.key] != null) return asNumber(data.budgets[cat.key], cat.budget);
  }
  if (data && Array.isArray(data.categories)) {
    const found = data.categories.find(
      (c) => c && (c.name === cat.name || c.key === cat.key || c.id === cat.key)
    );
    if (found && found.budget != null) return asNumber(found.budget, cat.budget);
  }
  return cat.budget;
}

// Realisasi = total transaksi pada kategori ini.
function resolveActual(data, cat) {
  if (!data || !Array.isArray(data.transactions)) return 0;
  let total = 0;
  for (const t of data.transactions) {
    if (t && t.category === cat.name) total += asNumber(t.amount, 0);
  }
  return total;
}

function budgetRow(data, cat, format) {
  const budget = resolveBudget(data, cat);
  const actual = resolveActual(data, cat);
  const remaining = budget - actual;
  const pct = budget > 0
    ? Math.min(100, Math.max(0, (actual / budget) * 100))
    : 0;
  const overClass = remaining < 0 ? ' class="negative"' : "";
  return `
      <tr data-budget-row="${esc(cat.key)}" data-actual="${actual}" data-budget-value="${budget}">
        <td>${esc(cat.name)}</td>
        <td data-budget>${esc(format(budget))}</td>
        <td data-actual>${esc(format(actual))}</td>
        <td data-remaining${overClass}>${esc(format(remaining))}</td>
        <td>
          <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}">
            <div class="progress-bar" data-bar style="width:${pct}%"></div>
          </div>
        </td>
      </tr>`;
}

export function budgetPage(data, fmt) {
  const format = pickFormatter(fmt);
  const rows = BUDGET_CATEGORIES.map((cat) => budgetRow(data, cat, format)).join("");
  const options = BUDGET_CATEGORIES.map(
    (cat) => `<option value="${esc(cat.key)}">${esc(cat.name)}</option>`
  ).join("");

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
