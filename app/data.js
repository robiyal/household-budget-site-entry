export const household = {
  keluarga: "Keluarga Rahmawati",
  anggota: 4,
  bulan: "November 2026"
};

export const income = {
  total: 8500000,
  gaji: 7500000,
  usahaSampingan: 1000000,
  sources: [
    { name: "Gaji", amount: 7500000 },
    { name: "Usaha sampingan", amount: 1000000 }
  ]
};

export const expenses = [
  { category: "Belanja harian", amount: 2150000 },
  { category: "Listrik & air", amount: 650000 },
  { category: "Transport", amount: 400000 },
  { category: "Sekolah anak", amount: 750000 },
  { category: "Lain-lain", amount: 1325000 }
];

export const transactions = [
  { date: "2026-11-01", name: "Iuran RT", category: "Lain-lain", amount: 150000 },
  { date: "2026-11-03", name: "SPP sekolah anak", category: "Sekolah anak", amount: 750000 },
  { date: "2026-11-05", name: "Internet bulanan", category: "Lain-lain", amount: 350000 },
  { date: "2026-11-06", name: "Belanja pasar minggu pertama", category: "Belanja harian", amount: 750000 },
  { date: "2026-11-08", name: "Bensin motor", category: "Transport", amount: 250000 },
  { date: "2026-11-10", name: "Token listrik", category: "Listrik & air", amount: 420000 },
  { date: "2026-11-12", name: "Tagihan air", category: "Listrik & air", amount: 230000 },
  { date: "2026-11-13", name: "Belanja pasar minggu kedua", category: "Belanja harian", amount: 600000 },
  { date: "2026-11-17", name: "Ojek online", category: "Transport", amount: 150000 },
  { date: "2026-11-20", name: "Belanja pasar minggu ketiga", category: "Belanja harian", amount: 500000 },
  { date: "2026-11-24", name: "Kebutuhan rumah tangga", category: "Lain-lain", amount: 825000 },
  { date: "2026-11-25", name: "Belanja pasar minggu keempat", category: "Belanja harian", amount: 300000 }
];

export const history = [
  { month: "Juni 2026", income: 8500000, expenses: 5050000 },
  { month: "Juli 2026", income: 8500000, expenses: 5180000 },
  { month: "Agustus 2026", income: 8500000, expenses: 5275000 },
  { month: "September 2026", income: 8500000, expenses: 5120000 },
  { month: "Oktober 2026", income: 8500000, expenses: 5310000 },
  { month: "November 2026", income: 8500000, expenses: 5275000 }
];

export const bills = [
  { name: "Listrik", amount: 420000, dueDay: 10 },
  { name: "Air", amount: 230000, dueDay: 12 },
  { name: "Internet", amount: 350000, dueDay: 5 },
  { name: "Iuran RT", amount: 150000, dueDay: 1 },
  { name: "Sekolah anak", amount: 750000, dueDay: 3 }
];

export const goals = [
  { name: "Dana darurat", target: 10000000, saved: 6400000 },
  { name: "Liburan", target: 5000000, saved: 2250000 },
  { name: "DP motor", target: 8000000, saved: 1000000 }
];
