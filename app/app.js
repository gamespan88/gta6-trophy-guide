// Leonida Trophy Guide — app entry point.
// Loads the trophy data, owns the UI state (earned set, per-trophy counters,
// filters, spoiler mode, the open guide, the current view), persists progress to
// localStorage, wires the controls, and renders through views.js. It also reads
// the ?shot= scenes that shots.json names, so the maker's screenshots can be
// taken of exact states: ?earned=2,3,17 seeds earned trophies,
// ?counters=17:23,25:5 seeds counters, ?open=28 opens a guide, ?spoiler=1 turns
// spoiler mode on, ?cat=watch picks a filter and ?view=roadmap or ?view=matrix
// opens that view. A normal visit uses none of them, and the ledger opens on
// the meditation guide — the richest guide on the list, with its counter, its
// possibly-missable flag and its unconfirmed total all visible at once.

import {
  renderProgress, renderAudit, renderChips, renderList,
  renderDetail, renderSidePanel, renderRoadmap, renderMatrix,
} from './views.js';

const EARNED_KEY = 'leonida-trophy-guide:earned';
const COUNTERS_KEY = 'leonida-trophy-guide:counters';
const SPOILER_KEY = 'leonida-trophy-guide:spoiler';

const doc = await (await fetch('data/trophies.json')).json();
const params = new URLSearchParams(location.search);

function loadEarned() {
  try {
    return new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function loadCounters() {
  try {
    const parsed = JSON.parse(localStorage.getItem(COUNTERS_KEY) ?? '{}');
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

// A counter can never pass its trophy's total or drop below zero, however the
// value arrived — seeded by a screenshot scene, typed into an import file, or
// restored from storage written by an older version.
function clampCounters(counters) {
  const out = {};
  for (const trophy of doc.trophies) {
    const raw = Number(counters[trophy.id]);
    if (!Number.isFinite(raw)) continue;
    const max = trophy.counter?.total ?? Number.POSITIVE_INFINITY;
    out[trophy.id] = Math.min(max, Math.max(0, Math.floor(raw)));
  }
  return out;
}

const state = {
  earned: loadEarned(),
  counters: clampCounters(loadCounters()),
  category: 'all',
  grade: 'all',
  query: '',
  hideEarned: false,
  notEarned: false,
  spoiler: localStorage.getItem(SPOILER_KEY) === '1',
  selectedId: null,
  view: 'ledger',
};

// Screenshot scenes seed their state from the query string instead of localStorage.
if (params.has('earned')) {
  state.earned = new Set(params.get('earned').split(',').map(Number).filter((n) => n > 0));
}
if (params.has('counters')) {
  const seeded = {};
  for (const pair of params.get('counters').split(',')) {
    const [id, value] = pair.split(':').map(Number);
    if (id > 0) seeded[id] = value || 0;
  }
  state.counters = clampCounters(seeded);
}
if (params.has('spoiler')) state.spoiler = params.get('spoiler') === '1';
if (params.has('notearned')) state.notEarned = params.get('notearned') === '1';
if (params.has('cat')) state.category = params.get('cat');
if (params.get('view') === 'roadmap' || params.get('view') === 'matrix') state.view = params.get('view');
// The ledger opens with a guide already open: the shot's ?open= choice, else the
// meditation guide (id 28) — the list's richest single guide.
if (params.has('open')) state.selectedId = Number(params.get('open'));
if (state.selectedId === null) state.selectedId = 28;

const handlers = {
  onToggle(id) {
    if (state.earned.has(id)) state.earned.delete(id);
    else state.earned.add(id);
    saveProgress();
    render();
  },
  onSelect(id) {
    state.selectedId = id;
    render();
  },
  onCounter(id, delta) {
    const trophy = doc.trophies.find((t) => t.id === id);
    const max = trophy?.counter?.total ?? Number.POSITIVE_INFINITY;
    const next = Math.min(max, Math.max(0, (state.counters[id] ?? 0) + delta));
    state.counters[id] = next;
    saveProgress();
    render();
  },
  onJump(id) {
    state.view = 'ledger';
    state.category = 'all';
    state.selectedId = id;
    render();
    document.querySelector('#detail').scrollIntoView({ block: 'nearest' });
  },
  onView(view) {
    state.view = view;
    render();
  },
};

function saveProgress() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...state.earned]));
  localStorage.setItem(COUNTERS_KEY, JSON.stringify(state.counters));
  localStorage.setItem(SPOILER_KEY, state.spoiler ? '1' : '0');
}

