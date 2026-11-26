// views-trend.js — grafik tren 6 bulan (SVG murni, tanpa library).
// Dua garis: Pengeluaran (amber) dan Tabungan (hijau), dari history di
// data.js. Semua titik dihitung dari data; tidak ada angka yang ditulis
// tetap di sini. SVG diskalakan viewBox sehingga tajam di desktop dan HP.

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

// Label singkat "5,28 jt" untuk nilai di atas titik.
function jtLabel(value) {
  const millions = asNumber(value) / 1000000;
  const text = millions.toFixed(2).replace(".", ",");
  return `${text} jt`;
}

// Nama bulan singkat dari "Juni 2026" -> "Jun".
function shortMonth(label) {
  const word = String(label || "").split(" ")[0] || "";
  return word.slice(0, 3);
}

// Skala grafik: sumbu Y 0–6 juta (di atas pengeluaran terbesar 5,31 jt).
const VIEW_W = 640;
const VIEW_H = 280;
const PAD_LEFT = 64;
const PAD_RIGHT = 16;
const PAD_TOP = 18;
const PAD_BOTTOM = 30;
const Y_MAX = 6000000;
const GRIDLINES = [0, 2000000, 4000000, 6000000];

function xAt(index, count) {
  const inner = VIEW_W - PAD_LEFT - PAD_RIGHT;
  if (count <= 1) return PAD_LEFT + inner / 2;
  return PAD_LEFT + (index * inner) / (count - 1);
}

function yAt(value) {
  const inner = VIEW_H - PAD_TOP - PAD_BOTTOM;
  const clamped = Math.max(0, Math.min(Y_MAX, asNumber(value)));
  return PAD_TOP + inner * (1 - clamped / Y_MAX);
}

function gridlinesSvg() {
  return GRIDLINES.map((value) => {
    const y = yAt(value);
    const label = value === 0 ? "Rp 0" : `Rp ${value / 1000000} jt`;
    return `
      <line x1="${PAD_LEFT}" y1="${y}" x2="${VIEW_W - PAD_RIGHT}" y2="${y}" class="trend-grid" />
      <text x="${PAD_LEFT - 8}" y="${y + 4}" class="trend-axis" text-anchor="end">${esc(label)}</text>`;
  }).join("");
}

function monthLabelsSvg(history) {
  return history.map((row, i) => {
    const x = xAt(i, history.length);
    return `<text x="${x}" y="${VIEW_H - 8}" class="trend-axis" text-anchor="middle">${esc(shortMonth(row.month))}</text>`;
  }).join("");
}

function lineSvg(values, history, kind, labelBelow) {
  const points = values
    .map((value, i) => `${xAt(i, history.length).toFixed(1)},${yAt(value).toFixed(1)}`)
    .join(" ");
  const dots = values
    .map((value, i) => {
      const x = xAt(i, history.length);
      const y = yAt(value);
      // Label garis tabungan di BAWAH titik: nilainya (3,2–3,5 jt) tepat
      // di bawah garis grid "Rp 4 jt", jadi label di atas titik menabrak
      // label sumbu itu. Garis pengeluaran tetap di atas titik.
      const labelY = labelBelow ? y + 18 : y - 10;
      return `
      <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5" class="trend-dot trend-dot-${kind}" />
      <text x="${x.toFixed(1)}" y="${labelY.toFixed(1)}" class="trend-value" text-anchor="middle">${esc(jtLabel(value))}</text>`;
    })
    .join("");
  return `
    <polyline points="${points}" class="trend-line trend-line-${kind}" fill="none" />
    ${dots}`;
}

// Satu kalimat wawasan dari tren: bulan paling hemat dan tabungan
// tertinggi 6 bulan terakhir. Dipakai dashboard di bawah grafik.
export function trendInsight(history) {
  const rows = Array.isArray(history) ? history : [];
  if (rows.length === 0) return null;
  let cheapest = rows[0];
  let richest = rows[0];
  for (const row of rows) {
    if (asNumber(row.expenses) < asNumber(cheapest.expenses)) cheapest = row;
    const saved = asNumber(row.income) - asNumber(row.expenses);
    const best = asNumber(richest.income) - asNumber(richest.expenses);
    if (saved > best) richest = row;
  }
  return { cheapest, richest };
}

export function trendChart(history, format) {
  const rows = Array.isArray(history) ? history : [];
  if (rows.length === 0) return "";
  const expenses = rows.map((row) => asNumber(row.expenses));
  const savings = rows.map((row) => asNumber(row.income) - asNumber(row.expenses));
  const first = rows[0];
  const last = rows[rows.length - 1];
  const summary = typeof format === "function"
    ? `Pengeluaran ${first.month} ${format(asNumber(first.expenses))} menjadi ${last.month} ${format(asNumber(last.expenses))}; tabungan ${format(asNumber(last.income) - asNumber(last.expenses))} di bulan terakhir.`
    : `Pengeluaran ${esc(first.month)} sampai ${esc(last.month)}.`;
  return `
    <div class="trend-chart" role="img" aria-label="Grafik tren pengeluaran dan tabungan 6 bulan. ${esc(summary)}">
      <svg viewBox="0 0 ${VIEW_W} ${VIEW_H}" class="trend-svg" aria-hidden="true">
        ${gridlinesSvg()}
        ${lineSvg(expenses, rows, "expense", false)}
        ${lineSvg(savings, rows, "saving", true)}
        ${monthLabelsSvg(rows)}
      </svg>
      <div class="trend-legend">
        <span><span class="legend-swatch is-accent"></span>Pengeluaran</span>
        <span><span class="legend-swatch"></span>Tabungan</span>
      </div>
    </div>`;
}
