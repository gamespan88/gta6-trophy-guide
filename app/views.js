// Rendering for the Leonida Trophy Guide: progress header, the claims-level
// audit strip, the three-pane ledger (checklist, the open guide, the side panel
// with the NEXT UP list and the sources for the open guide), the roadmap with
// its stage chips, stage detail lines and missable watch panel, and the source
// matrix. Pure DOM building from the loaded data and the UI state that app.js
// owns. Every figure shown — audit strip, cited-by counts, per-guide source
// counts, stage progress — is computed here from the trophy data at render
// time, never typed into the page.

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const CATEGORY_LABELS = {
  story: 'Story',
  collectibles: 'Collectibles',
  activities: 'Activities',
  misc: 'Feats & misc',
};

// One trophy (Bad Luck, I Guess) carries the legacy category "missable" in the
// data; for filtering it belongs with the feats. The Missable chip is separate:
// it filters on the watch flags, not on a category.
export function categoryOf(trophy) {
  return trophy.category === 'missable' ? 'misc' : trophy.category;
}

export function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// The citation numbers a trophy's guide uses, in order: every step's cites, plus
// its watch flag's and uncertainty note's cites.
export function citesOf(trophy) {
  const set = new Set();
  for (const step of trophy.steps ?? []) for (const n of step.cite ?? []) set.add(n);
  if (trophy.watch) for (const n of trophy.watch.cite ?? []) set.add(n);
  if (trophy.uncertainty) for (const n of trophy.uncertainty.cite ?? []) set.add(n);
  return [...set].sort((a, b) => a - b);
}

// How many of a trophy's steps cite each source — the per-guide accounting the
// side panel shows.
export function guideSourceCounts(trophy) {
  const counts = new Map();
  for (const step of trophy.steps ?? []) {
    for (const n of new Set(step.cite ?? [])) counts.set(n, (counts.get(n) ?? 0) + 1);
  }
  return counts;
}

export function citeMarks(cites) {
  return cites.map((n) => `<span class="cite">[${n}]</span>`).join('');
}

// The audit figures, computed from the data: totals a reader can verify against
// the list itself, at claim level — every step counted, its citations counted,
// and the guide's uncertainty (tracker-stated totals, unconfirmed triggers)
// counted alongside.
export function computeAudit(doc) {
  let totalSteps = 0;
  let citedSteps = 0;
  let backedSteps = 0;
  let singleSteps = 0;
  let citedGuides = 0;
  const perSource = new Map(doc.sources.map((s) => [s.n, 0]));
  for (const trophy of doc.trophies) {
    const cites = citesOf(trophy);
    if (cites.length) citedGuides += 1;
    for (const n of cites) perSource.set(n, (perSource.get(n) ?? 0) + 1);
    for (const step of trophy.steps ?? []) {
      totalSteps += 1;
      const distinct = new Set(step.cite ?? []).size;
      if (distinct >= 1) citedSteps += 1;
      if (distinct >= 2) backedSteps += 1;
      if (distinct === 1) singleSteps += 1;
    }
  }
  const grades = Object.fromEntries(GRADE_ORDER.map((g) => [g, doc.trophies.filter((t) => t.grade === g).length]));
  return {
    total: doc.trophies.length,
    grades,
    totalSteps,
    citedSteps,
    backedSteps,
    singleSteps,
    citedGuides,
    perSource,
    trackerTotals: doc.trophies.filter((t) => t.counter?.totalSource === 'tracker').length,
    unconfirmed: doc.trophies.filter((t) => t.uncertainty?.kind === 'trigger').length,
    possibly: doc.trophies.filter((t) => t.watch?.tier === 'possibly').length,
    watch: doc.trophies.filter((t) => t.watch?.tier === 'watch').length,
    readDate: doc.sources[0]?.read ?? '',
    sourceCount: doc.sources.length,
  };
}

export function stageOf(doc, id) {
  for (const phase of doc.roadmap) if (phase.trophyIds.includes(id)) return phase.phase;
  return null;
}

export function nextUp(doc, earned) {
  return nextUpList(doc, earned, 1)[0] ?? null;
}

// The next unearned trophies, in roadmap order — the side panel's NEXT UP list.
export function nextUpList(doc, earned, count = 3) {
  const out = [];
  for (const phase of doc.roadmap) {
    for (const id of phase.trophyIds) {
      if (!earned.has(id)) {
        const trophy = doc.trophies.find((t) => t.id === id);
        if (trophy) out.push(trophy);
        if (out.length >= count) return out;
      }
    }
  }
  return out;
}

