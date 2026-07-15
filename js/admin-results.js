let ALL_RESULTS_ADMIN = [];
const RESULT_CATEGORY_KEYS = ['location', 'projectArea', 'impactFramework', 'year'];
const KNOWN_VALUES_R = { location: new Set(), projectArea: new Set(), impactFramework: new Set(), year: new Set() };
const SELECTED_R = { location: new Set(), projectArea: new Set(), impactFramework: new Set(), year: new Set() };

async function loadResults() {
  const res = await fetch('data/results.json?t=' + Date.now());
  ALL_RESULTS_ADMIN = await res.json();
  RESULT_CATEGORY_KEYS.forEach(k => {
    KNOWN_VALUES_R[k] = new Set(ALL_RESULTS_ADMIN.flatMap(r => r[k] || []));
  });
  renderTagEditorsR();
  renderExistingResultsList();
}

function renderTagEditorsR() {
  RESULT_CATEGORY_KEYS.forEach(key => {
    const container = document.getElementById('rTag' + capitalize(key));
    const values = Array.from(KNOWN_VALUES_R[key]).sort();
    container.innerHTML = values.map(v => `
      <span class="stamp-tag ${SELECTED_R[key].has(v) ? 'selected' : ''}" data-value="${v}" onclick="toggleTagR('${key}', '${v}')">${v}</span>
    `).join('') || '<span style="font-size:12.5px;color:var(--ink-soft);">No options yet — add one below</span>';
  });
}

function toggleTagR(key, value) {
  if (SELECTED_R[key].has(value)) SELECTED_R[key].delete(value);
  else SELECTED_R[key].add(value);
  renderTagEditorsR();
}

function addNewValueR(key, inputId) {
  const input = document.getElementById(inputId);
  const value = input.value.trim();
  if (!value) return;
  KNOWN_VALUES_R[key].add(value);
  SELECTED_R[key].add(value);
  input.value = '';
  renderTagEditorsR();
}

function renderExistingResultsList() {
  const list = document.getElementById('existingResultsList');
  if (ALL_RESULTS_ADMIN.length === 0) {
    list.innerHTML = '<p style="font-size:13px;color:var(--ink-soft);">No results added yet.</p>';
    return;
  }
  list.innerHTML = ALL_RESULTS_ADMIN.map(r => `
    <div class="existing-row">
      <div class="info">
        <strong>${r.title}</strong>
        <span>${(r.location || []).join(', ') || 'No location set'}</span>
      </div>
      <button class="edit-btn" onclick="loadForEditResult('${r.id}')">Edit</button>
      <button class="delete-btn" onclick="deleteResult('${r.id}')">Delete</button>
    </div>
  `).join('');
}

function loadForEditResult(id) {
  const r = ALL_RESULTS_ADMIN.find(x => x.id === id);
  if (!r) return;
  document.getElementById('resultFormTitle').textContent = 'Edit result';
  document.getElementById('rEditingId').value = r.id;
  document.getElementById('rTitle').value = r.title || '';
  document.getElementById('rDescription').value = r.description || '';
  document.getElementById('rSheetUrl').value = r.sheetUrl || '';
  RESULT_CATEGORY_KEYS.forEach(k => {
    SELECTED_R[k] = new Set(r[k] || []);
  });
  renderTagEditorsR();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetResultForm() {
  document.getElementById('resultFormTitle').textContent = 'Add a result';
  document.getElementById('rEditingId').value = '';
  document.getElementById('rTitle').value = '';
  document.getElementById('rDescription').value = '';
  document.getElementById('rSheetUrl').value = '';
  RESULT_CATEGORY_KEYS.forEach(k => SELECTED_R[k].clear());
  renderTagEditorsR();
  document.getElementById('rSaveStatus').textContent = '';
}

async function saveResult() {
  const statusEl = document.getElementById('rSaveStatus');
  statusEl.className = 'status-msg';
  statusEl.textContent = 'Saving...';

  const title = document.getElementById('rTitle').value.trim();
  const sheetUrl = document.getElementById('rSheetUrl').value.trim();
  if (!title || !sheetUrl) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Title and Google Sheet link are required.';
    return;
  }

  const editingId = document.getElementById('rEditingId').value;
  const password = document.getElementById('rPasswordConfirm').value || adminPasswordCache;

  const result = {
    id: editingId || 'res' + Date.now().toString(36),
    title,
    description: document.getElementById('rDescription').value.trim(),
    sheetUrl,
    location: Array.from(SELECTED_R.location),
    projectArea: Array.from(SELECTED_R.projectArea),
    impactFramework: Array.from(SELECTED_R.impactFramework),
    year: Array.from(SELECTED_R.year),
  };

  try {
    const res = await fetch('/.netlify/functions/manage-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: editingId ? 'update' : 'add',
        password,
        result,
      }),
    });
    const data = await res.json();
    if (data.ok) {
      statusEl.className = 'status-msg success';
      statusEl.textContent = 'Saved. It will appear on the portal shortly.';
      resetResultForm();
      setTimeout(loadResults, 1500);
    } else {
      statusEl.className = 'status-msg error';
      statusEl.textContent = data.error || 'Could not save. Check the admin password and try again.';
    }
  } catch (e) {
    statusEl.className = 'status-msg error';
    statusEl.textContent = 'Network error — please try again.';
  }
}

async function deleteResult(id) {
  if (!confirm('Delete this result? This cannot be undone.')) return;
  const password = adminPasswordCache;
  try {
    const res = await fetch('/.netlify/functions/manage-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', password, result: { id } }),
    });
    const data = await res.json();
    if (data.ok) {
      loadResults();
    } else {
      alert(data.error || 'Could not delete result.');
    }
  } catch (e) {
    alert('Network error — please try again.');
  }
}
