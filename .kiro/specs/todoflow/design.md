# TodoFlow — Design Document

**Feature:** TodoFlow Task Management Application  
**Status:** ✅ Implemented — this document describes the system as built  
**Source of truth:** `app.js` · `task-logic.js` · `index.html` · `style.css`

---

## Overview

TodoFlow is a **zero-dependency, client-side SPA** served as three static files. The entire runtime — state management, persistence, rendering, and event handling — lives inside a single self-invoking function expression (IIFE) in `app.js`. No module bundler, no transpiler, no package installation is required to run the application.

---

## Architecture

### High-Level Diagram

```
Browser
│
├─ index.html          — HTML structure, all element IDs, SVG assets
├─ style.css           — All visual styling (CSS custom properties, responsive, animations)
└─ app.js (IIFE)
    │
    ├─ Pure Logic Layer      createTask, addTask, deleteTask, toggleTask,
    │                        editTask, filterTasks, searchTasks,
    │                        getVisibleTasks, isOverdue, formatDueDate
    │
    ├─ State Object          { tasks: [], filter: 'all', search: '' }
    │
    ├─ Persistence Layer     saveTasks()  →  localStorage
    │                        loadTasks()  ←  localStorage
    │
    ├─ Render Layer          render()  →  buildTaskEl()  →  DOM
    │
    └─ Event Handlers        handleAdd, handleToggle, handleDelete,
                             handleFilterChange, handleSearch,
                             handleClearCompleted, startEdit
```

`task-logic.js` is a **parallel Node.js module** exporting the same pure functions via `module.exports`. It is never loaded in the browser — it exists solely for the test suite.

### Why an IIFE?

- Avoids polluting the global scope without requiring ES modules or a bundler
- Works as a plain classic `<script src="app.js">` with no type="module"
- Compatible with Python's `http.server` and any static host
- All internal functions remain private to the closure

---

## Data Model

### Task Object

```javascript
{
  id:        string,   // unique — Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9)
  text:      string,   // trimmed, non-empty; max 200 chars (enforced by HTML maxlength)
  completed: boolean,  // false at creation; mutated only by toggleTask()
  priority:  string,   // 'low' | 'medium' | 'high' — invalid values coerced to 'medium'
  dueDate:   string|null,  // 'YYYY-MM-DD' ISO date string, or null if not set
  createdAt: string    // new Date().toISOString() — set at creation, never changed
}
```

### State Object

```javascript
var state = {
  tasks:  [],     // Task[] — single source of truth; the only persisted field
  filter: 'all',  // 'all' | 'active' | 'completed' — display-only, not persisted
  search: ''      // current search query — display-only, not persisted
};
```

### localStorage Schema

| Key | Value |
|-----|-------|
| `todoflow_tasks` | `JSON.stringify(state.tasks)` — a JSON array of Task objects |

---

## Component Structure (HTML)

```
.app-layout
├── aside.sidebar                    — Dark sidebar (230 px, sticky)
│   ├── .sidebar-brand               — Logo + "TodoFlow" + "Productivity"
│   ├── nav.sidebar-nav              — 4 filter shortcut buttons
│   │   ├── button[data-filter=all]  — Dashboard (→ filter 'all')
│   │   ├── button[data-filter=all]  — My Tasks  (→ filter 'all')
│   │   ├── button[data-filter=active]   — Active
│   │   └── button[data-filter=completed] — Completed
│   ├── .sidebar-progress-card       — SVG ring + % text + "X of Y done"
│   └── .sidebar-tip                 — Static motivational copy
│
└── .main-content                    — Flexible remaining width
    ├── header.topbar                — Greeting + date + avatar
    ├── section.stats-row            — 4 stat cards (Total/Active/Done/%)
    ├── section.add-task-section     — Task input + Add button + Priority/DueDate
    └── section.workspace-section
        ├── .workspace-toolbar       — Heading + visible-count badge + filter tabs
        ├── .search-row              — Full-width search input
        ├── .task-list-wrap
        │   ├── ul#task-list         — Rendered task items (built by buildTaskEl)
        │   └── #empty-state         — Shown when visible.length === 0
        └── footer.workspace-footer  — Summary text + Clear completed button
```

### DOM IDs (all managed by app.js)

| ID | Purpose |
|----|---------|
| `task-input` | New task text field |
| `priority-select` | Priority dropdown |
| `due-date-input` | Due date picker |
| `add-btn` | Add task button |
| `task-list` | `<ul>` receiving rendered task `<li>` elements |
| `empty-state` | Hidden/shown based on `visible.length` |
| `empty-title` / `empty-sub` | Dynamic empty state copy |
| `validation-msg` | Inline error for empty task attempt |
| `search-input` | Real-time search field |
| `active-count` | "In Progress" stat card value |
| `stat-total` | Total tasks count |
| `stat-done` | Completed tasks count |
| `stat-progress` | Completion percentage text |
| `progress-ring-fill` | SVG circle — `stroke-dashoffset` animated |
| `progress-pct` | % text overlay on ring |
| `progress-sub` | "X of Y done" text |
| `nav-total` / `nav-active` / `nav-done` | Sidebar nav badge counts |
| `visible-count-badge` | Toolbar "N tasks" badge |
| `summary-text` | Footer task summary line |
| `clear-completed-btn` | Shown/hidden via `style.display` |
| `greeting-title` | Time-of-day greeting set once in `init()` |
| `topbar-date` | Current date set once in `init()` |