// Spoiler mode hides a story trophy's name, description and guide until earned.
export function isSpoilerHidden(trophy, state) {
  return state.spoiler && categoryOf(trophy) === 'story' && !state.earned.has(trophy.id);
}

export function displayName(trophy, state) {
  return isSpoilerHidden(trophy, state) ? 'Hidden story trophy' : trophy.name;
}

export function displayDescription(trophy, state) {
  return isSpoilerHidden(trophy, state)
    ? 'Spoiler mode is on: this story trophy stays hidden until you earn it.'
    : trophy.description;
}

export function trophyMatches(trophy, state) {
  if (state.category === 'watch' && !trophy.watch) return false;
  if (state.category !== 'all' && state.category !== 'watch' && categoryOf(trophy) !== state.category) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.hideEarned && state.earned.has(trophy.id)) return false;
  if (state.notEarned && state.earned.has(trophy.id)) return false;
  if (state.query) {
    const steps = (trophy.steps ?? []).map((s) => s.text).join(' ');
    const hay = `${trophy.name} ${trophy.description} ${steps}`.toLowerCase();
    if (!hay.includes(state.query.toLowerCase())) return false;
  }
  return true;
}

export function renderProgress(doc, earned, root) {
  const total = doc.trophies.length;
  const count = doc.trophies.filter((t) => earned.has(t.id)).length;
  const pct = Math.round((count / total) * 100);
  root.querySelector('#progress-count').textContent = `${count} of ${total} earned`;
  root.querySelector('#progress-pct').textContent = `${pct}%`;
  root.querySelector('#progress-fill').style.width = `${pct}%`;
  root.querySelector('#grade-counts').innerHTML = GRADE_ORDER.map((grade) => {
    const ofGrade = doc.trophies.filter((t) => t.grade === grade);
    const got = ofGrade.filter((t) => earned.has(t.id)).length;
    return `<li><span class="dot grade-${grade}"></span>${grade} <strong>${got}/${ofGrade.length}</strong></li>`;
  }).join('');
}

export function renderAudit(doc, root) {
  const a = computeAudit(doc);
  const g = a.grades;
  root.querySelector('#audit-strip').textContent =
    `AUDIT · ${a.total} official · ${g.platinum}P ${g.gold}G ${g.silver}S ${g.bronze}B · ` +
    `${a.citedGuides}/${a.total} guides cite a source · ${a.totalSteps} steps · ${a.citedSteps} cited · ` +
    `${a.backedSteps} cite 2+ sources · ${a.singleSteps} single-source · ` +
    `${a.trackerTotals} tracker-stated totals · ${a.unconfirmed} unconfirmed triggers · ` +
    `${a.possibly} possibly missable · ${a.watch} watch · ${a.sourceCount} sources read ${a.readDate} · ` +
    `every figure on this strip is computed from the trophy data`;
}

export function renderChips(doc, state, root) {
  const counts = { all: doc.trophies.length, watch: doc.trophies.filter((t) => t.watch).length };
  for (const key of Object.keys(CATEGORY_LABELS)) {
    counts[key] = doc.trophies.filter((t) => categoryOf(t) === key).length;
  }
  const defs = [
    ['all', 'All'],
    ['story', 'Story'],
    ['watch', '⚑ Missable'],
    ['collectibles', 'Collectibles'],
    ['activities', 'Activities'],
    ['misc', 'Feats & misc'],
  ];
  root.querySelector('#category-chips').innerHTML = defs.map(([key, label]) =>
    `<button type="button" class="chip${state.category === key ? ' active' : ''}" data-cat="${key}">${label} ${counts[key] ?? 0}</button>`).join('');
}

function watchTag(trophy) {
  if (!trophy.watch) return '';
  return trophy.watch.tier === 'possibly'
    ? '<span class="tag tag-possibly">⚑ Possibly missable</span>'
    : '<span class="tag tag-watch">⚑ Watch</span>';
}

function tagsHtml(trophy, doc) {
  const parts = [
    `<span class="badge grade-${trophy.grade}">${trophy.grade}</span>`,
    `<span class="tag">${CATEGORY_LABELS[categoryOf(trophy)]}</span>`,
  ];
  if (doc) {
    const stage = stageOf(doc, trophy.id);
    if (stage) parts.push(`<span class="tag">Stage S${stage}</span>`);
  }
  if (watchTag(trophy)) parts.push(watchTag(trophy));
  return parts.join(' ');
}

