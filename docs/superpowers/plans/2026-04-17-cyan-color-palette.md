# Cyan Color Palette Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the warm gold/amber palette with a cyan (#22d3ee) accent and cool blue-black backgrounds across the entire client.

**Architecture:** All color tokens live in CSS custom properties in `client/src/style.css`. Utility classes (`.input-gold`, `.btn-gold-*`, etc.) are also defined there and referenced by name in Vue templates — both the definitions and the references need updating. No component logic changes required.

**Tech Stack:** Vue 3, Tailwind CSS v4, CSS custom properties

---

## Files

| File | Change |
|---|---|
| `client/src/style.css` | Rewrite all CSS vars; rename and update all utility class definitions; add `--border-table` token |
| `client/src/views/MainPage.vue` | Replace `var(--gold)`, `divider-gold` class |
| `client/src/components/ReportInput.vue` | Replace `input-gold` class, inline `var(--gold)` button color |
| `client/src/views/ReportPage.vue` | Replace `var(--gold)`, `accent-gold`, `btn-gold-active/inactive` |
| `client/src/components/ConsumableTable.vue` | Replace `var(--gold)`, `btn-gold-active/inactive`, `btn-gold-inactive` |

---

## Task 1: Update CSS variables and utility classes in `style.css`

**Files:**
- Modify: `client/src/style.css`

- [ ] **Step 1: Replace the `:root` block**

Open `client/src/style.css`. Replace the entire `:root { ... }` block (lines 4–18) with:

```css
:root {
  --cyan: #22d3ee;
  --cyan-bright: #38e8ff;
  --cyan-glow: rgba(34, 211, 238, 0.3);
  --bg-base: #060a0e;
  --bg-surface: #0b1018;
  --bg-elevated: #111820;
  --bg-hover: #161f28;
  --border-subtle: rgba(34, 211, 238, 0.10);
  --border-default: rgba(34, 211, 238, 0.20);
  --border-accent: rgba(34, 211, 238, 0.45);
  --border-table: rgba(34, 211, 238, 0.14);
  --text-primary: #d4e8f0;
  --text-secondary: #7a9aaa;
  --text-muted: #3a5a6a;
}
```

- [ ] **Step 2: Rename and update `.input-gold`**

Replace:
```css
.input-gold {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input-gold::placeholder {
  color: var(--text-muted);
}

.input-gold:focus {
  border-color: var(--border-accent);
  box-shadow: 0 0 0 2px rgba(196, 151, 60, 0.1);
}
```

With:
```css
.input-cyan {
  background: var(--bg-surface);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input-cyan::placeholder {
  color: var(--text-muted);
}

.input-cyan:focus {
  border-color: var(--border-accent);
  box-shadow: 0 0 0 2px rgba(34, 211, 238, 0.08);
}
```

- [ ] **Step 3: Rename and update `.btn-gold-active` / `.btn-gold-inactive`**

Replace:
```css
.btn-gold-active {
  background: rgba(196, 151, 60, 0.15);
  border-color: rgba(196, 151, 60, 0.55);
  color: var(--gold);
}

.btn-gold-inactive {
  background: var(--bg-surface);
  border-color: var(--border-subtle);
  color: var(--text-secondary);
}

.btn-gold-inactive:hover {
  border-color: var(--border-default);
  color: var(--text-primary);
}
```

With:
```css
.btn-cyan-active {
  background: rgba(34, 211, 238, 0.12);
  border-color: rgba(34, 211, 238, 0.50);
  color: var(--cyan);
}

.btn-cyan-inactive {
  background: var(--bg-surface);
  border-color: var(--border-subtle);
  color: var(--text-secondary);
}

.btn-cyan-inactive:hover {
  border-color: var(--border-default);
  color: var(--text-primary);
}
```

- [ ] **Step 4: Rename `.divider-gold` → `.divider-cyan`**

Replace:
```css
.divider-gold {
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border-accent), transparent);
}
```

With:
```css
.divider-cyan {
  height: 1px;
  background: linear-gradient(to right, transparent, var(--border-accent), transparent);
}
```

- [ ] **Step 5: Rename `.text-gold` → `.text-cyan` and `.accent-gold` → `.accent-cyan`**

Replace:
```css
.text-gold {
  color: var(--gold);
}

.accent-gold {
  accent-color: var(--gold);
}
```

With:
```css
.text-cyan {
  color: var(--cyan);
}

.accent-cyan {
  accent-color: var(--cyan);
}
```

- [ ] **Step 6: Verify no gold references remain in style.css**

Run:
```bash
grep -n "gold\|#c4973c\|#d4a84a\|196, 151, 60" client/src/style.css
```

Expected: no output.

- [ ] **Step 7: Commit**

```bash
git add client/src/style.css
git commit -m "feat: replace gold palette with cyan in style.css"
```

---

## Task 2: Update `MainPage.vue`

**Files:**
- Modify: `client/src/views/MainPage.vue`

- [ ] **Step 1: Replace `var(--gold)` with `var(--cyan)` in the title**

On line 32, replace:
```
          color: var(--gold);
```
With:
```
          color: var(--cyan);
```

- [ ] **Step 2: Replace `divider-gold` class with `divider-cyan`**

On line 39, replace:
```html
      <div class="divider-gold w-24 mb-4"></div>
```
With:
```html
      <div class="divider-cyan w-24 mb-4"></div>
```

