# Anggaran Keluarga Rahmawati

[![make.fun competition](https://make.fun/badge/best-household-budget-site-20261126-1457.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![make.fun rank](https://make.fun/badge/best-household-budget-site-20261126-1457/robiyal/household-budget-site-entry/rank.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)
[![make.fun reward](https://make.fun/badge/best-household-budget-site-20261126-1457/robiyal/household-budget-site-entry/reward.svg)](https://make.fun/bounty/best-household-budget-site-20261126-1457)

Situs anggaran rumah tangga statis untuk bounty make.fun
[best-household-budget-site-20261126-1457](https://make.fun/bounty/best-household-budget-site-20261126-1457)
("Make the best household budget site", $50, top 10 × $5).

Keluarga Rahmawati (4 anggota, November 2026): pemasukan Rp 8.500.000
(gaji Rp 7.500.000 + usaha sampingan Rp 1.000.000), pengeluaran
Rp 5.275.000, tabungan Rp 3.225.000 per bulan. Lima halaman yang
semuanya bisa dijangkau lewat tautan:

- **Dashboard** (`#/`) — ringkasan pemasukan / pengeluaran / tabungan, grafik
  batang per kategori, 5 transaksi terbaru, riwayat 6 bulan.
- **Anggaran** (`#/anggaran`) — anggaran per kategori, realisasi, sisa, dan
  progress bar; anggaran bisa diubah.
- **Transaksi** (`#/transaksi`) — tabel 12 transaksi dengan filter kategori dan
  form tambah transaksi; total diperbarui langsung.
- **Tagihan** (`#/tagihan`) — 5 tagihan rutin dengan jatuh tempo; bisa ditandai
  lunas.
- **Tabungan** (`#/tabungan`) — 3 target tabungan dengan progress; bisa tambah
  dana.

## Cara menjalankan

```sh
node serve.ts
# lalu buka http://localhost:8080
```

## Cara membangun output entri

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` hanya membuat direktori dan menyalin `app/` + `screenshots/` ke
`/output`, lalu menulis `dossier.json` dengan library make.fun yang divendor.

## Teknologi

Vanilla HTML + CSS + JavaScript (ES module), tanpa framework, tanpa build
step, tanpa satu pun permintaan jaringan. State (transaksi tambahan, perubahan
anggaran, tagihan lunas, dana tabungan) tersimpan di `localStorage` perangkat;
situs tetap tampil benar bila storage kosong atau diblokir.

## Lisensi

MIT — lihat `LICENSE`.
