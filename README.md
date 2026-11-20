# Leonida Trophy Guide

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/gamespan88/gta6-trophy-guide/rank.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/gamespan88/gta6-trophy-guide/reward.svg)](https://make.fun/competitions/gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies of Grand Theft Auto VI** — built for the [gta6-trophy-guide-01 bounty on make.fun](https://make.fun/competitions/gta6-trophy-guide-01).

Open `app/index.html` in a desktop browser (or serve `app/` with any static server) and it works with the network off. No build step, no accounts, no requests: progress lives in your browser's local storage.

## What it does

- **The full official list.** Every one of the 55 trophies — 1 platinum, 2 gold, 6 silver, 46 bronze — with its official name, description and grade, exactly as PlayStation publishes them.
- **A three-pane ledger.** Checklist on the left (grade, official description, category, watch flag, citation markers, earned checkbox), the open guide in the center, and the numbered sources panel on the right. Search, category chips with counts, a grade filter and a hide-earned toggle sit above it, with a NEXT UP line naming the next trophy the roadmap asks for.
- **An audit strip, computed live.** A strip under the header states the entry's own figures — 55 official, 1P 2G 6S 46B, 55/55 guides cite a source, 194 steps, 194 cited, 7 sources read 20 Nov 2026, 2 possibly missable, 5 watch — each one computed from the trophy data at render time, so the strip cannot drift from the data it describes.
- **A numbered, cited guide for every trophy.** Each guide is 3–6 numbered steps in this guide's own words; every one of the 194 steps ends with citation numbers keyed to the seven sources in the panel. Facts about what a trophy asks cite the official list [1]; tracked counts cite the trackers [3] [4]; method steps cite the guide sources [2] [5] [7] and the cross-check list [6]. Where a trigger is not stated anywhere — the Rhino trophy, the partnership moment, the strange encounter — the guide says so instead of inventing one.
- **Counters that remember.** 21 trophies carry a working counter (250 stunts, 42 range challenges at gold, 18 meditation spots, 52 areas, choices to 500, the two money totals, and more), saved in local storage alongside the earned ticks; each total is one the official description states or a cited tracker publishes.
- **Missables in two honest tiers.** Two trophies are flagged *possibly missable* — Strangers & Freaks, which needs all eight stranger strands when any strand can be left behind, and Bad Luck, I Guess, whose second-attempt requirement a flawless first attempt destroys — and five strand finales are flagged *watch*. The rule is printed in the app itself, and the roadmap view gathers all seven in a missable watch panel.
- **A roadmap in eight stages.** Stage chips (S1–S8, each with its earned count) head the roadmap view; every stage lists its trophies with watch flags, and clicking one opens its guide in the ledger.
- **A source matrix.** The third view lists each of the seven sources with the trophies that cite it — [1] is cited by 55 of 55 guides, [5] by 27, [2] and [7] by 20 each, [6] by 17, [3] by 14, [4] by 11 — computed from the same data, so the matrix and the audit strip always agree.
- **Spoiler mode and portability.** Spoiler mode hides story trophies' names, descriptions and guides until earned; progress (earned ticks and counters) exports to a JSON file and imports back on another machine.

## Layout

- `app/` — the guide itself: `index.html`, `style.css`, `app.js` (state, persistence, wiring), `views.js` (rendering — every figure is computed there from the data), and `data/trophies.json` (the official list enriched with category, tiered watch flags, numbered cited steps, counters, the seven numbered sources and the roadmap).
- `main.ts` — the hand-in program: it sanity-checks the data (55 trophies, the official grade split, a cited step-by-step guide for each, a roadmap that covers all 55), copies `app/` and `screenshots/` to the output directory, and writes the dossier with the kit's vendored library.
- `serve.ts` — a tiny local static server for trying the guide: `node serve.ts`, then open http://localhost:8080.
- `screenshots/` — four screenshots of the guide as described in `shots.json`; `take_shots.py` re-takes them with Playwright.

## Running the hand-in program

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/app`, `out/screenshots` and `out/dossier.json`.

## Notes

Leonida Trophy Guide is a fan-made tool with an original look — deep night purple, one slim sunset accent line, no Rockstar Games logo, official artwork or official fonts. It is not affiliated with Rockstar Games or PlayStation. Source addresses are printed in the app as plain text for reference; the page itself loads nothing from anywhere.
