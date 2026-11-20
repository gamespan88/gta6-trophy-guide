# Leonida Trophy Guide

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/gamespan88/gta6-trophy-guide/rank.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/gamespan88/gta6-trophy-guide/reward.svg)](https://make.fun/competitions/gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies of Grand Theft Auto VI** — built for the [gta6-trophy-guide-01 bounty on make.fun](https://make.fun/competitions/gta6-trophy-guide-01).

Open `app/index.html` in a desktop browser (or serve `app/` with any static server) and it works with the network off. No build step, no accounts, no requests: progress lives in your browser's local storage.

## What it does

- **The full official list.** Every one of the 55 trophies — 1 platinum, 2 gold, 6 silver, 46 bronze — with its official name, description and grade, exactly as PlayStation publishes them.
- **A three-pane ledger.** Checklist on the left (grade, official description, category, watch flag, citation markers, earned checkbox), the open guide in the center, and a side panel on the right: the NEXT UP list (the next three unearned trophies in roadmap order) above the sources for the open guide, each with the number of that guide's steps citing it. Search, category chips with counts (All, Story, Missable, Collectibles, Activities, Feats & misc), a grade filter, a hide-earned toggle and a Not earned chip sit above the list. The ledger opens on the meditation guide — the richest guide on the list.
- **An audit strip at claim level, computed live.** A strip under the one-line header states the entry's own figures — 55 official, 1P 2G 6S 46B, 55/55 guides cite a source, 200 steps, 200 cited, 200 cite 2+ sources, 0 single-source, 8 tracker-stated totals, 3 unconfirmed triggers, 3 possibly missable, 5 watch, 18 sources read 20 Nov 2026 — each one computed from the trophy data at render time, so the strip cannot drift from the data it describes.
- **A numbered, cited guide for every trophy.** Each guide is 3–6 numbered steps in this guide's own words, and every step leads with method — sequence, conditions, warnings, cross-trophy links — never a restatement of the description. Every one of the 200 steps cites at least two of the 18 numbered sources; facts about what a trophy asks cite the official list [1], tracked counts cite the trackers [5] [6] [17], and method steps cite the guide and locations pages the step rests on.
- **Uncertainty, shown rather than smoothed over.** Eight counter totals are published by the trackers but never stated in the official descriptions (42 range challenges, 18 meditation spots, 52 areas, 500 choices…); each of those guides carries a TOTAL UNCONFIRMED box showing both sides — what the official list says, and where the number actually comes from. Three trophies whose descriptions state no trigger at all (the Rhino, the partnership moment, the strange encounter) carry a TRIGGER UNCONFIRMED box instead of an invented method.
- **Counters that remember.** 21 trophies carry a working counter (250 stunts, 42 range challenges at gold, 18 meditation spots, 52 areas, choices to 500, the two money totals, and more), saved in local storage alongside the earned ticks; each total is one the official description states or a cited tracker publishes — and the tracker-stated ones are flagged as such.
- **Missables in two honest tiers.** Three trophies are flagged *possibly missable* — Strangers & Freaks, which needs all eight stranger strands when any strand can be left behind; Bad Luck, I Guess, whose second-attempt requirement a flawless first attempt destroys; and Positive Mental Attitude, whose full set may include a meditation spot offered only once, during Chapter 1, and whose requirement is unconfirmed — and five strand finales are flagged *watch*. The rule is printed in the app itself, the Missable chip filters to the eight, and the roadmap view gathers all eight in a missable watch panel.
- **A roadmap in eight stages.** Stage chips (S1–S8, each with its earned count) head the roadmap view; every stage carries a computed detail line (trophy count, earned count, the story chapters its descriptions name, its progress counters) and lists its trophies with watch flags, and clicking one opens its guide in the ledger.
- **A source matrix.** The third view lists each of the 18 sources — the official list, three trackers, and the guide, locations, database and map pages of PowerPyx, OutputLag, GTABase and KeenGamer — with the trophies that cite it: [1] is cited by 55 of 55 guides, [7] by 33, [2] by 23, [6] and [11] by 20 each, [9] by 18 — computed from the same data, so the matrix and the audit strip always agree.
- **Spoiler mode and portability.** Spoiler mode hides story trophies' names, descriptions and guides until earned; progress (earned ticks and counters) exports to a JSON file and imports back on another machine.

## Layout

- `app/` — the guide itself: `index.html`, `style.css`, `app.js` (state, persistence, wiring), `views.js` (rendering — every figure is computed there from the data), and `data/trophies.json` (the official list enriched with category, tiered watch flags, numbered cited steps, counters, uncertainty notes, the 18 numbered sources and the roadmap).
- `main.ts` — the hand-in program: it sanity-checks the data (55 trophies with every official field present, the official grade split, a non-blank guide and a cited step-by-step guide for each, a roadmap that covers all 55), copies `app/` and `screenshots/` to the output directory, and writes the dossier with the kit's vendored library.
- `serve.ts` — a tiny local static server for trying the guide: `node serve.ts`, then open http://localhost:8080.
- `screenshots/` — four screenshots of the guide as described in `shots.json`; `take_shots.py` re-takes them with Playwright.

## Running the hand-in program

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/app`, `out/screenshots` and `out/dossier.json`.

## Notes

Leonida Trophy Guide is a fan-made tool with an original look — deep night purple, one slim sunset accent line, no Rockstar Games logo, official artwork or official fonts. It is not affiliated with Rockstar Games or PlayStation. Source addresses are printed in the app as plain text for reference; the page itself loads nothing from anywhere.
