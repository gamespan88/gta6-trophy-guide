// Leonida Trophy Guide — app entry point.
// Loads the trophy data, owns the UI state (earned set, filters, spoiler mode, the open
// guide), persists progress to localStorage, wires the controls, and renders through
// views.js. It also reads the ?shot= scenes that shots.json names, so the maker's
// screenshots can be taken of exact states: ?earned=2,3,17 seeds earned trophies,
// ?open=17 opens a guide, ?spoiler=1 turns spoiler mode on, ?cat=missable picks a
// filter and ?view=roadmap opens the roadmap. A normal visit uses none of them.

import {
  renderProgress, renderList, renderDetail, renderRoadmap,
} from './views.js';

const EARNED_KEY = 'leonida-trophy-guide:earned';
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

const state = {
  earned: loadEarned(),
  category: 'all',
  grade: 'all',
  query: '',
  hideEarned: false,
  spoiler: localStorage.getItem(SPOILER_KEY) === '1',
  selectedId: null,
  view: 'tracker',
};

// Screenshot scenes seed their state from the query string instead of localStorage.
if (params.has('earned')) {
  state.earned = new Set(params.get('earned').split(',').map(Number).filter((n) => n > 0));
}
if (params.has('spoiler')) state.spoiler = params.get('spoiler') === '1';
if (params.has('open')) state.selectedId = Number(params.get('open'));
if (params.has('cat')) state.category = params.get('cat');
if (params.get('view') === 'roadmap') state.view = 'roadmap';

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
  onJump(id) {
    state.view = 'tracker';
    state.category = 'all';
    state.selectedId = id;
    render();
    document.querySelector('#detail').scrollIntoView({ block: 'nearest' });
  },
};

function saveProgress() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...state.earned]));
  localStorage.setItem(SPOILER_KEY, state.spoiler ? '1' : '0');
}

function render() {
  renderProgress(doc, state.earned, document);
  document.querySelector('#view-tracker').hidden = state.view !== 'tracker';
  document.querySelector('#view-roadmap').hidden = state.view !== 'roadmap';
  document.querySelector('#tab-tracker').classList.toggle('active', state.view === 'tracker');
  document.querySelector('#tab-roadmap').classList.toggle('active', state.view === 'roadmap');
  document.querySelectorAll('#category-chips .chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.cat === state.category);
  });
  document.querySelector('#spoiler-mode').checked = state.spoiler;
  if (state.view === 'tracker') {
    renderList(doc, state, handlers, document);
    renderDetail(doc, state, handlers, document);
  } else {
    renderRoadmap(doc, state, handlers, document);
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
document.querySelector('#spoiler-mode').addEventListener('change', (e) => {
  state.spoiler = e.target.checked;
  saveProgress();
  render();
});
document.querySelector('#tab-tracker').addEventListener('click', () => {
  state.view = 'tracker';
  render();
});
document.querySelector('#tab-roadmap').addEventListener('click', () => {
  state.view = 'roadmap';
  render();
});
document.querySelector('#export-btn').addEventListener('click', () => {
  const payload = JSON.stringify({
    app: 'leonida-trophy-guide',
    earned: [...state.earned].sort((a, b) => a - b),
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
    saveProgress();
    render();
  } catch {
    // A file that is not progress JSON changes nothing.
  }
  e.target.value = '';
});

document.querySelector('#missable-rule').textContent = doc.missableRule;
render();
window.__shotReady = true;
