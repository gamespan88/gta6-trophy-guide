# Leonida Trophy Guide

[![make.fun bounty](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/gamespan88/gta6-trophy-guide/rank.svg)](https://make.fun/competitions/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/gamespan88/gta6-trophy-guide/reward.svg)](https://make.fun/competitions/gta6-trophy-guide-01)

An offline guide and tracker for all **55 PlayStation 5 trophies of Grand Theft Auto VI** — built for the [gta6-trophy-guide-01 bounty on make.fun](https://make.fun/competitions/gta6-trophy-guide-01).

Open `app/index.html` in a desktop browser (or serve `app/` with any static server) and it works with the network off. No build step, no accounts, no requests: progress lives in your browser's local storage.

## What it does

- **The full official list.** Every one of the 55 trophies — 1 platinum, 2 gold, 6 silver, 46 bronze — with its official name, description and grade, exactly as PlayStation publishes them.
- **A tracker that remembers.** Tick trophies off as you earn them; progress is saved in local storage, summarised as an overall bar plus per-grade counts, and can be **exported to a JSON file and imported back** on another machine.
- **Filters that find things fast.** Category chips (Story, Missable, Collectibles, Activities, Feats & misc), a grade filter, text search, and a hide-earned toggle.
- **Spoiler mode.** A setting that hides the names, descriptions and guides of story trophies until you earn them, so you can track a first playthrough without reading ahead.
- **A roadmap to the platinum.** Eight phases in the order worth earning them — the story and its stranger strands first, the repeatable clean-up after — each phase showing its trophies and your progress through them.
- **Missables flagged, with the rule stated.** Seven trophies are flagged missable, each with a note: the five stranger-strand finales, the eight-strand silver built on them, and the one trophy whose description demands success on a second attempt. The rule used for flagging is printed in the app itself.
- **A cited guide for every trophy.** Click any trophy to read its guide: what it asks and the sensible way to earn it, in this guide's own words, with its source named beside it. Names, descriptions, grades and tracked counts come from the official trophy list (as published on Exophase, with counts as published on Exophase and PSNProfiles); the method in each guide is derived from the official description and says so. No invented locations, steps or numbers.

## Layout

- `app/` — the guide itself: `index.html`, `style.css`, `app.js` (state, persistence, wiring), `views.js` (rendering), and `data/trophies.json` (the official list enriched with category, missable flags, guides, sources and the roadmap).
- `main.ts` — the hand-in program: it sanity-checks the data (55 trophies, the official grade split, a guide for each, a roadmap that covers all 55), copies `app/` and `screenshots/` to the output directory, and writes the dossier with the kit's vendored library.
- `serve.ts` — a tiny local static server for trying the guide: `node serve.ts`, then open http://localhost:8080.
- `screenshots/` — four screenshots of the guide as described in `shots.json`; `take_shots.py` re-takes them with Playwright.

## Running the hand-in program

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/app`, `out/screenshots` and `out/dossier.json`.

## Notes

Leonida Trophy Guide is a fan-made tool with an original look — sunset gradients and hand-drawn palm silhouettes, no Rockstar Games logo, official artwork or official fonts. It is not affiliated with Rockstar Games or PlayStation.