function render() {
  renderProgress(doc, state.earned, document);
  renderAudit(doc, document);
  document.querySelector('#view-ledger').hidden = state.view !== 'ledger';
  document.querySelector('#view-roadmap').hidden = state.view !== 'roadmap';
  document.querySelector('#view-matrix').hidden = state.view !== 'matrix';
  document.querySelector('#tab-ledger').classList.toggle('active', state.view === 'ledger');
  document.querySelector('#tab-roadmap').classList.toggle('active', state.view === 'roadmap');
  document.querySelector('#tab-matrix').classList.toggle('active', state.view === 'matrix');
  document.querySelector('#spoiler-mode').checked = state.spoiler;
  const notEarnedChip = document.querySelector('#not-earned');
  notEarnedChip.classList.toggle('active', state.notEarned);
  notEarnedChip.setAttribute('aria-pressed', state.notEarned ? 'true' : 'false');
  if (state.view === 'ledger') {
    renderChips(doc, state, document);
    renderList(doc, state, handlers, document);
    renderDetail(doc, state, handlers, document);
    renderSidePanel(doc, state, handlers, document);
  } else if (state.view === 'roadmap') {
    renderRoadmap(doc, state, handlers, document);
  } else {
    renderMatrix(doc, state, handlers, document);
  }
}

document.querySelector('#search').addEventListener('input', (e) => {
  state.query = e.target.value.trim();
  render();
});
document.querySelector('#category-chips').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-cat]');
  if (!chip) return;
  state.category = chip.dataset.cat;
  render();
});
document.querySelector('#grade-filter').addEventListener('change', (e) => {
  state.grade = e.target.value;
  render();
});
document.querySelector('#hide-earned').addEventListener('change', (e) => {
  state.hideEarned = e.target.checked;
  render();
});
document.querySelector('#not-earned').addEventListener('click', () => {
  state.notEarned = !state.notEarned;
  render();
});
document.querySelector('#spoiler-mode').addEventListener('change', (e) => {
  state.spoiler = e.target.checked;
  saveProgress();
  render();
});
for (const [tab, view] of [['#tab-ledger', 'ledger'], ['#tab-roadmap', 'roadmap'], ['#tab-matrix', 'matrix']]) {
  document.querySelector(tab).addEventListener('click', () => {
    state.view = view;
    render();
  });
}
document.querySelector('#export-btn').addEventListener('click', () => {
  const payload = JSON.stringify({
    app: 'leonida-trophy-guide',
    earned: [...state.earned].sort((a, b) => a - b),
    counters: state.counters,
  }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'leonida-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.querySelector('#import-file').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    const valid = new Set(doc.trophies.map((t) => t.id));
    state.earned = new Set(ids.filter((id) => valid.has(id)));
    if (parsed && typeof parsed.counters === 'object' && parsed.counters !== null) {
      state.counters = clampCounters(parsed.counters);
    }
    saveProgress();
    render();
  } catch {
    // A file that is not progress JSON changes nothing.
  }
  e.target.value = '';
});

document.querySelector('#missable-rule').textContent = doc.missableRule;
document.querySelector('#footer-sources').textContent =
  doc.sources.map((s) => `[${s.n}] ${s.name} (${s.url})`).join(' · ') +
  '. Every guide is written for this page in its own words, and the citation numbers beside each step name the sources that step rests on.';
render();
window.__shotReady = true;
