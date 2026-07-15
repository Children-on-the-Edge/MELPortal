const RESULT_FILTER_FIELDS = [
  { key: 'location', label: 'Location' },
  { key: 'projectArea', label: 'Project / SDG' },
  { key: 'impactFramework', label: 'Impact Area Framework' },
  { key: 'year', label: 'Year' },
];

let ALL_RESULTS = [];
let ACTIVE_RESULT_FILTERS = { location: new Set(), projectArea: new Set(), impactFramework: new Set(), year: new Set() };

// Converts a normal Google Sheets share link into an embeddable preview URL.
// Returns null if the link doesn't look like a Google Sheets URL (falls back to no-preview state).
function sheetEmbedUrl(link) {
  if (!link) return null;
  const match = link.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;
  return `https://docs.google.com/spreadsheets/d/${match[1]}/preview?widget=true&headers=false`;
}

async function initResults() {
  try {
    const res = await fetch('data/results.json');
    ALL_RESULTS = await res.json();
  } catch (e) {
    ALL_RESULTS = [];
  }
  buildResultsFilterBar();
  renderResultTiles();
}

function buildResultsFilterBar() {
  const bar = document.getElementById('resultsFilterBar');
  RESULT_FILTER_FIELDS.forEach(field => {
    const values = Array.from(new Set(ALL_RESULTS.flatMap(r => r[field.key] || []))).sort();
    const wrap = document.createElement('div');
    wrap.className = 'dropdown';
    wrap.innerHTML = `
      <button class="dropdown-btn" id="rbtn-${field.key}" onclick="toggleResultsDropdown('${field.key}')">
        ${field.label} <span class="count hidden" id="rcount-${field.key}"></span>
      </button>
      <div class="dropdown-panel" id="rpanel-${field.key}">
        ${values.map(v => `
          <label>
            <input type="checkbox" value="${v}" onchange="toggleResultsFilter('${field.key}', '${v}', this.checked)">
            ${v}
          </label>
        `).join('') || '<p style="font-size:13px;color:#4c6264;padding:6px 4px;">No options yet</p>'}
      </div>
    `;
    bar.appendChild(wrap);
  });
  const clearBtn = document.createElement('button');
  clearBtn.className = 'clear-filters';
  clearBtn.textContent = 'Clear all filters';
  clearBtn.onclick = clearAllResultsFilters;
  bar.appendChild(clearBtn);

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-panel.open').forEach(p => p.classList.remove('open'));
    }
  });
}

function toggleResultsDropdown(key) {
  const panel = document.getElementById(`rpanel-${key}`);
  const isOpen = panel.classList.contains('open');
  document.querySelectorAll('.dropdown-panel.open').forEach(p => p.classList.remove('open'));
  if (!isOpen) panel.classList.add('open');
}

function toggleResultsFilter(key, value, checked) {
  if (checked) ACTIVE_RESULT_FILTERS[key].add(value);
  else ACTIVE_RESULT_FILTERS[key].delete(value);

  const btn = document.getElementById(`rbtn-${key}`);
  const countEl = document.getElementById(`rcount-${key}`);
  const n = ACTIVE_RESULT_FILTERS[key].size;
  if (n > 0) {
    btn.classList.add('active');
    countEl.textContent = n;
    countEl.classList.remove('hidden');
  } else {
    btn.classList.remove('active');
    countEl.classList.add('hidden');
  }
  renderResultTiles();
}

function clearAllResultsFilters() {
  RESULT_FILTER_FIELDS.forEach(f => ACTIVE_RESULT_FILTERS[f.key].clear());
  document.querySelectorAll('#resultsFilterBar .dropdown-panel input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('#resultsFilterBar .dropdown-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('#resultsFilterBar .count').forEach(c => c.classList.add('hidden'));
  renderResultTiles();
}

function matchesResultFilters(result) {
  return RESULT_FILTER_FIELDS.every(f => {
    const active = ACTIVE_RESULT_FILTERS[f.key];
    if (active.size === 0) return true;
    const values = result[f.key] || [];
    return values.some(v => active.has(v));
  });
}

function renderResultTiles() {
  const grid = document.getElementById('resultsGrid');
  const empty = document.getElementById('resultsEmptyState');
  const filtered = ALL_RESULTS.filter(matchesResultFilters);

  document.getElementById('resultsSectionCount').textContent =
    filtered.length === ALL_RESULTS.length ? 'Results' : `Results — ${filtered.length} of ${ALL_RESULTS.length}`;

  grid.innerHTML = '';
  if (filtered.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  filtered.forEach(r => {
    const card = document.createElement('div');
    card.className = 'result-card';

    const tags = [
      ...(r.location || []).map(v => `<span class="stamp-tag">${v}</span>`),
      ...(r.projectArea || []).map(v => `<span class="stamp-tag">${v}</span>`),
      ...(r.impactFramework || []).map(v => `<span class="stamp-tag">${v}</span>`),
      ...(r.year || []).map(v => `<span class="stamp-tag year">${v}</span>`),
    ].join('');

    const embedSrc = sheetEmbedUrl(r.sheetUrl);
    const embedHTML = embedSrc
      ? `<iframe src="${embedSrc}" loading="lazy" title="${r.title} preview"></iframe>`
      : `<div class="no-preview">No live preview available for this link — use "Open full sheet" below.</div>`;

    card.innerHTML = `
      <h3>${r.title}</h3>
      <p class="desc">${r.description || ''}</p>
      <div class="result-embed">${embedHTML}</div>
      <div class="tile-tags">${tags}</div>
      <a class="result-open-link" href="${r.sheetUrl}" target="_blank" rel="noopener noreferrer">Open full sheet ↗</a>
    `;
    grid.appendChild(card);
  });
}
