// main.js — router hash + state Anggaran Keluarga Rahmawati.
// State tersimpan di localStorage (kunci anggaran-keluarga-v1); bila storage
// kosong atau diblokir, situs tetap tampil dengan data default.

import { household, income, expenses, transactions, history, bills, goals, previousMonth } from "./data.js";
import { formatRupiah, sumAmounts, categoryTotals, savings } from "./format.js";
import { dashboard } from "./views-dashboard.js";
import { budgetPage } from "./views-budget.js";
import { transactionsPage } from "./views-transactions.js";
import { billsPage } from "./views-bills.js";
import { savingsPage } from "./views-savings.js";

const STORAGE_KEY = "anggaran-keluarga-v1";
const THEME_KEY = "anggaran-keluarga-tema";
const fmt = { formatRupiah, sumAmounts, categoryTotals, savings };

const BILL_ID_BY_NAME = {
  "Listrik": "listrik",
  "Air": "air",
  "Internet": "internet",
  "Iuran RT": "iuran-rt",
  "Sekolah anak": "sekolah-anak",
};

const CATEGORY_NAME_BY_KEY = {
  "harian": "Belanja harian",
  "listrik": "Listrik & air",
  "transport": "Transport",
  "sekolah": "Sekolah anak",
  "lain": "Lain-lain",
};

function readSaved() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}

function writeSaved(saved) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch (e) {
    // Storage penuh/diblokir: perubahan tetap tampil di sesi ini.
  }
}

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// Bangun state tampilan dari data default + simpanan pengguna.
function buildState() {
  const saved = readSaved();
  const added = Array.isArray(saved.addedTransactions) ? saved.addedTransactions : [];
  const budgets = saved.budgets && typeof saved.budgets === "object" ? saved.budgets : {};
  const paidBills = Array.isArray(saved.paidBills) ? saved.paidBills : [];
  const savingsAdded = saved.savingsAdded && typeof saved.savingsAdded === "object" ? saved.savingsAdded : {};

  const stateBills = bills.map((b) => {
    const id = BILL_ID_BY_NAME[b.name] || b.name;
    return {
      id,
      name: b.name,
      amount: b.amount,
      dueDay: b.dueDay,
      status: paidBills.includes(id) ? "Lunas" : "Belum lunas",
    };
  });

  const stateGoals = goals.map((g) => {
    const extra = asNumber(savingsAdded[g.name]);
    return { id: g.name, name: g.name, target: g.target, saved: g.saved + extra };
  });

  return {
    household,
    income,
    expenses: expenses.map((e) => ({
      category: e.category,
      amount: budgets[e.category] != null ? asNumber(budgets[e.category]) : e.amount,
    })),
    transactions: [...transactions, ...added],
    history,
    previousMonth,
    bills: stateBills,
    goals: stateGoals,
    _saved: { addedTransactions: added, budgets, paidBills, savingsAdded },
  };
}

let state = buildState();
let pendingMessage = null; // { id: "transaksi-message" | ..., text: "..." }

function markNavCurrent() {
  const hash = window.location.hash || "#/";
  document.querySelectorAll(".site-nav a").forEach((a) => {
    if (a.getAttribute("href") === hash) {
      a.setAttribute("aria-current", "page");
    } else {
      a.removeAttribute("aria-current");
    }
  });
}

function showPendingMessage() {
  if (!pendingMessage) return;
  const el = document.getElementById(pendingMessage.id);
  if (el) {
    el.textContent = pendingMessage.text;
    el.className = "success";
  }
  pendingMessage = null;
}

function render(html) {
  window.__shotReady = false;
  const app = document.querySelector("#app");
  if (app) app.innerHTML = html;
  markNavCurrent();
  showPendingMessage();
  window.__shotReady = true;
}

function notFound() {
  return `
    <section>
      <h1>Halaman tidak ditemukan</h1>
      <p>Halaman yang Anda cari tidak ada. Silakan kembali ke salah satu halaman berikut.</p>
      <nav class="page-links" aria-label="Tautan cepat">
        <a href="#/">Dashboard</a>
        <a href="#/anggaran">Anggaran</a>
        <a href="#/transaksi">Transaksi</a>
        <a href="#/tagihan">Tagihan</a>
        <a href="#/tabungan">Tabungan</a>
      </nav>
    </section>
  `;
}

const routes = {
  "#/": () => dashboard(state, fmt),
  "#/anggaran": () => budgetPage(state, fmt),
  "#/transaksi": () => transactionsPage(state, fmt),
  "#/tagihan": () => billsPage(state, fmt),
  "#/tabungan": () => savingsPage(state, fmt),
};

