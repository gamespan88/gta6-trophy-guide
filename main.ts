// Leonida Trophy Guide — the hand-in program for gta6-trophy-guide-01 (Node 22, standard
// library only). The guide itself is this directory's app/ folder: plain static files a
// browser opens at app/index.html, working fully offline, with the trophy list, guides,
// roadmap and sources in app/data/trophies.json. This program checks that data, copies
// app/ and screenshots/ from beside this file to /output, and writes /output/dossier.json
// with buildDossier from vendor/makefun-frontend.ts — the kit's library, left unchanged,
// because the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Serve the guide locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const APP_TITLE = 'Leonida Trophy Guide';
const EXPECTED_TROPHIES = 55;
const EXPECTED_GRADES = { platinum: 1, gold: 2, silver: 6, bronze: 46 };

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Sanity-check the guide's data before handing anything in: the official list has 55
// trophies (1 platinum, 2 gold, 6 silver, 46 bronze), and the gate refuses the entry
// unless every one is present with a cited step-by-step guide of its own.
function checkTrophyData() {
  const data = JSON.parse(readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8'));
  const trophies = Array.isArray(data) ? data : data.trophies;
  if (!Array.isArray(trophies) || trophies.length !== EXPECTED_TROPHIES) {
    throw new Error(`${APP_TITLE}: expected ${EXPECTED_TROPHIES} trophies, found ${trophies?.length}`);
  }
  const grades = {};
  for (const trophy of trophies) {
    if (typeof trophy.name !== 'string' || trophy.name.trim() === '') {
      throw new Error(`${APP_TITLE}: a trophy has no name`);
    }
    const steps = Array.isArray(trophy.steps) ? trophy.steps : [];
    if (steps.length === 0 || steps.some((step) => typeof step?.text !== 'string' || step.text.trim() === '')) {
      throw new Error(`${APP_TITLE}: trophy "${trophy.name}" has no guide steps`);
    }
    if (!steps.some((step) => Array.isArray(step.cite) && step.cite.length > 0)) {
      throw new Error(`${APP_TITLE}: trophy "${trophy.name}" cites no source in its guide`);
    }
    grades[trophy.grade] = (grades[trophy.grade] ?? 0) + 1;
  }
  for (const [grade, count] of Object.entries(EXPECTED_GRADES)) {
    if (grades[grade] !== count) {
      throw new Error(`${APP_TITLE}: expected ${count} ${grade} trophies, found ${grades[grade] ?? 0}`);
    }
  }
  const phases = Array.isArray(data.roadmap) ? data.roadmap : [];
  const covered = new Set(phases.flatMap((phase) => phase.trophyIds ?? []));
  if (covered.size !== EXPECTED_TROPHIES) {
    throw new Error(`${APP_TITLE}: the roadmap covers ${covered.size} of ${EXPECTED_TROPHIES} trophies`);
  }
  console.log(`${APP_TITLE}: data OK — ${trophies.length} trophies, ${phases.length} roadmap phases.`);
}

checkTrophyData();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the
// others refuse an entry the scorer would refuse (more than 4 screenshots or one over
// 256 KiB; more than 993 files and directories in app/ or 48 MiB of app files: app/
// counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
console.log(`${APP_TITLE}: app and screenshots handed in; dossier written to ${join(out, 'dossier.json')}.`);
