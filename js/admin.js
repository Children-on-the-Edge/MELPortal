let ALL_RESOURCES = [];
const CATEGORY_KEYS = ['location', 'projectArea', 'impactFramework', 'year'];
const KNOWN_VALUES = { location: new Set(), projectArea: new Set(), impactFramework: new Set(), year: new Set() };
const SELECTED = { location: new Set(), projectArea: new Set(), impactFramework: new Set(), year: new Set() };
let selectedIcon = 'form';
let adminPasswordCache = '';

// ---------- Admin gate ----------

async function submitAdminPassword() {
  const password = document.getElementById('adminPassword').value;
  const errorEl = document.getElementById('adminError');
  errorEl.textContent = '';
  try {
    const res = await fetch('/.netlify/functions/verify-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'admin', password }),
    });
    const data = await res.json();
    if (data.ok) {
      adminPasswordCache = password;
      document.getElementById('fPasswordConfirm').value = password;
      document.getElementById('adminGate').classList.add('hidden');
      document.getElementById('adminContent').classList.remove('hidden');
      loadResources();
    } else {
      errorEl.textContent = 'Incorrect password. Please try again.';
    }
  } catch (e) {
    errorEl.textContent = 'Could not verify password right now. Please try again shortly.';
  }
}

// ---------- Load + render existing resources ----------

async function loadResources() {
  const res = await fetch('data/resources.json?t=' + Date.now());
  ALL_RESOURCES = await res.json();
  CATEGORY_KEYS.forEach(k => {
    KNOWN_VALUES[k] = new Set(ALL_RESOURCES.flatMap(r => r[k] || []));
  });
  renderIconGrid();
  renderTagEditors();
  renderExistingList();
}

function renderIconGrid() {
  const grid = document.getElementById('iconGrid');
  grid.innerHTML = ICON_KEYS.map(key => `
    <div class="icon-choice ${key === selectedIcon ? 'selected' : ''}" data-key="${key}" onclick="selectIcon('${key}')">
      ${iconSVG(key)}
    </div>
  `).join('');
}

function selectIcon(key) {
  selectedIcon = key;
  document.querySelectorAll('.icon-choice').forEach(el => {
    el.classList.toggle('selected', el.dataset.key === key);
  });
}

function renderTagEditors() {
  CATEGORY_KEYS.forEach(key => {
    const container = document.getElementById('tag' + capitalize(key));
    const values = Array.from(KNOWN_VALUES[key]).sort();
    container.innerHTML = values.map(v => `
      <span class="stamp-tag ${SELECTED[key].has(v) ? 'selected' : ''}" data-value="${v}" onclick="toggleTag('${key}', '${v}')">${v}</span>
    `).join('') || '<span style="font-size:12.5px;color:var(--ink-soft);">No options yet — add one below</span>';
  });
}

function toggleTag(key, value) {
  if (SELECTED[key].has(value)) SELECTED[key].delete(value);
  else SELECTED[key].add(value);
  renderTagEditors();
}

function addNewValue(key, inputId) {
  const input = document.getElementById(inputId);
  const value = input.value.trim();
  if (!value) return;
  KNOWN_VALUES[key].add(value);
  SELECTED[key].add(value);
  input.value = '';
  renderTagEditors();
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function renderExistingList() {
  const list = document.getElementById('existingList');
  if (ALL_RESOURCES.length === 0) {
    list.innerHTML = '<p style="font-size:13px;color:var(--ink-soft);">No resources added yet.</p>';
    return;
  }
  list.innerHTML = ALL_RESOURCES.map(r => `
    <div class="existing-row">
      <div class="tile-icon">${r.image ? `<img src="${r.image}" alt="">` : iconSVG(r.icon)}</div>
      <div class="info">
        <strong>${r.title}</strong>
        <span>${(r.location || []).join(', ') || 'No location set'}</span>
      </div>
      <button class="edit-btn" onclick="loadForEdit('${r.id}')">Edit</button>
      <button class="delete-btn" onclick="deleteResource('${r.id}')">Delete</button>
    </div>
  `).join('');
}

function loadForEdit(id) {
  const r = ALL_RESOURCES.find(x => x.id === id);
  if (!r) return;
  document.getElementById('formTitle').textContent = 'Edit resource';
  document.getElementById('editingId').value = r.id;
  document.getElementById('fTitle').value = r.title || '';
  document.getElementById('fDescription').value = r.description || '';
  document.getElementById('fLink').value = r.link || '';
  document.getElementById('fImage').value = r.image || '';
  selectedIcon = r.icon || 'form';
  CATEGORY_KEYS.forEach(k => {
    SELECTED[k] = new Set(r[k] || []);
  });
  renderIconGrid();
  renderTagEditors();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  document.getElementById('formTitle').textContent = 'Add a resource';
  document.getElementById('editingId').value = '';
  document.getElementById('fTitle').value = '';
  document.getElementById('fDescription').value = '';
  document.getElementById('fLink').value = '';
  document.getElementById('fImage').value = '';
  selectedIcon = 'form';
  CATEGORY_KEYS.forEach(k => SELECTED[k].clear());
  renderIconGrid();
  renderTagEditors();
  document.getElementById('saveStatus').textContent = '';
}

// ---------- Save / Delete ----------

async function saveResource() {
  const statusEl = document.getElementById('saveStatus');
  statusEl.className = 'status-msg';
  statusEl.textContent = 'Saving...';

  const title = document.getElementById('fTitle').value.trim();
  const link = document.getElementById('fLink').value.trim();
  if (!title || !link) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Title and link are required.';
    return;
  }

  const editingId = document.getElementById('editingId').value;
  const password = document.getElementById('fPasswordConfirm').value || adminPasswordCache;

  const resource = {
    id: editingId || 'r' + Date.now().toString(36),
    title,
    description: document.getElementById('fDescription').value.trim(),
    link,
    icon: selectedIcon,
    image: document.getElementById('fImage').value.trim() || undefined,
    location: Array.from(SELECTED.location),
    projectArea: Array.from(SELECTED.projectArea),
    impactFramework: Array.from(SELECTED.impactFramework),
    year: Array.from(SELECTED.year),
  };

  try {
    const res = await fetch('/.netlify/functions/manage-resource', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: editingId ? 'update' : 'add',
        password,
        resource,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      statusEl.className = 'status-msg success';
      statusEl.textContent = 'Saved. It will appear on the portal shortly.';
      resetForm();
      setTimeout(loadResources, 1500);
    } else {
      statusEl.className = 'status-msg error';
      statusEl.textContent = data.error || 'Could not save. Check the admin password and try again.';
    }
  } catch (e) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Network error — please try again.';
  }
}

async function deleteResource(id) {
  if (!confirm('Delete this resource? This cannot be undone.')) return;
  const password = adminPasswordCache;
  try {
    const res = await fetch('/.netlify/functions/manage-resource', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', password, resource: { id } }),
    });
    const data = await res.json();
    if (data.ok) {
      loadResources();
    } else {
      alert(data.error || 'Could not delete resource.');
    }
  } catch (e) {
    alert('Network error — please try again.');
  }
}
