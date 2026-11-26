// views-transactions.js — halaman Transaksi: daftar seluruh pengeluaran
// November 2026, filter kategori, urutan (terbaru / terlama / jumlah),
// total yang dihitung dari data, dan formulir tambah transaksi.

const ESCAPES = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const DEFAULT_CATEGORIES = [
  "Belanja harian",
  "Listrik & air",
  "Transport",
  "Sekolah anak",
  "Lain-lain",
];

const SORT_OPTIONS = [
  { value: "date-desc", label: "Tanggal: terbaru dulu" },
  { value: "date-asc", label: "Tanggal: terlama dulu" },
  { value: "amount-desc", label: "Jumlah: terbesar dulu" },
  { value: "amount-asc", label: "Jumlah: terkecil dulu" },
];

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function rupiahFallback(amount) {
  const n = asNumber(amount);
  return "Rp " + new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(n);
}

function pickAmountFormatter(fmt) {
  return (amount) => {
    if (fmt && typeof fmt.formatRupiah === "function") {
      try {
        const formatted = fmt.formatRupiah(amount);
        if (formatted != null && String(formatted).trim() !== "") {
          return String(formatted);
        }
      } catch (e) {
        // Jatuh ke pemformat baku di bawah.
      }
    }
    return rupiahFallback(amount);
  };
}

function collectTransactions(data) {
  if (Array.isArray(data && data.transactions)) return data.transactions;
  if (Array.isArray(data)) return data;
  return [];
}

function collectCategories(data, transactions) {
  if (Array.isArray(data && data.categories) && data.categories.length) {
    return data.categories.slice(0, 5);
  }
  const seen = [];
  for (const t of transactions) {
    const c = t && (t.category || t.kategori);
    if (c && !seen.includes(c)) seen.push(c);
  }
  for (const c of DEFAULT_CATEGORIES) {
    if (seen.length >= 5) break;
    if (!seen.includes(c)) seen.push(c);
  }
  return seen.slice(0, 5);
}

function sortTransactions(list, mode) {
  const sorted = [...list];
  if (mode === "date-asc") {
    sorted.sort((a, b) => String(a.date || a.tanggal || "").localeCompare(String(b.date || b.tanggal || "")));
  } else if (mode === "amount-desc") {
    sorted.sort((a, b) => asNumber(b.amount ?? b.jumlah) - asNumber(a.amount ?? a.jumlah));
  } else if (mode === "amount-asc") {
    sorted.sort((a, b) => asNumber(a.amount ?? a.jumlah) - asNumber(b.amount ?? b.jumlah));
  } else {
    sorted.sort((a, b) => String(b.date || b.tanggal || "").localeCompare(String(a.date || a.tanggal || "")));
  }
  return sorted;
}

export function transactionsPage(data, fmt) {
  const formatAmount = pickAmountFormatter(fmt);
  const transactions = collectTransactions(data);
  const categories = collectCategories(data, transactions);

  // Total dihitung dari data, bukan ditulis tetap — berubah saat transaksi ditambah.
  const total = transactions.reduce(
    (sum, t) => sum + asNumber(t && (t.amount ?? t.jumlah)),
    0
  );
  const totalText = formatAmount(total);

  const filterOptions = [
    `<option value="">Semua</option>`,
    ...categories.map(
      (c) => `<option value="${esc(c)}">${esc(c)}</option>`
    ),
  ].join("");

  const categoryOptions = categories
    .map((c) => `<option value="${esc(c)}">${esc(c)}</option>`)
    .join("");

  const sortOptions = SORT_OPTIONS.map(
    (o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`
  ).join("");

  const rows = sortTransactions(transactions, "date-desc")
    .map((t) => {
      const date = esc(t && (t.date ?? t.tanggal ?? ""));
      const name = esc(t && (t.name ?? t.nama ?? ""));
      const category = esc(t && (t.category ?? t.kategori ?? ""));
      const amount = esc(formatAmount(t && (t.amount ?? t.jumlah ?? 0)));
      const amountValue = asNumber(t && (t.amount ?? t.jumlah));
      return `<tr data-category="${category}" data-date="${date}" data-amount="${amountValue}"><td>${date}</td><td>${name}</td><td>${category}</td><td style="text-align:right">${amount}</td></tr>`;
    })
    .join("");

  return `
    <section class="transaksi-page">
      <h1>Transaksi</h1>
      <p>Semua pengeluaran keluarga di November 2026. Total diperbarui langsung setiap kali transaksi ditambahkan.</p>
      <div class="filter-row">
        <div class="filter">
          <label for="filter-kategori">Filter kategori</label>
          <select id="filter-kategori" name="kategori">
            ${filterOptions}
          </select>
        </div>
        <div class="filter">
          <label for="sort-transaksi">Urutkan</label>
          <select id="sort-transaksi" name="urutan">
            ${sortOptions}
          </select>
        </div>
      </div>
      <div class="export-row">
        <button type="button" id="export-json" class="btn btn-secondary">Unduh JSON</button>
        <button type="button" id="export-csv" class="btn btn-secondary">Unduh CSV</button>
        <label class="import-label" for="import-json">Impor JSON</label>
        <input type="file" id="import-json" accept="application/json,.json" />
        <span id="import-message" role="status" aria-live="polite"></span>
      </div>
      <p class="export-note">Unduhan berisi semua transaksi pada tabel ini. Impor menerima file JSON berisi daftar transaksi (tanggal, nama, kategori, jumlah); baris yang tidak valid dilewati dan dilaporkan.</p>
      <div class="table-wrap">
      <table class="transaksi-table">
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Nama</th>
            <th>Kategori</th>
            <th style="text-align:right">Jumlah</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3">Total</td>
            <td style="text-align:right">${esc(totalText)}</td>
          </tr>
        </tfoot>
      </table>
      </div>
      <form id="form-transaksi" class="transaksi-form">
        <h2>Tambah transaksi</h2>
        <div>
          <label for="tanggal">Tanggal</label>
          <input id="tanggal" name="tanggal" type="date" required />
        </div>
        <div>
          <label for="nama">Nama</label>
          <input id="nama" name="nama" type="text" required />
        </div>
        <div>
          <label for="kategori">Kategori</label>
          <select id="kategori" name="kategori" required>
            ${categoryOptions}
          </select>
        </div>
        <div>
          <label for="jumlah">Jumlah</label>
          <input id="jumlah" name="jumlah" type="number" min="0" step="1" required />
        </div>
        <button type="submit">Tambah transaksi</button>
        <div id="transaksi-message" role="status" aria-live="polite"></div>
      </form>
    </section>
  `;
}