---

## Pure Logic Functions

All functions are **pure**: given the same inputs they always return the same output and cause no side effects.

```
generateId()
  → string: Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9)
  Purpose: collision-resistant unique ID within a browser session

createTask(text, priority, dueDate)
  → Task
  Trims text. Validates priority against ['low','medium','high']; defaults to 'medium'.
  Sets completed: false, createdAt: new Date().toISOString().

addTask(tasks, task)
  → Task[]
  Returns [task, ...tasks]  — new task is always first.

deleteTask(tasks, id)
  → Task[]
  Returns tasks.filter(t => t.id !== id)

toggleTask(tasks, id)
  → Task[]
  Returns tasks.map(t => t.id === id ? {...t, completed: !t.completed} : t)

editTask(tasks, id, newText)
  → Task[]
  If newText.trim() is empty → returns tasks unchanged.
  Otherwise → maps to {...t, text: trimmed} for matching id.

filterTasks(tasks, filter)
  → Task[]
  'active'    → tasks.filter(t => !t.completed)
  'completed' → tasks.filter(t =>  t.completed)
  'all'       → tasks (unchanged reference)

searchTasks(tasks, query)
  → Task[]
  If query.trim() is empty → returns tasks unchanged.
  Otherwise → case-insensitive substring match on t.text.toLowerCase()

getVisibleTasks(tasks, filter, search)
  → Task[]
  Composes: searchTasks(filterTasks(tasks, filter), search)
  Filter is applied first; search narrows within that result.

isOverdue(task)
  → boolean
  false if !task.dueDate OR task.completed
  true  if task.dueDate < new Date().toISOString().slice(0,10)
  Uses lexicographic ISO date comparison (correct for YYYY-MM-DD).

formatDueDate(dueDate)
  → string
  Parses 'YYYY-MM-DD' by splitting on '-' (avoids UTC timezone offset).
  Returns toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'})
```

---

## State Management

### Mutation Flow

Every user action follows this exact sequence — no exceptions:

```
User action
    ↓
Event handler
    ↓
Pure function  →  new tasks array (state.tasks = result)
    ↓
saveTasks(state.tasks)  →  localStorage write (try/catch)
    ↓
render()  →  full DOM re-derive
```

`state.filter` and `state.search` change without a localStorage write — they are display-only state.

### Why Full Re-render?

`render()` sets `taskList.innerHTML = ''` and rebuilds every visible task element on every call. This trades a small amount of CPU for zero state/DOM sync complexity. With fewer than 500 tasks, this is imperceptibly fast.

---

## Persistence

### Write

```javascript
function saveTasks(tasks) {
  try {
    localStorage.setItem('todoflow_tasks', JSON.stringify(tasks));
  } catch (e) {
    console.warn('[TodoFlow] localStorage save failed:', e);
  }
}
```

### Read (page load)

```javascript
function loadTasks() {
  try {
    var raw = localStorage.getItem('todoflow_tasks');
    if (!raw) return [];
    var parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(function (t) {
      return t
        && typeof t.id        === 'string'
        && typeof t.text      === 'string'
        && typeof t.completed === 'boolean';
    });
  } catch (e) {
    console.warn('[TodoFlow] localStorage load failed:', e);
    return [];
  }
}
```

Corrupt entries and non-array values are discarded; the application always starts in a valid state.

---

## Render Flow

```
render()
│
├─ visible = getVisibleTasks(state.tasks, state.filter, state.search)
├─ activeCount   = state.tasks.filter(!completed).length
├─ completedCount = state.tasks.filter(completed).length
├─ pct = completedCount / state.tasks.length * 100 (or 0)
│
├─ Update all display elements:
│    activeCountEl, statTotalEl, statDoneEl, statProgressEl
│    progressRingEl (stroke-dashoffset = 138.2 × (1 - pct/100))
│    progressPctEl, progressSubEl
│    navTotalEl, navActiveEl, navDoneEl
│    visibleCountBadgeEl, summaryTextEl
│
├─ clearCompletedBtn.style.display = completedCount > 0 ? '' : 'none'
│
├─ Update filter-tab--active class + aria-selected on each .filter-tab
│
├─ if visible.length === 0:
│    taskList.style.display = 'none'
│    emptyState.style.display = ''
│    set emptyTitle/emptySub text (two cases: no tasks vs no match)
│  else:
│    taskList.style.display = ''
│    emptyState.style.display = 'none'
│
└─ taskList.innerHTML = ''
   visible.forEach(task → taskList.appendChild(buildTaskEl(task)))
```

