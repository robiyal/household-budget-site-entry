export function transactionsPage(data, fmt) {
  const escapeHtml = (value) =>
    String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const formatRupiah = (amount) => {
    const n = Number(amount);
    if (!Number.isFinite(n)) return 'Rp 0';
    return 'Rp ' + new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(n);
  };

  const formatAmount = (amount) => {
    if (fmt && typeof fmt.formatRupiah === 'function') {
      try {
        const formatted = fmt.formatRupiah(amount);
        if (formatted != null && String(formatted).trim() !== '') {
          return String(formatted);
        }
      } catch (e) {
        // fall through to default formatter
      }
    }
    return formatRupiah(amount);
  };

  const transactions = Array.isArray(data?.transactions)
    ? data.transactions
    : Array.isArray(data)
      ? data
      : [];

  const defaultCategories = ['Belanja harian', 'Listrik & air', 'Transport', 'Sekolah anak', 'Lain-lain'];
  let categories = [];

  if (Array.isArray(data?.categories) && data.categories.length) {
    categories = data.categories.slice(0, 5);
  } else {
    const unique = [];
    for (const t of transactions) {
      const c = t?.category ?? t?.kategori;
      if (c && !unique.includes(c)) unique.push(c);
    }
    categories = unique.slice(0, 5);
    for (const c of defaultCategories) {
      if (categories.length >= 5) break;
      if (!categories.includes(c)) categories.push(c);
    }
    categories = categories.slice(0, 5);
  }

  const total = transactions.reduce((sum, t) => {
    const n = Number(t?.amount ?? t?.jumlah);
    return sum + (Number.isFinite(n) ? n : 0);
  }, 0);

  // Total dihitung dari data, bukan ditulis tetap — berubah saat transaksi ditambah.
  const totalText = formatAmount(total);

  const filterOptions = [
    `<option value="">Semua</option>`,
    ...categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
  ].join('');

  const categoryOptions = categories
    .map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
    .join('');

  const rows = transactions
    .map((t) => {
      const date = escapeHtml(t?.date ?? t?.tanggal ?? '');
      const name = escapeHtml(t?.name ?? t?.nama ?? '');
      const category = escapeHtml(t?.category ?? t?.kategori ?? '');
      const amount = escapeHtml(formatAmount(t?.amount ?? t?.jumlah ?? 0));
      return `<tr data-category="${category}"><td>${date}</td><td>${name}</td><td>${category}</td><td style="text-align:right">${amount}</td></tr>`;
    })
    .join('');

  return `
    <section class="transaksi-page">
      <h1>Transaksi</h1>
      <p>Semua pengeluaran keluarga di November 2026. Total diperbarui langsung setiap kali transaksi ditambahkan.</p>
      <div class="filter">
        <label for="filter-kategori">Filter kategori</label>
        <select id="filter-kategori" name="kategori">
          ${filterOptions}
        </select>
      </div>
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
            <td style="text-align:right">${escapeHtml(totalText)}</td>
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