function router() {
  const hash = window.location.hash || "#/";
  if (hash === "#app") return; // Tautan "lewati ke konten" — bukan rute.
  const view = routes[hash];
  render(view ? view() : notFound());
}

window.addEventListener("hashchange", router);

function failMessage(id, text) {
  const msg = document.getElementById(id);
  if (msg) {
    msg.textContent = text;
    msg.className = "alert-error";
  }
}

document.addEventListener("submit", (event) => {
  const form = event.target;

  if (form.id === "form-transaksi") {
    event.preventDefault();
    const date = form.elements["tanggal"].value || new Date().toISOString().slice(0, 10);
    const name = String(form.elements["nama"].value || "").trim();
    const category = form.elements["kategori"].value;
    const amount = Number(form.elements["jumlah"].value);
    if (!name || !Number.isFinite(amount) || amount <= 0) {
      failMessage("transaksi-message", "Isi nama dan jumlah yang benar (jumlah harus lebih dari 0).");
      return;
    }
    state._saved.addedTransactions.push({ date, name, category, amount });
    writeSaved(state._saved);
    state = buildState();
    pendingMessage = { id: "transaksi-message", text: `Transaksi "${name}" sebesar ${formatRupiah(amount)} berhasil ditambahkan.` };
    router();
    return;
  }

  if (form.id === "budget-form") {
    event.preventDefault();
    const key = form.elements["category"].value;
    const amount = Number(form.elements["amount"].value);
    const categoryName = CATEGORY_NAME_BY_KEY[key];
    if (!categoryName || !Number.isFinite(amount) || amount < 0) {
      failMessage("budget-message", "Pilih kategori dan isi jumlah anggaran yang benar.");
      return;
    }
    state._saved.budgets[categoryName] = amount;
    writeSaved(state._saved);
    state = buildState();
    pendingMessage = { id: "budget-message", text: `Anggaran ${categoryName} diubah menjadi ${formatRupiah(amount)}.` };
    router();
    return;
  }

  if (form.id === "savings-form") {
    event.preventDefault();
    const goalId = form.elements["goalId"].value;
    const amount = Number(form.elements["amount"].value);
    if (!goalId || !Number.isFinite(amount) || amount <= 0) {
      failMessage("savings-message", "Pilih tujuan dan isi jumlah dana yang benar (lebih dari 0).");
      return;
    }
    const current = asNumber(state._saved.savingsAdded[goalId]);
    state._saved.savingsAdded[goalId] = current + amount;
    writeSaved(state._saved);
    state = buildState();
    pendingMessage = { id: "savings-message", text: `Dana ${formatRupiah(amount)} berhasil ditambahkan ke ${goalId}.` };
    router();
  }
});

document.addEventListener("click", (event) => {
  const themeBtn = event.target.closest("#theme-toggle");
  if (themeBtn) {
    toggleTheme();
    return;
  }
  const exportBtn = event.target.closest("#export-json, #export-csv");
  if (exportBtn) {
    downloadTransactions(exportBtn.id === "export-csv" ? "csv" : "json");
    return;
  }
  const btn = event.target.closest(".mark-paid");
  if (!btn) return;
  const id = btn.getAttribute("data-bill-id");
  if (!id || state._saved.paidBills.includes(id)) return;
  state._saved.paidBills.push(id);
  writeSaved(state._saved);
  state = buildState();
  router();
});