export function renderList(doc, state, handlers, root) {
  const list = root.querySelector('#trophy-list');
  const shown = doc.trophies.filter((t) => trophyMatches(t, state));
  root.querySelector('#result-line').textContent =
    `Showing ${shown.length} of ${doc.trophies.length} trophies — click one to read its guide.`;
  list.innerHTML = shown.map((trophy) => {
    const earned = state.earned.has(trophy.id);
    const hidden = isSpoilerHidden(trophy, state);
    const selected = state.selectedId === trophy.id;
    return `<li class="trophy-row grade-${trophy.grade}${earned ? ' earned' : ''}${selected ? ' selected' : ''}" data-id="${trophy.id}">
      <label class="check" title="Mark earned">
        <input type="checkbox" data-toggle="${trophy.id}" ${earned ? 'checked' : ''}>
      </label>
      <button type="button" class="row-main" data-select="${trophy.id}">
        <span class="row-top">${tagsHtml(trophy)}</span>
        <span class="row-name">${esc(displayName(trophy, state))}</span>
        <span class="row-desc">${esc(displayDescription(trophy, state))}</span>
        ${hidden ? '' : `<span class="row-cites">${citeMarks(citesOf(trophy))}</span>`}
      </button>
    </li>`;
  }).join('');
  list.querySelectorAll('[data-toggle]').forEach((box) => {
    box.addEventListener('change', () => handlers.onToggle(Number(box.dataset.toggle)));
  });
  list.querySelectorAll('[data-select]').forEach((btn) => {
    btn.addEventListener('click', () => handlers.onSelect(Number(btn.dataset.select)));
  });
}

function counterHtml(trophy, state) {
  const c = trophy.counter;
  if (!c) return '';
  const value = state.counters[trophy.id] ?? 0;
  const step = c.step ?? 1;
  const progress = c.total
    ? `<span class="counter-progress">${value.toLocaleString('en-US')} of ${c.total.toLocaleString('en-US')}</span>`
    : `<span class="counter-progress">${value.toLocaleString('en-US')} — count as you go</span>`;
  const stated = c.totalSource === 'tracker'
    ? ' <span class="counter-note">tracker-stated total — see the unconfirmed note above</span>'
    : '';
  return `<div class="counter-widget">
    <p class="detail-label">Your count — ${esc(c.label)}${stated}</p>
    <div class="counter-row">
      <button type="button" class="counter-btn" data-counter="${trophy.id}" data-delta="${-step}" aria-label="Decrease count">−</button>
      ${progress}
      <button type="button" class="counter-btn" data-counter="${trophy.id}" data-delta="${step}" aria-label="Increase count">+</button>
    </div>
  </div>`;
}

function uncertaintyHtml(trophy) {
  const u = trophy.uncertainty;
  if (!u) return '';
  const label = u.kind === 'total' ? 'TOTAL UNCONFIRMED' : 'TRIGGER UNCONFIRMED';
  return `<div class="uncertainty-note"><p><strong>${label}.</strong> ${esc(u.text)} ${citeMarks(u.cite ?? [])}</p></div>`;
}

export function renderDetail(doc, state, handlers, root) {
  const panel = root.querySelector('#detail');
  const trophy = doc.trophies.find((t) => t.id === state.selectedId);
  if (!trophy) {
    panel.innerHTML = `<h2>All 55 earned</h2>
      <p>Every trophy on the official list is ticked off. The platinum — Vice Got a Price! — is awarded automatically once the other 54 are earned, so a full list means the run is done.</p>`;
    return;
  }
  if (isSpoilerHidden(trophy, state)) {
    panel.innerHTML = `<h2>Hidden story trophy</h2>
      <p>Spoiler mode is on, so this story trophy's name, description and guide stay hidden until you earn it. Tick it in the list once you have, and everything about it is revealed.</p>
      <p>${tagsHtml(trophy)}</p>`;
    return;
  }
  const earned = state.earned.has(trophy.id);
  const byN = new Map(doc.sources.map((s) => [s.n, s]));
  const cites = citesOf(trophy);
  panel.innerHTML = `<p class="detail-tags">${tagsHtml(trophy, doc)}</p>
    <h2>${esc(trophy.name)}</h2>
    <p class="detail-label">Official description</p>
    <p class="detail-desc">“${esc(trophy.description)}”</p>
    ${trophy.watch ? `<p class="watch-note tier-${trophy.watch.tier}">⚑ <strong>${trophy.watch.tier === 'possibly' ? 'Possibly missable.' : 'Watch.'}</strong> ${esc(trophy.watch.reason)} ${citeMarks(trophy.watch.cite ?? [])}</p>` : ''}
    ${uncertaintyHtml(trophy)}
    ${counterHtml(trophy, state)}
    <p class="detail-label">Guide — step by step</p>
    <ol class="steps">${(trophy.steps ?? []).map((step) => `<li>${esc(step.text)} ${citeMarks(step.cite ?? [])}</li>`).join('')}</ol>
    <p class="detail-label">Sources for this guide</p>
    <p class="detail-sources">${cites.map((n) => `[${n}] ${esc(byN.get(n)?.name ?? '')}`).join(' · ')}</p>
    <button type="button" class="earn-btn" data-toggle="${trophy.id}">${earned ? '✓ Earned — tap to undo' : 'Mark as earned'}</button>`;
  panel.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => handlers.onToggle(Number(btn.dataset.toggle)));
  });
  panel.querySelectorAll('[data-counter]').forEach((btn) => {
    btn.addEventListener('click', () => handlers.onCounter(Number(btn.dataset.counter), Number(btn.dataset.delta)));
  });
}

