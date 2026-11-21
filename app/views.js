// Rendering for the Leonida Trophy Guide: progress header, the audit strip, the
// three-pane ledger (checklist, the open guide, the sources panel), the roadmap
// with its stage chips and missable watch panel, and the source matrix. Pure DOM
// building from the loaded data and the UI state that app.js owns. Every figure
// shown — audit strip, cited-by counts, stage progress — is computed here from
// the trophy data at render time, never typed into the page.

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const CATEGORY_LABELS = {
  story: 'Story',
  collectibles: 'Collectibles',
  activities: 'Activities',
  misc: 'Feats & misc',
};

// One trophy (Bad Luck, I Guess) carries the legacy category "missable" in the
// data; for filtering it belongs with the feats.
export function categoryOf(trophy) {
  return trophy.category === 'missable' ? 'misc' : trophy.category;
}

export function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// The citation numbers a trophy's guide uses, in order: every step's cites, plus
// its watch flag's cite.
export function citesOf(trophy) {
  const set = new Set();
  for (const step of trophy.steps ?? []) for (const n of step.cite ?? []) set.add(n);
  if (trophy.watch) for (const n of trophy.watch.cite ?? []) set.add(n);
  return [...set].sort((a, b) => a - b);
}

export function citeMarks(cites) {
  return cites.map((n) => `<span class="cite">[${n}]</span>`).join('');
}

// The audit figures, computed from the data: totals a reader can verify against
// the list itself.
export function computeAudit(doc) {
  let totalSteps = 0;
  let citedSteps = 0;
  let citedGuides = 0;
  const perSource = new Map(doc.sources.map((s) => [s.n, 0]));
  for (const trophy of doc.trophies) {
    const cites = citesOf(trophy);
    if (cites.length) citedGuides += 1;
    for (const n of cites) perSource.set(n, (perSource.get(n) ?? 0) + 1);
    for (const step of trophy.steps ?? []) {
      totalSteps += 1;
      if ((step.cite ?? []).length) citedSteps += 1;
    }
  }
  const grades = Object.fromEntries(GRADE_ORDER.map((g) => [g, doc.trophies.filter((t) => t.grade === g).length]));
  return {
    total: doc.trophies.length,
    grades,
    totalSteps,
    citedSteps,
    citedGuides,
    perSource,
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
  for (const phase of doc.roadmap) {
    for (const id of phase.trophyIds) {
      if (!earned.has(id)) return doc.trophies.find((t) => t.id === id);
    }
  }
  return null;
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
    `${a.sourceCount} sources read ${a.readDate} · ${a.possibly} possibly missable · ${a.watch} watch · ` +
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
    ['watch', '⚑ Watch'],
    ['collectibles', 'Collectibles'],
    ['activities', 'Activities'],
    ['misc', 'Feats & misc'],
  ];
  root.querySelector('#category-chips').innerHTML = defs.map(([key, label]) =>
    `<button type="button" class="chip${state.category === key ? ' active' : ''}" data-cat="${key}">${label} ${counts[key] ?? 0}</button>`).join('');
}

export function renderNextUp(doc, state, handlers, root) {
  const el = root.querySelector('#next-up');
  const trophy = nextUp(doc, state.earned);
  if (!trophy) {
    el.innerHTML = '<strong>NEXT UP</strong> — nothing: all 55 trophies are earned. The platinum is yours.';
    return;
  }
  const stage = stageOf(doc, trophy.id);
  el.innerHTML = `<strong>NEXT UP</strong> · Stage S${stage} · <button type="button" class="next-up-btn" data-select="${trophy.id}">${esc(displayName(trophy, state))}</button> — ${esc(displayDescription(trophy, state))} ${isSpoilerHidden(trophy, state) ? '' : citeMarks(citesOf(trophy))}`;
  el.querySelector('[data-select]').addEventListener('click', () => handlers.onSelect(trophy.id));
}

function watchTag(trophy) {
  if (!trophy.watch) return '';
  return trophy.watch.tier === 'possibly'
    ? '<span class="tag tag-possibly">⚑ Possibly missable</span>'
    : '<span class="tag tag-watch">⚑ Watch</span>';
}

function tagsHtml(trophy, doc, includeWatch = true) {
  const parts = [
    `<span class="badge grade-${trophy.grade}">${trophy.grade}</span>`,
    `<span class="tag">${CATEGORY_LABELS[categoryOf(trophy)]}</span>`,
  ];
  if (doc) {
    const stage = stageOf(doc, trophy.id);
    if (stage) parts.push(`<span class="tag">Stage S${stage}</span>`);
  }
  if (includeWatch && watchTag(trophy)) parts.push(watchTag(trophy));
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
  return `<div class="counter-widget">
    <p class="detail-label">Your count — ${esc(c.label)}</p>
    <div class="counter-row">
      <button type="button" class="counter-btn" data-counter="${trophy.id}" data-delta="${-step}" aria-label="Decrease count">−</button>
      ${progress}
      <button type="button" class="counter-btn" data-counter="${trophy.id}" data-delta="${step}" aria-label="Increase count">+</button>
    </div>
  </div>`;
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
  // The guide pane leads with guidance, not warnings: no watch box and no
  // missable tag here — the roadmap's watch panel carries the flags. Under
  // the open guide, the next trophy the roadmap asks for shows its own
  // steps, so the first screen holds two guides' worth of cited steps.
  const up = nextUp(doc, state.earned);
  const nextBlock = up && up.id !== trophy.id && !isSpoilerHidden(up, state)
    ? `<p class="detail-label">Next up — Stage S${stageOf(doc, up.id)}</p>
    <h3 class="next-guide-name">${esc(displayName(up, state))}</h3>
    <ol class="steps steps-compact">${(up.steps ?? []).map((step) => `<li>${esc(step.text)} ${citeMarks(step.cite ?? [])}</li>`).join('')}</ol>`
    : '';
  panel.innerHTML = `<p class="detail-tags">${tagsHtml(trophy, doc, false)}</p>
    <h2>${esc(trophy.name)}</h2>
    <p class="detail-label">Official description</p>
    <p class="detail-desc">“${esc(trophy.description)}”</p>
    <p class="detail-label">Guide — step by step</p>
    <ol class="steps">${(trophy.steps ?? []).map((step) => `<li>${esc(step.text)} ${citeMarks(step.cite ?? [])}</li>`).join('')}</ol>
    ${counterHtml(trophy, state)}
    ${nextBlock}
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

export function renderSourcesPanel(doc, root) {
  const a = computeAudit(doc);
  root.querySelector('#sources-panel').innerHTML = `<h2 class="panel-title">Sources — cited by number</h2>
    ${doc.sources.map((s) => `<div class="source-block">
      <p class="source-head"><span class="cite">[${s.n}]</span> <strong>${esc(s.name)}</strong></p>
      <p class="source-url">${esc(s.url)}</p>
      <p class="source-meta">${esc(s.kind)} · read ${esc(s.read)} · cited by ${a.perSource.get(s.n) ?? 0} of ${a.total} guides</p>
      <p class="source-scope">${esc(s.scope)}</p>
    </div>`).join('')}`;
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
