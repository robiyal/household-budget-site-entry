// views-savings.js — halaman Tabungan: kartu tiap tujuan dengan target,
// dana terkumpul, sisa, dan progres. Dana yang ditambahkan tersimpan di
// perangkat ini (ditangani main.js).

const DEFAULT_GOALS = [
  { id: "dana-darurat", name: "Dana darurat", target: 10000000, saved: 6400000 },
  { id: "liburan", name: "Liburan", target: 5000000, saved: 2250000 },
  { id: "dp-motor", name: "DP motor", target: 8000000, saved: 1000000 },
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

function rupiahFallback(value) {
  return "Rp " + asNumber(value).toLocaleString("id-ID");
}

function pickFormatter(fmt) {
  if (fmt && typeof fmt.formatRupiah === "function") return fmt.formatRupiah;
  return rupiahFallback;
}

function resolveGoals(data) {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.goals) && data.goals.length) return data.goals;
  return DEFAULT_GOALS;
}

function goalCard(goal, format) {
  const target = asNumber(goal.target);
  const saved = asNumber(goal.saved);
  const remaining = Math.max(target - saved, 0);
  const rawPercent = target > 0 ? (saved / target) * 100 : 0;
  const barPercent = Math.max(0, Math.min(100, rawPercent));
  const percentLabel = Math.round(rawPercent * 10) / 10;
  const id = esc(goal.id != null ? goal.id : goal.name);
  const name = esc(goal.name != null ? goal.name : "Tanpa nama");

  return `
      <article class="savings-card" data-goal-id="${id}">
        <h3 class="savings-card__title">${name}</h3>
        <dl class="savings-card__details">
          <div><dt>Target</dt><dd>${esc(format(target))}</dd></div>
          <div><dt>Terkumpul</dt><dd>${esc(format(saved))}</dd></div>
          <div><dt>Sisa</dt><dd>${esc(format(remaining))}</dd></div>
        </dl>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentLabel}" aria-label="${name}">
          <div class="progress__bar" style="width: ${barPercent.toFixed(2)}%"></div>
        </div>
        <p class="savings-card__percent">${percentLabel}% tercapai</p>
      </article>`;
}

export function savingsPage(data, fmt) {
  const format = pickFormatter(fmt);
  const goals = resolveGoals(data);
  const cards = goals.map((goal) => goalCard(goal, format)).join("");
  const options = goals
    .map((goal) => {
      const id = esc(goal.id != null ? goal.id : goal.name);
      const name = esc(goal.name != null ? goal.name : "Tanpa nama");
      return `<option value="${id}">${name}</option>`;
    })
    .join("");

  return `
    <section class="savings-page">
      <header class="savings-page__header">
        <h1>Tabungan</h1>
        <p>Pantau target dan tambah dana tabunganmu. Dana yang ditambahkan tersimpan di perangkat ini.</p>
      </header>
      <div class="savings-grid">
        ${cards}
      </div>
      <form class="savings-form" id="savings-form">
        <h2>Tambah dana</h2>
        <label for="savings-goal">Tujuan</label>
        <select id="savings-goal" name="goalId" required>
          ${options}
        </select>
        <label for="savings-amount">Jumlah</label>
        <input id="savings-amount" name="amount" type="number" min="1" step="1" inputmode="numeric" placeholder="0" required />
        <button type="submit">Tambah dana</button>
        <div id="savings-message" role="status" aria-live="polite"></div>
      </form>
    </section>
  `;
}