// The right pane: the NEXT UP list (the next three unearned trophies in roadmap
// order) above the sources for the open guide, each with the number of that
// guide's steps citing it. The full numbered list is one click away, in the
// Source matrix tab.
export function renderSidePanel(doc, state, handlers, root) {
  const panel = root.querySelector('#sources-panel');
  const byN = new Map(doc.sources.map((s) => [s.n, s]));
  const up = nextUpList(doc, state.earned, 3);
  const nextHtml = up.length
    ? `<ol class="nextup-list">${up.map((trophy) => `<li>
        <button type="button" class="nextup-item" data-select="${trophy.id}">
          <span class="nextup-stage">S${stageOf(doc, trophy.id)}</span>
          <span class="nextup-name">${esc(displayName(trophy, state))}</span>
          <span class="nextup-desc">${esc(displayDescription(trophy, state))}</span>
        </button>
      </li>`).join('')}</ol>`
    : '<p class="side-note">Nothing — all 55 trophies are earned. The platinum is yours.</p>';

  const trophy = doc.trophies.find((t) => t.id === state.selectedId);
  let guideHtml;
  if (!trophy) {
    guideHtml = '<p class="side-note">No guide is open.</p>';
  } else if (isSpoilerHidden(trophy, state)) {
    guideHtml = '<p class="side-note">The open guide is a hidden story trophy; its sources are revealed when it is earned.</p>';
  } else {
    const counts = guideSourceCounts(trophy);
    const stepTotal = (trophy.steps ?? []).length;
    guideHtml = `<p class="side-guide-name">${esc(trophy.name)} — ${stepTotal} steps</p>` +
      [...counts.entries()].sort((a, b) => a[0] - b[0]).map(([n, count]) => {
        const s = byN.get(n);
        return `<div class="source-block">
          <p class="source-head"><span class="cite">[${n}]</span> <strong>${esc(s?.name ?? '')}</strong></p>
          <p class="source-url">${esc(s?.url ?? '')}</p>
          <p class="source-meta">cited in ${count} of this guide's ${stepTotal} steps · ${esc(s?.kind ?? '')}</p>
        </div>`;
      }).join('');
  }

  panel.innerHTML = `<h2 class="panel-title">Next up</h2>
    ${nextHtml}
    <h2 class="panel-title panel-title-second">Sources for this guide</h2>
    ${guideHtml}
    <button type="button" class="matrix-btn" data-view="matrix">All ${doc.sources.length} sources &amp; who cites them → Source matrix</button>`;
  panel.querySelectorAll('[data-select]').forEach((btn) => {
    btn.addEventListener('click', () => handlers.onSelect(Number(btn.dataset.select)));
  });
  panel.querySelector('[data-view]')?.addEventListener('click', () => handlers.onView('matrix'));
}

// A stage's detail line, computed from its trophies: how many there are, how
// many are earned, which story chapters their official descriptions name, and
// how many carry a progress counter.
export function phaseDetail(doc, phase, earned) {
  const byId = new Map(doc.trophies.map((t) => [t.id, t]));
  const trophies = phase.trophyIds.map((id) => byId.get(id)).filter(Boolean);
  const chapters = new Set();
  for (const trophy of trophies) {
    const m = /Chapter (\d+)/.exec(trophy.description);
    if (m) chapters.add(Number(m[1]));
  }
  const chapterList = [...chapters].sort((a, b) => a - b);
  const counters = trophies.filter((t) => t.counter).length;
  const got = trophies.filter((t) => earned.has(t.id)).length;
  const parts = [`${trophies.length} trophies`, `${got} earned`];
  if (chapterList.length === 1) parts.push(`Chapter ${chapterList[0]}`);
  if (chapterList.length > 1) parts.push(`Chapters ${chapterList.join(', ')}`);
  if (counters) parts.push(`${counters} progress counter${counters > 1 ? 's' : ''}`);
  return parts.join(' · ');
}

