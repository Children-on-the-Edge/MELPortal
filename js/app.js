:root {
  /* Color tokens */
  --teal-deep: #0b4f52;
  --teal: #0f6e71;
  --teal-bright: #14a3a0;
  --coral: #f2643a;
  --coral-dark: #d94f28;
  --sand: #fbf6ee;
  --sand-card: #ffffff;
  --ink: #16292a;
  --ink-soft: #4c6264;
  --line: #dfe6e2;

  /* Type tokens */
  --font-display: 'Poppins', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;

  --radius: 14px;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--sand);
  color: var(--ink);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
}

a { color: inherit; }

/* ---------- Header ---------- */

.site-header {
  background: var(--teal-deep);
  color: white;
  padding: 22px 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--coral);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: 18px;
  color: white;
  flex-shrink: 0;
}

.brand-text h1 {
  font-family: var(--font-display);
  font-size: 20px;
  margin: 0;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.brand-text p {
  margin: 2px 0 0;
  font-size: 13px;
  color: #cfe8e6;
}

.header-links a {
  font-family: var(--font-mono);
  font-size: 12.5px;
  text-decoration: none;
  color: #cfe8e6;
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 20px;
  padding: 7px 14px;
  transition: background 0.15s ease, color 0.15s ease;
}

.header-links a:hover {
  background: rgba(255,255,255,0.12);
  color: white;
}

/* ---------- Filter bar ---------- */

.filter-bar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--sand);
  border-bottom: 1px solid var(--line);
  padding: 16px 28px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.filter-bar .filter-label {
  font-family: var(--font-mono);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  margin-right: 4px;
}

.dropdown {
  position: relative;
}

.dropdown-btn {
  font-family: var(--font-body);
  font-weight: 500;
  font-size: 13.5px;
  background: white;
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 8px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--ink);
}

.dropdown-btn.active {
  border-color: var(--teal-bright);
  color: var(--teal-deep);
}

.dropdown-btn .count {
  background: var(--coral);
  color: white;
  font-size: 11px;
  font-family: var(--font-mono);
  border-radius: 10px;
  padding: 1px 6px;
}

.dropdown-panel {
  display: none;
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  background: white;
  border: 1px solid var(--line);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(11, 79, 82, 0.12);
  padding: 10px;
  min-width: 200px;
  max-height: 260px;
  overflow-y: auto;
  z-index: 30;
}

.dropdown-panel.open { display: block; }

.dropdown-panel label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  padding: 6px 4px;
  border-radius: 6px;
  cursor: pointer;
}

.dropdown-panel label:hover { background: var(--sand); }

.dropdown-panel input[type="checkbox"] {
  accent-color: var(--teal-bright);
}

.clear-filters {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--coral-dark);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: underline;
  margin-left: auto;
}

/* ---------- Tile grid ---------- */

.tile-section {
  padding: 24px 28px 60px;
}

.tile-section h2 {
  font-family: var(--font-display);
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
  margin: 0 0 16px;
}

.tile-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}

.tile {
  background: var(--sand-card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-decoration: none;
  color: var(--ink);
  position: relative;
  transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
}

.tile:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(11, 79, 82, 0.14);
  border-color: var(--teal-bright);
}

.tile-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--teal);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.tile-icon img { width: 100%; height: 100%; object-fit: cover; border-radius: 10px; }
.tile-icon svg { width: 22px; height: 22px; }

.tile h3 {
  font-family: var(--font-display);
  font-size: 16px;
  margin: 0;
  font-weight: 600;
}

.tile p.desc {
  font-size: 13.5px;
  color: var(--ink-soft);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.tile-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: auto;
  padding-top: 6px;
}

.stamp-tag {
  font-family: var(--font-mono);
  font-size: 10.5px;
  letter-spacing: 0.02em;
  border: 1px dashed var(--teal);
  color: var(--teal-deep);
  border-radius: 5px;
  padding: 3px 7px;
  text-transform: uppercase;
}

.stamp-tag.year { border-color: var(--coral); color: var(--coral-dark); }

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--ink-soft);
}

.empty-state h3 {
  font-family: var(--font-display);
  color: var(--ink);
}

/* ---------- Viewer gate ---------- */

.gate-overlay {
  position: fixed;
  inset: 0;
  background: var(--teal-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.gate-box {
  background: white;
  border-radius: var(--radius);
  padding: 34px;
  width: 100%;
  max-width: 340px;
  text-align: center;
}

.gate-box .brand-mark { margin: 0 auto 14px; }

.gate-box h2 {
  font-family: var(--font-display);
  font-size: 18px;
  margin: 0 0 6px;
}

.gate-box p {
  font-size: 13.5px;
  color: var(--ink-soft);
  margin: 0 0 18px;
}

.gate-box input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 10px;
  font-family: var(--font-body);
}

.gate-box button, .btn-primary {
  width: 100%;
  padding: 11px;
  border: none;
  border-radius: 8px;
  background: var(--coral);
  color: white;
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.gate-box button:hover, .btn-primary:hover { background: var(--coral-dark); }

.gate-error {
  color: var(--coral-dark);
  font-size: 12.5px;
  margin-top: 4px;
  min-height: 16px;
}

.hidden { display: none !important; }

@media (max-width: 640px) {
  .site-header, .filter-bar, .tile-section { padding-left: 16px; padding-right: 16px; }
}
