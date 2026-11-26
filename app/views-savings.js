const DEFAULT_GOALS = [
  { id: 'dana-darurat', name: 'Dana darurat', target: 10000000, saved: 6400000 },
  { id: 'liburan', name: 'Liburan', target: 5000000, saved: 2250000 },
  { id: 'dp-motor', name: 'DP motor', target: 8000000, saved: 1000000 }
];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function defaultFormat(value) {
  return 'Rp ' + Number(value).toLocaleString('id-ID');
}

export function savingsPage(data, fmt) {
  const format = fmt && typeof fmt.formatRupiah === 'function' ? fmt.formatRupiah : defaultFormat;
  const goals = Array.isArray(data)
    ? data
    : data && Array.isArray(data.goals) && data.goals.length
      ? data.goals
      : DEFAULT_GOALS;

  const cards = goals.map((goal) => {
    const target = Number(goal.target) || 0;
    const saved = Number(goal.saved) || 0;
    const remaining = Math.max(target - saved, 0);
    const rawPercent = target > 0 ? (saved / target) * 100 : 0;
    const barPercent = Math.max(0, Math.min(100, rawPercent));
    const percentLabel = Math.round(rawPercent * 10) / 10;
    const id = escapeHtml(goal.id != null ? goal.id : goal.name);
    const name = escapeHtml(goal.name != null ? goal.name : 'Tanpa nama');

    return `
      <article class="savings-card" data-goal-id="${id}">
        <h3 class="savings-card__title">${name}</h3>
        <dl class="savings-card__details">
          <div><dt>Target</dt><dd>${escapeHtml(format(target))}</dd></div>
          <div><dt>Terkumpul</dt><dd>${escapeHtml(format(saved))}</dd></div>
          <div><dt>Sisa</dt><dd>${escapeHtml(format(remaining))}</dd></div>
        </dl>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentLabel}" aria-label="${name}">
          <div class="progress__bar" style="width: ${barPercent.toFixed(2)}%"></div>
        </div>
        <p class="savings-card__percent">${percentLabel}% tercapai</p>
      </article>
    `;
  }).join('');

  const options = goals.map((goal) => {
    const id = escapeHtml(goal.id != null ? goal.id : goal.name);
    const name = escapeHtml(goal.name != null ? goal.name : 'Tanpa nama');
    return `<option value="${id}">${name}</option>`;
  }).join('');

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