export function renderRoadmap(doc, state, handlers, root) {
  const byId = new Map(doc.trophies.map((t) => [t.id, t]));
  root.querySelector('#stage-chips').innerHTML = doc.roadmap.map((phase) => {
    const got = phase.trophyIds.filter((id) => state.earned.has(id)).length;
    return `<button type="button" class="stage-chip" data-stage="${phase.phase}">S${phase.phase} <strong>${got}/${phase.trophyIds.length}</strong></button>`;
  }).join('');
  root.querySelectorAll('#stage-chips [data-stage]').forEach((chip) => {
    chip.addEventListener('click', () => {
      root.querySelector(`#phase-${chip.dataset.stage}`)?.scrollIntoView({ block: 'start' });
    });
  });

  const flagged = doc.trophies.filter((t) => t.watch);
  const a = computeAudit(doc);
  root.querySelector('#missable-watch').innerHTML = `<article class="watch-panel">
    <header><h3>Missable watch — ${a.possibly} possibly missable · ${a.watch} watch</h3></header>
    <p>The only trophies on the list that can be lost. Everything else can be earned in free roam after the story.</p>
    <ul class="watch-items">${flagged.map((t) => `<li>
      <button type="button" data-jump="${t.id}">${esc(displayName(t, state))}</button>
      ${watchTag(t)} <span class="watch-reason">${esc(t.watch.reason)}</span>
    </li>`).join('')}</ul>
  </article>`;

  const wrap = root.querySelector('#roadmap');
  wrap.innerHTML = doc.roadmap.map((phase) => {
    const trophies = phase.trophyIds.map((id) => byId.get(id));
    const got = trophies.filter((t) => state.earned.has(t.id)).length;
    const chips = trophies.map((trophy) => {
      const earned = state.earned.has(trophy.id);
      return `<button type="button" class="phase-chip${earned ? ' earned' : ''}" data-jump="${trophy.id}">
        <span class="dot grade-${trophy.grade}"></span>${esc(displayName(trophy, state))}${trophy.watch ? ' <span class="chip-flag">⚑</span>' : ''}
      </button>`;
    }).join('');
    return `<article class="phase" id="phase-${phase.phase}">
      <header><h3><span class="phase-num">Stage S${phase.phase}</span> ${esc(phase.title)}</h3>
      <span class="phase-progress">${got}/${trophies.length} earned</span></header>
      <p class="phase-detail">${esc(phaseDetail(doc, phase, state.earned))}</p>
      <p>${esc(phase.rationale)}</p>
      <div class="phase-chips">${chips}</div>
    </article>`;
  }).join('');
  wrap.querySelectorAll('[data-jump]').forEach((chip) => {
    chip.addEventListener('click', () => handlers.onJump(Number(chip.dataset.jump)));
  });
  root.querySelectorAll('#missable-watch [data-jump]').forEach((btn) => {
    btn.addEventListener('click', () => handlers.onJump(Number(btn.dataset.jump)));
  });
}

export function renderMatrix(doc, state, handlers, root) {
  const a = computeAudit(doc);
  root.querySelector('#source-matrix').innerHTML = doc.sources.map((s) => {
    const citing = doc.trophies.filter((t) => citesOf(t).includes(s.n));
    return `<article class="matrix-row">
      <header><h3><span class="cite">[${s.n}]</span> ${esc(s.name)}</h3>
      <span class="matrix-count">cited by ${a.perSource.get(s.n) ?? 0} of ${a.total} guides</span></header>
      <p class="source-url">${esc(s.url)}</p>
      <p class="source-meta">${esc(s.kind)} · read ${esc(s.read)} · ${esc(s.scope)}</p>
      <p class="matrix-trophies">${citing.map((t) => `<button type="button" class="matrix-link" data-jump="${t.id}">${esc(displayName(t, state))}</button>`).join(' ')}</p>
    </article>`;
  }).join('');
  root.querySelectorAll('#source-matrix [data-jump]').forEach((btn) => {
    btn.addEventListener('click', () => handlers.onJump(Number(btn.dataset.jump)));
  });
}
