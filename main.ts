// Avengers Doomsday — Mahjong Skies: hand-in program (Node 22 stdlib only).
// The game lives in game/ as plain static files (index.html + ES modules, no
// library, no network request). This program copies game/ and screenshots/
// from beside this file into the output directory and writes
// /output/dossier.json with the vendored make.fun library, exactly as the
// gate expects. Outside the grader, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve it locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outDir, 'game'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The caps the scorer enforces: text_max_bytes shapes the dossier text; the
// rest refuse an entry the scorer would refuse outright (more than 4
// screenshots or one over 256 KiB; game/ over 993 files or 48 MiB; a game/
// path over 1000 bytes). game/ plus screenshots/ and dossier.json share
// /output's own 1000-entry, 64 MiB cap, so keep room.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
