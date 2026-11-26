// main.js — router hash + state Anggaran Keluarga Rahmawati.
// State tersimpan di localStorage (kunci anggaran-keluarga-v1); bila storage
// kosong atau diblokir, situs tetap tampil dengan data default.

import { household, income, expenses, transactions, history, bills, goals } from "./data.js";
import { formatRupiah, sumAmounts, categoryTotals, savings } from "./format.js";
import { dashboard } from "./views-dashboard.js";
import { budgetPage } from "./views-budget.js";
import { transactionsPage } from "./views-transactions.js";
import { billsPage } from "./views-bills.js";
import { savingsPage } from "./views-savings.js";

const STORAGE_KEY = "anggaran-keluarga-v1";
const fmt = { formatRupiah, sumAmounts, categoryTotals, savings };

const BILL_ID_BY_NAME = {
  "Listrik": "listrik",
  "Air": "air",
  "Internet": "internet",
  "Iuran RT": "iuran-rt",
  "Sekolah anak": "sekolah-anak"
};

const CATEGORY_NAME_BY_KEY = {
  "harian": "Belanja harian",
  "listrik": "Listrik & air",
  "transport": "Transport",
  "sekolah": "Sekolah anak",
  "lain": "Lain-lain"
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
      status: paidBills.includes(id) ? "Lunas" : "Belum lunas"
    };
  });

  const stateGoals = goals.map((g) => {
    const key = g.name;
    const extra = Number(savingsAdded[key]) || 0;
    return { id: key, name: g.name, target: g.target, saved: g.saved + extra };
  });

  return {
    household,
    income,
    expenses: expenses.map((e) => ({
      category: e.category,
      amount: budgets[e.category] != null ? Number(budgets[e.category]) || 0 : e.amount
    })),
    transactions: [...transactions, ...added],
    history,
    bills: stateBills,
    goals: stateGoals,
    _saved: { addedTransactions: added, budgets, paidBills, savingsAdded }
  };
}

let state = buildState();
let pendingMessage = null; // { id: "transaksi-message" | ..., text: "..." }

function render(html) {
  window.__shotReady = false;
  const app = document.querySelector("#app");
  if (app) app.innerHTML = html;
  const hash = window.location.hash || "#/";
  document.querySelectorAll(".site-nav a").forEach((a) => {
    if (a.getAttribute("href") === hash) {
      a.setAttribute("aria-current", "page");
    } else {
      a.removeAttribute("aria-current");
    }
  });
  if (pendingMessage) {
    const el = document.getElementById(pendingMessage.id);
    if (el) {
      el.textContent = pendingMessage.text;
      el.className = "success";
    }
    pendingMessage = null;
  }
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
  "#/tabungan": () => savingsPage(state, fmt)
};

function router() {
  const hash = window.location.hash || "#/";
  if (hash === "#app") return; // tautan "lewati ke konten" — bukan rute.
  const view = routes[hash];
  render(view ? view() : notFound());
}

window.addEventListener("hashchange", router);

document.addEventListener("submit", (event) => {
  const form = event.target;

  if (form.id === "form-transaksi") {
    event.preventDefault();
    const date = form.elements["tanggal"].value || new Date().toISOString().slice(0, 10);
    const name = String(form.elements["nama"].value || "").trim();
    const category = form.elements["kategori"].value;
    const amount = Number(form.elements["jumlah"].value);
    const msg = document.getElementById("transaksi-message");
    if (!name || !Number.isFinite(amount) || amount <= 0) {
      if (msg) {
        msg.textContent = "Isi nama dan jumlah yang benar (jumlah harus lebih dari 0).";
        msg.className = "alert-error";
      }
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
    const msg = document.getElementById("budget-message");
    const categoryName = CATEGORY_NAME_BY_KEY[key];
    if (!categoryName || !Number.isFinite(amount) || amount < 0) {
      if (msg) {
        msg.textContent = "Pilih kategori dan isi jumlah anggaran yang benar.";
        msg.className = "alert-error";
      }
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
    const msg = document.getElementById("savings-message");
    if (!goalId || !Number.isFinite(amount) || amount <= 0) {
      if (msg) {
        msg.textContent = "Pilih tujuan dan isi jumlah dana yang benar (lebih dari 0).";
        msg.className = "alert-error";
      }
      return;
    }
    const current = Number(state._saved.savingsAdded[goalId]) || 0;
    state._saved.savingsAdded[goalId] = current + amount;
    writeSaved(state._saved);
    state = buildState();
    pendingMessage = { id: "savings-message", text: `Dana ${formatRupiah(amount)} berhasil ditambahkan ke ${goalId}.` };
    router();
  }
});

document.addEventListener("click", (event) => {
  const btn = event.target.closest(".mark-paid");
  if (!btn) return;
  const id = btn.getAttribute("data-bill-id");
  if (!id || state._saved.paidBills.includes(id)) return;
  state._saved.paidBills.push(id);
  writeSaved(state._saved);
  state = buildState();
  router();
});

document.addEventListener("change", (event) => {
  const select = event.target;
  if (!select || select.id !== "filter-kategori") return;
  const wanted = select.value;
  document.querySelectorAll(".transaksi-table tbody tr").forEach((row) => {
    const cat = row.getAttribute("data-category") || "";
    row.style.display = !wanted || cat === wanted ? "" : "none";
  });
});

router();
