// views-bills.js — halaman Tagihan: daftar tagihan rutin bulanan dengan
// jatuh tempo, jumlah, dan status. Menandai lunas tersimpan di perangkat
// ini (ditangani main.js). Badge jatuh tempo dihitung dari tanggal hari
// ini (due.js): terlambat / hari ini / berapa hari lagi.

import { dueBadge, dueSummary } from "./due.js";

const DEFAULT_BILLS = [
  { id: "listrik", name: "Listrik", amount: 420000, dueDay: 10, status: "Belum lunas" },
  { id: "air", name: "Air", amount: 230000, dueDay: 12, status: "Belum lunas" },
  { id: "internet", name: "Internet", amount: 350000, dueDay: 5, status: "Belum lunas" },
  { id: "iuran-rt", name: "Iuran RT", amount: 150000, dueDay: 1, status: "Belum lunas" },
  { id: "sekolah-anak", name: "Sekolah anak", amount: 750000, dueDay: 3, status: "Belum lunas" },
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

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function rupiahFallback(amount) {
  const numeric = asNumber(amount);
  if (Number.isFinite(numeric)) {
    return `Rp ${numeric.toLocaleString("id-ID")}`;
  }
  return String(amount ?? "");
}

function formatBillAmount(amount, fmt) {
  if (fmt && typeof fmt.formatRupiah === "function") {
    const formatted = fmt.formatRupiah(amount);
    if (formatted !== undefined && formatted !== null && formatted !== "") {
      return formatted;
    }
  }
  return rupiahFallback(amount);
}

function isPaidStatus(status) {
  return String(status).trim().toLowerCase() === "lunas";
}

// Gabungkan tagihan bawaan dengan data yang diberikan (berdasarkan id/nama).
function resolveBills(data) {
  const provided = Array.isArray(data && data.bills) ? data.bills : [];
  const byId = new Map(
    provided.map((bill) => [String(bill && (bill.id ?? bill.name ?? "")), bill])
  );
  return DEFAULT_BILLS.map((base) => {
    const override = byId.get(base.id) || byId.get(base.name) || {};
    return {
      id: base.id,
      name: base.name,
      amount: override.amount ?? base.amount,
      dueDay: override.dueDay ?? override.dueDate ?? base.dueDay,
      status: override.status ?? base.status,
    };
  });
}

function billItem(bill, fmt) {
  const id = esc(bill.id);
  const name = esc(bill.name);
  const amountText = esc(formatBillAmount(bill.amount, fmt));
  const dueText = esc(`Jatuh tempo tanggal ${bill.dueDay}`);
  const statusText = esc(bill.status);
  const paid = isPaidStatus(bill.status);
  const statusClass = paid ? "is-paid" : "is-unpaid";
  const disabled = paid ? " disabled" : "";
  // Tagihan lunas tidak perlu badge tanggal; yang belum lunas diberi tahu
  // terlambat berapa hari atau jatuh tempo kapan.
  const badge = paid ? "" : dueBadge(bill, new Date());
  const badgeHtml = badge
    ? ` <span class="due-badge due-tone-${esc(badge.tone)}">${esc(badge.text)}</span>`
    : "";
  return `<li class="bill-item" data-bill-id="${id}">
  <div class="bill-main">
    <strong class="bill-name">${name}</strong>
    <span class="bill-amount">${amountText}</span>
    <span class="bill-due">${dueText}</span>${badgeHtml}
    <span class="bill-status ${statusClass}">${statusText}</span>
  </div>
  <button type="button" class="mark-paid" data-bill-id="${id}"${disabled}>${esc("Tandai lunas")}</button>
</li>`;
}

export function billsPage(data, fmt) {
  const bills = resolveBills(data);
  const total = bills.reduce((sum, b) => sum + asNumber(b.amount), 0);
  const unpaid = bills.filter((b) => !isPaidStatus(b.status)).length;
  const summary = dueSummary(bills, new Date());
  const overdueNote = summary.overdue > 0
    ? ` ${summary.overdue} terlambat — bayar dulu yang paling lama.`
    : "";
  const rows = bills.map((bill) => billItem(bill, fmt)).join("\n");

  return `<section class="bills-page">
  <h1>${esc("Tagihan")}</h1>
  <p class="bills-intro">${esc("Daftar tagihan rutin bulanan.")} Total ${esc(formatBillAmount(total, fmt))} &middot; ${unpaid} dari ${bills.length} belum lunas.${esc(overdueNote)} Status lunas tersimpan di perangkat ini.</p>
  <ul class="bills-list">
${rows}
  </ul>
</section>`;
}
