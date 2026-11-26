// due.js — pengingat jatuh tempo tagihan.
// Semua tanggal dihitung dari tanggal hari ini (waktu setempat) dan
// dueDay tagihan; tidak ada tanggal yang ditulis tetap, jadi pengingat
// selalu benar kapan pun situs dibuka.

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
];

const DAY_MS = 24 * 60 * 60 * 1000;

function asNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isPaidStatus(status) {
  return String(status || "").trim().toLowerCase() === "lunas";
}

// Tanggal jatuh tempo bulan ini (dueDay), apa adanya.
function dueThisMonth(dueDay, today) {
  const day = Math.max(1, Math.min(31, Math.round(asNumber(dueDay) || 1)));
  const date = new Date(today.getFullYear(), today.getMonth(), day);
  // Hari 31 di bulan 30 hari bergeser ke bulan berikut: kembalikan ke
  // hari terakhir bulan ini.
  if (date.getMonth() !== today.getMonth()) {
    return new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }
  return date;
}

// Jatuh tempo berikutnya: bulan ini bila belum lewat, bulan depan bila sudah.
export function nextDueDate(dueDay, today) {
  const now = startOfDay(today || new Date());
  const thisMonth = dueThisMonth(dueDay, now);
  if (startOfDay(thisMonth) >= now) return thisMonth;
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return dueThisMonth(dueDay, next);
}

// "10 Des 2026" — label tanggal pendek Indonesia.
export function shortDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

// Info lengkap satu tagihan: kapan jatuh tempo berikutnya (hari lagi),
// dan berapa hari terlambat bila bulan ini belum lunas dan sudah lewat.
export function dueInfo(bill, today) {
  const now = startOfDay(today || new Date());
  const dueDay = asNumber(bill && bill.dueDay);
  const paid = isPaidStatus(bill && bill.status);
  const next = nextDueDate(dueDay, now);
  const daysUntil = Math.round((startOfDay(next) - now) / DAY_MS);
  const thisMonth = dueThisMonth(dueDay, now);
  const overdueDays = !paid && startOfDay(thisMonth) < now
    ? Math.round((now - startOfDay(thisMonth)) / DAY_MS)
    : 0;
  return { next, nextLabel: shortDate(next), daysUntil, overdueDays, paid };
}

// Teks badge untuk satu tagihan + kelas nadanya.
export function dueBadge(bill, today) {
  const info = dueInfo(bill, today);
  if (info.paid) return { text: "Lunas", tone: "paid" };
  if (info.overdueDays > 0) {
    return {
      text: `Terlambat ${info.overdueDays} hari · berikutnya ${info.nextLabel}`,
      tone: "overdue",
    };
  }
  if (info.daysUntil === 0) {
    return { text: "Jatuh tempo hari ini", tone: "today" };
  }
  return {
    text: `Jatuh tempo ${info.nextLabel} (${info.daysUntil} hari lagi)`,
    tone: "soon",
  };
}

// Ringkasan hitung untuk baris intro halaman Tagihan:
// berapa lunas, berapa terlambat, berapa jatuh tempo hari ini.
export function dueSummary(bills, today) {
  const now = today || new Date();
  const list = Array.isArray(bills) ? bills : [];
  let paid = 0;
  let overdue = 0;
  let dueToday = 0;
  for (const bill of list) {
    const info = dueInfo(bill, now);
    if (info.paid) paid += 1;
    else if (info.overdueDays > 0) overdue += 1;
    else if (info.daysUntil === 0) dueToday += 1;
  }
  return { total: list.length, paid, overdue, dueToday, unpaid: list.length - paid };
}

// Tagihan belum lunas paling mendesak: yang paling lama terlambat dulu,
// lalu yang jatuh temponya paling dekat.
export function urgentBills(bills, today, limit) {
  const now = today || new Date();
  const open = (Array.isArray(bills) ? bills : [])
    .map((bill) => ({ bill, info: dueInfo(bill, now) }))
    .filter((entry) => !entry.info.paid);
  open.sort((a, b) => {
    if (b.info.overdueDays !== a.info.overdueDays) {
      return b.info.overdueDays - a.info.overdueDays;
    }
    return a.info.daysUntil - b.info.daysUntil;
  });
  return open.slice(0, Math.max(0, limit || 2));
}