// Unduh transaksi sebagai JSON atau CSV (Blob lokal, tanpa jaringan).
// Nama berkas menyebut bulan data supaya tidak tertukar bila diunduh
// berulang kali.
function downloadTransactions(kind) {
  const rows = state.transactions;
  let text;
  let filename;
  let type;
  if (kind === "csv") {
    const head = "tanggal,nama,kategori,jumlah";
    const lines = rows.map((t) => {
      const name = String(t.name || "").replace(/"/g, '""');
      return `${t.date || ""},"${name}",${t.category || ""},${asNumber(t.amount)}`;
    });
    text = [head, ...lines].join("\n");
    filename = "transaksi-november-2026.csv";
    type = "text/csv";
  } else {
    text = JSON.stringify(rows, null, 2);
    filename = "transaksi-november-2026.json";
    type = "application/json";
  }
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  const msg = document.getElementById("import-message");
  if (msg) {
    msg.textContent = `Berkas ${filename} berhasil diunduh (${rows.length} transaksi).`;
    msg.className = "success";
  }
}

// Impor JSON: array transaksi {date, name, category, amount}.
// Baris tidak valid dilewati dan dilaporkan; yang valid ditambahkan
// sebagai transaksi baru dan tersimpan di perangkat.
function importTransactions(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let parsed;
    try {
      parsed = JSON.parse(String(reader.result || ""));
    } catch (e) {
      const msg = document.getElementById("import-message");
      if (msg) {
        msg.textContent = "Berkas bukan JSON yang valid.";
        msg.className = "alert-error";
      }
      return;
    }
    if (!Array.isArray(parsed)) {
      const msg = document.getElementById("import-message");
      if (msg) {
        msg.textContent = "Isi JSON harus berupa daftar transaksi.";
        msg.className = "alert-error";
      }
      return;
    }
    let added = 0;
    let skipped = 0;
    for (const item of parsed) {
      const date = String((item && (item.date || item.tanggal)) || "").trim();
      const name = String((item && (item.name || item.nama)) || "").trim();
      const category = String((item && (item.category || item.kategori)) || "").trim();
      const amount = Number(item && (item.amount ?? item.jumlah));
      if (!date || !name || !category || !Number.isFinite(amount) || amount <= 0) {
        skipped += 1;
        continue;
      }
      state._saved.addedTransactions.push({ date, name, category, amount });
      added += 1;
    }
    const text = `${added} transaksi diimpor.${skipped > 0 ? ` ${skipped} baris dilewati karena tidak valid.` : ""}`;
    if (added > 0) {
      writeSaved(state._saved);
      state = buildState();
      pendingMessage = { id: "import-message", text };
      router();
      return;
    }
    const msg = document.getElementById("import-message");
    if (msg) {
      msg.textContent = text;
      msg.className = "success";
    }
  };
  reader.onerror = () => {
    const msg = document.getElementById("import-message");
    if (msg) {
      msg.textContent = "Berkas tidak bisa dibaca.";
      msg.className = "alert-error";
    }
  };
  reader.readAsText(file);
}

// Urutkan baris tabel transaksi di tempat, tanpa memuat ulang halaman.
// Filter kategori tetap dihormati: baris yang tersembunyi tetap tersembunyi.
function sortTransactionRows(mode) {
  const tbody = document.querySelector(".transaksi-table tbody");
  if (!tbody) return;
  const rows = [...tbody.querySelectorAll("tr")];
  const byDate = (row) => row.getAttribute("data-date") || "";
  const byAmount = (row) => asNumber(row.getAttribute("data-amount"));
  if (mode === "date-asc") {
    rows.sort((a, b) => byDate(a).localeCompare(byDate(b)));
  } else if (mode === "amount-desc") {
    rows.sort((a, b) => byAmount(b) - byAmount(a));
  } else if (mode === "amount-asc") {
    rows.sort((a, b) => byAmount(a) - byAmount(b));
  } else {
    rows.sort((a, b) => byDate(b).localeCompare(byDate(a)));
  }
  for (const row of rows) tbody.appendChild(row);
}

function applyCategoryFilter(select) {
  const wanted = select.value;
  document.querySelectorAll(".transaksi-table tbody tr").forEach((row) => {
    const cat = row.getAttribute("data-category") || "";
    row.style.display = !wanted || cat === wanted ? "" : "none";
  });
}

document.addEventListener("change", (event) => {
  const select = event.target;
  if (!select) return;
  if (select.id === "import-json") {
    const file = select.files && select.files[0];
    if (file) importTransactions(file);
    select.value = "";
    return;
  }
  if (select.id === "filter-kategori") {
    applyCategoryFilter(select);
    return;
  }
  if (select.id === "sort-transaksi") {
    sortTransactionRows(select.value);
  }
});

// Mode gelap: tema tersimpan terpisah dari data anggaran (kunci sendiri);
// default terang. Diterapkan sebelum render pertama supaya tidak berkedip.
function currentTheme() {
  try {
    return window.localStorage.getItem(THEME_KEY) === "gelap" ? "gelap" : "terang";
  } catch (e) {
    return "terang";
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "gelap") root.setAttribute("data-theme", "dark");
  else root.removeAttribute("data-theme");
  const btn = document.getElementById("theme-toggle");
  if (btn) {
    btn.textContent = theme === "gelap" ? "Mode terang" : "Mode gelap";
    btn.setAttribute("aria-pressed", theme === "gelap" ? "true" : "false");
  }
}

function toggleTheme() {
  const next = currentTheme() === "gelap" ? "terang" : "gelap";
  try {
    window.localStorage.setItem(THEME_KEY, next);
  } catch (e) {
    // Storage diblokir: tema tetap berubah untuk sesi ini.
  }
  applyTheme(next);
}

applyTheme(currentTheme());

router();
