// Rendering for the Leonida Trophy Guide: progress header, the tracker list, the guide
// detail panel and the roadmap. Pure DOM building from the loaded data and the UI state
// that app.js owns; every function here takes the data and state and paints one region.

export const GRADE_ORDER = ['platinum', 'gold', 'silver', 'bronze'];

export const CATEGORY_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  misc: 'Feat / misc',
};

export function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

// Spoiler mode hides a story trophy's name, description and guide until it is earned.
export function isSpoilerHidden(trophy, state) {
  return state.spoiler && trophy.category === 'story' && !state.earned.has(trophy.id);
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
  if (state.category === 'missable' && !trophy.missable) return false;
  if (state.category !== 'all' && state.category !== 'missable' && trophy.category !== state.category) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.hideEarned && state.earned.has(trophy.id)) return false;
  if (state.query) {
    const hay = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
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
    return `<li><span class="dot grade-${grade}"></span>${grade[0].toUpperCase() + grade.slice(1)} <strong>${got}/${ofGrade.length}</strong></li>`;
  }).join('');
}

function tagsHtml(trophy) {
  const parts = [`<span class="badge grade-${trophy.grade}">${trophy.grade}</span>`];
  parts.push(`<span class="tag">${CATEGORY_LABELS[trophy.category]}</span>`);
  if (trophy.missable) parts.push('<span class="tag tag-missable">⚑ Missable</span>');
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
        ${hidden ? '' : `<span class="row-guide-hint">${esc(trophy.guide.split('. ')[0])}.</span>`}
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

export function renderDetail(doc, state, handlers, root) {
  const panel = root.querySelector('#detail');
  const trophy = doc.trophies.find((t) => t.id === state.selectedId);
  if (!trophy) {
    const flagged = doc.trophies.filter((t) => t.missable);
    panel.innerHTML = `<h2>Pick a trophy</h2>
      <p>Select any trophy in the list to read its guide here: what it asks, the sensible way to earn it, and the source its facts come from.</p>
      <h3>Missable watch-list (${flagged.length})</h3>
      <ul class="watch-list">${flagged.map((t) => `<li><button type="button" data-select="${t.id}">⚑ ${esc(t.name)}</button></li>`).join('')}</ul>
      <p class="detail-note">A trophy is flagged missable only where its official description ties it to a one-time opportunity — a stranger strand's finale, or an event that demands a specific outcome. The full rule is in the footer.</p>`;
  } else if (isSpoilerHidden(trophy, state)) {
    panel.innerHTML = `<h2>Hidden story trophy</h2>
      <p>Spoiler mode is on, so this story trophy's name, description and guide stay hidden until you earn it. Tick it in the list once you have, and everything about it is revealed.</p>
      <p>${tagsHtml(trophy)}</p>`;
  } else {
    const earned = state.earned.has(trophy.id);
    panel.innerHTML = `<p class="detail-tags">${tagsHtml(trophy)}</p>
      <h2>${esc(trophy.name)}</h2>
      <p class="detail-label">Official description</p>
      <p class="detail-desc">“${esc(trophy.description)}”</p>
      ${trophy.missable ? `<p class="missable-note">⚑ <strong>Missable.</strong> ${esc(trophy.missableNote ?? '')}</p>` : ''}
      <p class="detail-label">Guide</p>
      <p class="detail-guide">${esc(trophy.guide)}</p>
      <p class="detail-label">Source</p>
      <p class="detail-source">${esc(trophy.source)}</p>
      <button type="button" class="earn-btn" data-toggle="${trophy.id}">${earned ? '✓ Earned — tap to undo' : 'Mark as earned'}</button>`;
  }
  panel.querySelectorAll('[data-select]').forEach((btn) => {
    btn.addEventListener('click', () => handlers.onSelect(Number(btn.dataset.select)));
  });
  panel.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => handlers.onToggle(Number(btn.dataset.toggle)));
  });
}

export function renderRoadmap(doc, state, handlers, root) {
  const wrap = root.querySelector('#roadmap');
  const byId = new Map(doc.trophies.map((t) => [t.id, t]));
  wrap.innerHTML = doc.roadmap.map((phase) => {
    const trophies = phase.trophyIds.map((id) => byId.get(id));
    const got = trophies.filter((t) => state.earned.has(t.id)).length;
    const chips = trophies.map((trophy) => {
      const earned = state.earned.has(trophy.id);
      return `<button type="button" class="phase-chip${earned ? ' earned' : ''}" data-jump="${trophy.id}">
        <span class="dot grade-${trophy.grade}"></span>${esc(displayName(trophy, state))}${trophy.missable ? ' <span class="chip-flag">⚑</span>' : ''}
      </button>`;
    }).join('');
    return `<article class="phase">
      <header><h3><span class="phase-num">Phase ${phase.phase}</span> ${esc(phase.title)}</h3>
      <span class="phase-progress">${got}/${trophies.length} earned</span></header>
      <p>${esc(phase.rationale)}</p>
      <div class="phase-chips">${chips}</div>
    </article>`;
  }).join('');
  wrap.querySelectorAll('[data-jump]').forEach((chip) => {
    chip.addEventListener('click', () => handlers.onJump(Number(chip.dataset.jump)));
  });
}