### buildTaskEl(task) → `<li>`

```
<li class="task-item [task-item--completed]" data-id="{id}">
  <input type="checkbox" class="task-checkbox" [checked]>
  <div class="task-body">
    <span class="task-text">{text}</span>
    <div class="task-meta">
      <span class="priority-badge priority-badge--{priority}">{priority}</span>
      [<span class="due-date [due-date--overdue]">{⚠|📅} {formatted date}</span>]
    </div>
  </div>
  <div class="task-actions">
    <button class="btn btn--icon btn--edit" aria-label="Edit: {text}">✏️</button>
    <button class="btn btn--icon btn--delete" aria-label="Delete: {text}">🗑️</button>
  </div>
</li>
```

---

## Edit Mode Design

Inline edit uses a **DOM substitution** pattern — no hidden elements:

```
startEdit(id, li, textEl)
│
├─ Guard: if taskList already has a .task-edit-input → blur it and return
├─ Find task in state.tasks by id
├─ Create <input class="task-edit-input"> with value = task.text
├─ textEl.parentNode.replaceChild(inp, textEl)
├─ inp.focus(); inp.select()
│
├─ let handled = false   ← prevents blur double-fire
│
├─ commit():
│    if (handled) return
│    handled = true
│    if (newText && newText !== task.text) → editTask() + saveTasks()
│    render()
│
├─ cancel():
│    if (handled) return
│    handled = true
│    render()   ← no save; original text restored by re-render
│
├─ keydown: Enter → commit()  |  Escape → cancel()
└─ blur: commit() (once, via { once: true })
```

The `handled` flag is critical: when Enter is pressed, `render()` removes the `<input>` from the DOM, which fires a `blur` event. Without the flag, `commit()` would run twice. With it, the second call returns immediately.

---

## Filter and Search Composition

```
Filter state:  state.filter ∈ { 'all', 'active', 'completed' }
Search state:  state.search (string, may be empty)

Filter → Search pipeline (not Search → Filter):
  filterTasks(state.tasks, state.filter)   // status gate first
      ↓
  searchTasks(filtered, state.search)       // text search within filtered set
      ↓
  visible[]   // passed to render()
```

Neither filter nor search modifies `state.tasks` — both are pure display derivations.

---

## Progress Ring

The SVG ring uses the dash-offset animation technique:

```
Circle radius: 22px
Circumference: 2π × 22 ≈ 138.2px

stroke-dasharray:   138.2        (always fixed)
stroke-dashoffset:  138.2 × (1 - pct/100)

0%  complete → offset = 138.2 (ring invisible)
50% complete → offset =  69.1 (half ring filled)
100% complete → offset =  0   (full ring filled)

Animated via CSS: transition: stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)
Disabled via:     @media (prefers-reduced-motion: reduce)
```

---

## Responsive Breakpoints

| Breakpoint | Layout change |
|------------|--------------|
| `≥ 900px` | Full two-column: 230 px sidebar + flexible main |
| `< 900px` | Sidebar narrows to 200 px; stats in 2-column grid |
| `< 720px` | Sidebar becomes horizontal top nav bar; filter/search stack |
| `< 520px` | Single column; add-form stacks; stat cards 2×2; btn--icon always visible |
| `< 360px` | Stat card labels and icons hidden to save space |

---

## Accessibility Decisions

| Decision | Implementation |
|----------|---------------|
| All buttons have `type="button"` | Prevents accidental form submission |
| Checkboxes have per-task `aria-label` | Describes action + task text |
| Edit/delete have per-task `aria-label` | Screen reader announces target |
| Filter tabs have `role="tab"` + `aria-selected` | Updated on every render |
| Validation message has `role="alert"` + `aria-live="assertive"` | Announced immediately |
| Icon buttons always visible on mobile | `opacity: 1 !important` at `< 520px` |
| Edit/delete at reduced opacity (0.45) on desktop | Still clickable; hover brings to full opacity |

---

## Key Implementation Decisions

| Decision | Rationale |
|----------|-----------|
| Single IIFE, no ES modules | Works with any static server; no bundler needed |
| `task-logic.js` mirrors `app.js` pure functions | Enables Node.js property-based testing without a DOM |
| Full re-render on every change | Eliminates state/DOM sync bugs; fast enough for ≤500 tasks |
| `style.display` not `hidden` attribute | More reliable with JavaScript show/hide toggling |
| `handled` flag in edit mode | Prevents blur double-commit after Enter/Escape triggers DOM removal |
| ISO lexicographic date comparison for overdue | `'YYYY-MM-DD' < 'YYYY-MM-DD'` is correct for date ordering |
| Tasks prepended (not appended) | Most recently added task is always first; no sort step needed |
| `try/catch` around all localStorage calls | Private browsing and full storage silently recover |
| Sidebar nav fires same `handleFilterChange` as tabs | Single handler, no duplicated logic |
| Greeting set once in `init()` | No interval timer; correct for the session lifetime |