- [ ] **Step 3: Verify**

```bash
grep -n "gold" client/src/views/MainPage.vue
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add client/src/views/MainPage.vue
git commit -m "feat: update MainPage.vue to cyan palette"
```

---

## Task 3: Update `ReportInput.vue`

**Files:**
- Modify: `client/src/components/ReportInput.vue`

- [ ] **Step 1: Replace `input-gold` class with `input-cyan`**

On line 25, replace:
```html
      class="input-gold flex-1 px-4 py-3 text-sm rounded"
```
With:
```html
      class="input-cyan flex-1 px-4 py-3 text-sm rounded"
```

- [ ] **Step 2: Replace the inline button style**

On lines 31–35 of the submit button, replace:
```
        background: var(--gold);
        color: #0c0a08;
```
With:
```
        background: var(--cyan);
        color: #060a0e;
```

- [ ] **Step 3: Verify**

```bash
grep -n "gold" client/src/components/ReportInput.vue
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/ReportInput.vue
git commit -m "feat: update ReportInput.vue to cyan palette"
```

---

## Task 4: Update `ReportPage.vue`

**Files:**
- Modify: `client/src/views/ReportPage.vue`

- [ ] **Step 1: Replace `var(--gold)` in the header link (line 122)**

Replace:
```
      style="color: var(--gold); letter-spacing: 0.1em"
```
With:
```
      style="color: var(--cyan); letter-spacing: 0.1em"
```

- [ ] **Step 2: Replace `accent-gold` with `accent-cyan` (appears on lines 170 and 176)**

Replace all occurrences:
```
                class="accent-gold w-3.5 h-3.5 rounded cursor-pointer"
```
With:
```
                class="accent-cyan w-3.5 h-3.5 rounded cursor-pointer"
```

(There are 2 checkboxes — Boss only and Hide wipes — both use this class.)

- [ ] **Step 3: Replace `btn-gold-active` / `btn-gold-inactive` (lines 189, 197)**

Replace all occurrences of:
```
'btn-gold-active' : 'btn-gold-inactive'
```
With:
```
'btn-cyan-active' : 'btn-cyan-inactive'
```

(This appears in both the "All fights" button and the encounter buttons.)

- [ ] **Step 4: Verify**

```bash
grep -n "gold" client/src/views/ReportPage.vue
```

Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add client/src/views/ReportPage.vue
git commit -m "feat: update ReportPage.vue to cyan palette"
```

---

## Task 5: Update `ConsumableTable.vue`

**Files:**
- Modify: `client/src/components/ConsumableTable.vue`

- [ ] **Step 1: Replace `var(--gold)` in the consumable filter clear button (line 273)**

Replace:
```
            style="color: var(--gold)"
            @click="selectedSpellIds = new Set(); selectedMissingSpellIds = new Set()"
```
With:
```
            style="color: var(--cyan)"
            @click="selectedSpellIds = new Set(); selectedMissingSpellIds = new Set()"
```

- [ ] **Step 2: Replace `var(--gold)` in the missing filter clear button (line 357)**

Replace:
```
          <button class="transition-colors" style="color: var(--gold)" @click="selectedMissingTypes = new Set()">clear</button>
```
With:
```
          <button class="transition-colors" style="color: var(--cyan)" @click="selectedMissingTypes = new Set()">clear</button>
```

- [ ] **Step 3: Replace `btn-gold-active` / `btn-gold-inactive` in view mode toggle (lines 386–397)**

Replace:
```
          :class="viewMode === 'matrix' ? 'btn-gold-active' : 'btn-gold-inactive'"
```
With:
```
          :class="viewMode === 'matrix' ? 'btn-cyan-active' : 'btn-cyan-inactive'"
```

And:
```
          :class="viewMode === 'detail' ? 'btn-gold-active' : 'btn-gold-inactive'"
```
With:
```
          :class="viewMode === 'detail' ? 'btn-cyan-active' : 'btn-cyan-inactive'"
```

- [ ] **Step 4: Replace `btn-gold-inactive` on the raw data button (line 524)**

Replace:
```
          class="px-3 py-1 text-[10px] rounded border transition-colors duration-150 btn-gold-inactive"
```
With:
```
          class="px-3 py-1 text-[10px] rounded border transition-colors duration-150 btn-cyan-inactive"
```

- [ ] **Step 5: Verify**

```bash
grep -n "gold" client/src/components/ConsumableTable.vue
```

Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/ConsumableTable.vue
git commit -m "feat: update ConsumableTable.vue to cyan palette"
```

---

## Task 6: Final verification

- [ ] **Step 1: Check no gold references remain anywhere in client/src**

```bash
grep -rn "gold\|--gold\|#c4973c\|#d4a84a" client/src/
```

Expected: no output.

- [ ] **Step 2: Start the dev server and visually verify**

```bash
cd client && npm run dev
```

Open the app and confirm:
- Title text is cyan on the main page and report page
- Input field border glows cyan on focus
- Analyze button is cyan-background
- Encounter filter buttons show cyan active state
- View mode toggle (Matrix / Detail) shows cyan active state
- Raw data button and clear links are cyan
- Backgrounds have a cool blue-black tone (not warm brown)

- [ ] **Step 3: Stop the dev server (Ctrl+C)**

- [ ] **Step 4: Final commit if any stray fixes were needed**

```bash
git add -p
git commit -m "feat: finalize cyan palette migration"
```
