const FILTER_FIELDS = [
  { key: 'location', label: 'Location' },
  { key: 'projectArea', label: 'Project / SDG' },
  { key: 'impactFramework', label: 'Impact Area Framework' },
  { key: 'year', label: 'Year' },
];

let ALL_RESOURCES = [];
let ACTIVE_FILTERS = { location: new Set(), projectArea: new Set(), impactFramework: new Set(), year: new Set() };

// ---------- Viewer gate ----------

async function checkViewerGate() {
  try {
    const res = await fetch('/.netlify/functions/site-config');
    const cfg = await res.json();
    if (cfg.viewerGateEnabled && sessionStorage.getItem('cote_viewer_ok') !== '1') {
      document.getElementById('viewerGate').classList.remove('hidden');
    } else {
      init();
    }
  } catch (e) {
    // If the function isn't reachable (e.g. local file preview), skip the gate.
    init();
  }
}

async function submitViewerPassword() {
  const password = document.getElementById('viewerPassword').value;
  const errorEl = document.getElementById('viewerError');
  errorEl.textContent = '';
  try {
    const res = await fetch('/.netlify/functions/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'viewer', password }),
    });
    const data = await res.json();
    if (data.ok) {
      sessionStorage.setItem('cote_viewer_ok', '1');
      document.getElementById('viewerGate').classList.add('hidden');
      init();
    } else {
      errorEl.textContent = 'Incorrect password. Please try again.';
    }
  } catch (e) {
    errorEl.textContent = 'Could not verify password. Please try again shortly.';
  }
}

// ---------- Data + rendering ----------

async function init() {
  const res = await fetch('data/resources.json');
  ALL_RESOURCES = await res.json();
  buildFilterBar();
  renderTiles();
  if (typeof initResults === 'function') initResults();
}

function buildFilterBar() {
  const bar = document.getElementById('filterBar');
  FILTER_FIELDS.forEach(field => {
    const values = Array.from(new Set(ALL_RESOURCES.flatMap(r => r[field.key] || []))).sort();
    const wrap = document.createElement('div');
    wrap.className = 'dropdown';
    wrap.innerHTML = `
      <button class="dropdown-btn" id="btn-${field.key}" onclick="toggleDropdown('${field.key}')">
        ${field.label} <span class="count hidden" id="count-${field.key}"></span>
      </button>
      <div class="dropdown-panel" id="panel-${field.key}">
        ${values.map(v => `
          <label>
            <input type="checkbox" value="${v}" onchange="toggleFilter('${field.key}', '${v}', this.checked)">
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
  clearBtn.onclick = clearAllFilters;
  bar.appendChild(clearBtn);

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-panel.open').forEach(p => p.classList.remove('open'));
    }
  });
}

function toggleDropdown(key) {
  const panel = document.getElementById(`panel-${key}`);
  const isOpen = panel.classList.contains('open');
  document.querySelectorAll('.dropdown-panel.open').forEach(p => p.classList.remove('open'));
  if (!isOpen) panel.classList.add('open');
}

function toggleFilter(key, value, checked) {
  if (checked) ACTIVE_FILTERS[key].add(value);
  else ACTIVE_FILTERS[key].delete(value);

  const btn = document.getElementById(`btn-${key}`);
  const countEl = document.getElementById(`count-${key}`);
  const n = ACTIVE_FILTERS[key].size;
  if (n > 0) {
    btn.classList.add('active');
    countEl.textContent = n;
    countEl.classList.remove('hidden');
  } else {
    btn.classList.remove('active');
    countEl.classList.add('hidden');
  }
  renderTiles();
}

function clearAllFilters() {
  FILTER_FIELDS.forEach(f => ACTIVE_FILTERS[f.key].clear());
  document.querySelectorAll('.dropdown-panel input[type="checkbox"]').forEach(cb => cb.checked = false);
  document.querySelectorAll('.dropdown-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.count').forEach(c => c.classList.add('hidden'));
  renderTiles();
}

function matchesFilters(resource) {
  return FILTER_FIELDS.every(f => {
    const active = ACTIVE_FILTERS[f.key];
    if (active.size === 0) return true;
    const values = resource[f.key] || [];
    return values.some(v => active.has(v));
  });
}

function renderTiles() {
  const grid = document.getElementById('tileGrid');
  const empty = document.getElementById('emptyState');
  const filtered = ALL_RESOURCES.filter(matchesFilters);

  document.getElementById('resultsCount').textContent =
    filtered.length === ALL_RESOURCES.length ? 'All resources' : `${filtered.length} of ${ALL_RESOURCES.length} resources`;

  grid.innerHTML = '';
  if (filtered.length === 0) {
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  filtered.forEach(r => {
    const a = document.createElement('a');
    a.className = 'tile';
    a.href = r.link;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';

    const tags = [
      ...(r.location || []).map(v => `<span class="stamp-tag">${v}</span>`),
      ...(r.projectArea || []).map(v => `<span class="stamp-tag">${v}</span>`),
      ...(r.impactFramework || []).map(v => `<span class="stamp-tag">${v}</span>`),
      ...(r.year || []).map(v => `<span class="stamp-tag year">${v}</span>`),
    ].join('');

    const iconHTML = r.image
      ? `<img src="${r.image}" alt="">`
      : iconSVG(r.icon);

    a.innerHTML = `
      <div class="tile-icon">${iconHTML}</div>
      <h3>${r.title}</h3>
      <p class="desc">${r.description || ''}</p>
      <div class="tile-tags">${tags}</div>
    `;
    grid.appendChild(a);
  });
}

checkViewerGate();
