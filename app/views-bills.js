const DEFAULT_BILLS = [
  { id: 'listrik', name: 'Listrik', amount: 420000, dueDay: 10, status: 'Belum lunas' },
  { id: 'air', name: 'Air', amount: 230000, dueDay: 12, status: 'Belum lunas' },
  { id: 'internet', name: 'Internet', amount: 350000, dueDay: 5, status: 'Belum lunas' },
  { id: 'iuran-rt', name: 'Iuran RT', amount: 150000, dueDay: 1, status: 'Belum lunas' },
  { id: 'sekolah-anak', name: 'Sekolah anak', amount: 750000, dueDay: 3, status: 'Belum lunas' }
];

const ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
};

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);
}

function defaultFormatAmount(amount) {
  const numericAmount = Number(amount);
  if (Number.isFinite(numericAmount)) {
    return `Rp ${numericAmount.toLocaleString('id-ID')}`;
  }
  return String(amount ?? '');
}

function formatAmountValue(amount, fmt, bill) {
  if (fmt && typeof fmt.formatRupiah === 'function') {
    const formatted = fmt.formatRupiah(amount);
    if (formatted !== undefined && formatted !== null && formatted !== '') {
      return formatted;
    }
  }
  return defaultFormatAmount(amount);
}

function resolveBills(data) {
  const providedBills = Array.isArray(data?.bills) ? data.bills : [];
  const providedById = new Map(
    providedBills.map((bill) => [String(bill?.id ?? bill?.name ?? ''), bill])
  );

  return DEFAULT_BILLS.map((defaultBill) => {
    const override =
      providedById.get(defaultBill.id) ||
      providedById.get(defaultBill.name) ||
      {};

    return {
      id: defaultBill.id,
      name: defaultBill.name,
      amount: override.amount ?? defaultBill.amount,
      dueDay: override.dueDay ?? override.dueDate ?? defaultBill.dueDay,
      status: override.status ?? defaultBill.status
    };
  });
}

export function billsPage(data, fmt) {
  const bills = resolveBills(data);
  const markPaidLabel = escapeHtml('Tandai lunas');
  const total = bills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  const unpaid = bills.filter((b) => String(b.status).trim().toLowerCase() !== 'lunas').length;

  const rows = bills.map((bill) => {
    const id = escapeHtml(bill.id);
    const name = escapeHtml(bill.name);
    const amountText = escapeHtml(formatAmountValue(bill.amount, fmt, bill));
    const dueText = escapeHtml(`Jatuh tempo tanggal ${bill.dueDay}`);
    const statusText = escapeHtml(bill.status);
    const isPaid = String(bill.status).trim().toLowerCase() === 'lunas';
    const statusClass = isPaid ? 'is-paid' : 'is-unpaid';
    const disabledAttribute = isPaid ? ' disabled' : '';

    return `<li class="bill-item" data-bill-id="${id}">
  <div class="bill-main">
    <strong class="bill-name">${name}</strong>
    <span class="bill-amount">${amountText}</span>
    <span class="bill-due">${dueText}</span>
    <span class="bill-status ${statusClass}">${statusText}</span>
  </div>
  <button type="button" class="mark-paid" data-bill-id="${id}"${disabledAttribute}>${markPaidLabel}</button>
</li>`;
  }).join('\n');

  return `<section class="bills-page">
  <h1>${escapeHtml('Tagihan')}</h1>
  <p class="bills-intro">${escapeHtml('Daftar tagihan rutin bulanan.')} Total ${escapeHtml(formatAmountValue(total, fmt))} &middot; ${unpaid} dari ${bills.length} belum lunas. Status lunas tersimpan di perangkat ini.</p>
  <ul class="bills-list">
${rows}
  </ul>
</section>`;
}
