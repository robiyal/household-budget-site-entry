// main.ts — entri best-household-budget-site-20261126-1457 (Node 22, stdlib only).
// Menyalin app/ dan screenshots/ dari samping file ini ke /output lalu menulis
// /output/dossier.json dengan library make.fun yang divendor. Hanya mkdir +
// copy ke dalam /output — direktori /output sendiri tidak pernah dihapus
// (grader memasang /output sebagai bind mount; menghapusnya gagal EBUSY).
// Di luar container grader, MAKEFUN_OUTPUT_DIR menggantikan /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// Batas scorer (reference/gate.json): hanya text_max_bytes membentuk byte;
// yang lain menolak entri yang scorer tolak (lebih dari 4 screenshot atau
// satu di atas 256 KiB; lebih dari 993 file dan direktori di app/ atau
// 16 MiB file app: app/ dihitung di samping batas 1000 entri /output sendiri,
// screenshot/ dan dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 }),
);
