# TodoFlow — Technical Design

**Version:** 1.0.0  
**Status:** Implemented — this document describes the actual system  
**Last updated:** Reflects the code in `app.js`, `task-logic.js`, `index.html`, `style.css`

---

## 1. Architecture Overview

TodoFlow is a **single-page, zero-dependency, client-only web application**.

```
┌────────────────────────────────────────────────┐
│                  Browser                        │
│                                                │
│  index.html  ──loads──►  style.css             │
│      │                                         │
│      └──loads──►  app.js  (single IIFE)        │
│                     │                          │
│                     ├── Pure Logic Functions   │
│                     ├── State Object           │
│                     ├── Persistence (localStorage) │
│                     ├── render() / buildTaskEl()│
│                     └── Event Handlers         │
└────────────────────────────────────────────────┘
```

**No framework. No bundler. No server.** A single `<script src="app.js">` after the HTML body is the entire runtime.

`task-logic.js` is a **parallel file** containing the same pure functions, exported via `module.exports` for Node.js. It is used exclusively by the test suite (`tests/property.test.js`, `tests/functional-sim.js`, `tests/logic-audit.js`). It is **not loaded by the browser**.

---

## 2. File Structure

```
my-kiro-project/
├── index.html          — HTML shell, layout structure, all element IDs
├── style.css           — All styles (CSS custom properties, responsive, animations)
├── app.js              — Application runtime (IIFE, all logic + DOM + state)
├── task-logic.js       — Pure functions for Node.js testing (mirrors app.js logic)
├── assets/
│   ├── todo-background.svg       — Previous background (kept)
│   └── todoflow-background.svg   — Current page background
├── mcp-server/
│   └── todoflow-mcp.js           — MCP server (project info, test status, task stats)
├── tests/
│   ├── property.test.js          — fast-check property-based tests (22 tests)
│   ├── functional-sim.js         — Feature simulation tests (57 assertions)
│   └── logic-audit.js            — Embedded logic audit (50 assertions)
└── .kiro/
    ├── specs/todoflow/           — This spec directory
    ├── steering/                 — Coding, UI/UX, testing, product guidelines
    ├── hooks/                    — PostFileSave JS syntax check hook
    ├── agents/                   — Todo QA Agent
    └── settings/mcp.json         — MCP server registration
```

---

## 3. UI Layout (Implemented)

The application uses a **two-column dashboard layout**:

```
┌─────────────────┬──────────────────────────────────────┐
│   SIDEBAR       │   MAIN CONTENT                        │
│   (230px fixed) │                                       │
│                 │  Topbar: greeting + date + avatar      │
│  Brand logo     │                                       │
│  ─────────      │  Stats row: 4 cards                   │
│  Dashboard      │  [Total] [Active] [Completed] [%]     │
│  My Tasks       │                                       │
│  Active         │  Add task section                     │
│  Completed      │  [+ input] [Add task btn]             │
│                 │  [Priority] [Due date]                 │
│  ─────────      │                                       │
│  Progress ring  │  Workspace section                    │
│  "0 of 0 done"  │  Toolbar: heading + filter tabs       │
│                 │  Search bar                           │
│  Tip card       │  Task list (or empty state)           │
│                 │  Footer: summary + clear btn          │
└─────────────────┴──────────────────────────────────────┘
```

Responsive breakpoints:
- `≥ 900px` — full two-column layout
- `720px–900px` — sidebar narrows to 200px, stats in 2-column grid
- `< 720px` — sidebar becomes a horizontal top nav bar
- `< 520px` — single column, stacked add form, 2×2 stat grid

---

## 4. Application State

All runtime state lives in a single plain object:

```javascript
var state = {
  tasks:  [],     // array of Task objects (source of truth)
  filter: 'all',  // 'all' | 'active' | 'completed'
  search: ''      // current search query string
};
```

**State mutation rules:**
- Every mutation calls `saveTasks(state.tasks)` immediately after
- `render()` is called after every mutation — full re-render, no partial updates
- `state.filter` and `state.search` do NOT trigger localStorage writes (display-only)
- `state.tasks` is the only persisted piece of state

---

## 5. Pure Business Logic Functions

These functions live in `app.js` (inside the IIFE) and are mirrored in `task-logic.js` for testing. They are **pure** — they take input, return new values, and have no side effects.

| Function | Signature | Description |
|----------|-----------|-------------|
| `generateId()` | `() → string` | `Date.now().toString(36) + '-' + random(7)` — unique within a session |
| `createTask(text, priority, dueDate)` | `(string, string, string\|null) → Task` | Creates canonical task object; trims text; validates priority |
| `addTask(tasks, task)` | `(Task[], Task) → Task[]` | Returns `[task, ...tasks]` — new task prepended |
| `deleteTask(tasks, id)` | `(Task[], string) → Task[]` | Returns filtered array excluding matching id |
| `toggleTask(tasks, id)` | `(Task[], string) → Task[]` | Returns mapped array with `completed` flipped for matching id |
| `editTask(tasks, id, newText)` | `(Task[], string, string) → Task[]` | Updates `text` for matching id; rejects empty strings silently |
| `filterTasks(tasks, filter)` | `(Task[], string) → Task[]` | Applies status filter: `all/active/completed` |
| `searchTasks(tasks, query)` | `(Task[], string) → Task[]` | Case-insensitive substring filter on `task.text` |
| `getVisibleTasks(tasks, filter, search)` | `(Task[], string, string) → Task[]` | Composes `filterTasks` then `searchTasks` |
| `isOverdue(task)` | `(Task) → boolean` | `true` if `dueDate < today (ISO)` AND `!completed` |
| `formatDueDate(dueDate)` | `(string) → string` | Formats `YYYY-MM-DD` to `"Mon DD, YYYY"` (en-US locale) |

---

## 6. Persistence Layer

### Write path
Every state mutation follows this exact sequence:
```
user action
  → handler (handleAdd / handleToggle / handleDelete / handleEditStart / handleClearCompleted)
  → mutate state.tasks (using pure function)
  → saveTasks(state.tasks)              ← JSON.stringify → localStorage
  → render()                            ← re-derive DOM from state
```

### Read path (on page load)
```
init()
  → loadTasks()
      → localStorage.getItem('todoflow_tasks')
      → JSON.parse()
      → validate: must be Array, each item must have id(string), text(string), completed(boolean)
      → invalid items are filtered out; corrupt JSON returns []
  → state.tasks = result
  → render()
```

### localStorage key
```
'todoflow_tasks'
```

### Error handling
Both `saveTasks` and `loadTasks` are wrapped in `try/catch`. Errors are logged with `console.warn` and do not propagate or crash the application.

---

## 7. Rendering Flow

`render()` is the **only function that touches the DOM for data display**. It runs after every state mutation and re-derives the entire visible DOM from `state`.

```
render()
  │
  ├── compute visible = getVisibleTasks(state.tasks, state.filter, state.search)
  ├── compute activeCount, completedCount, pct
  │
  ├── update stat display elements (active-count, stat-total, stat-done,
  │     stat-progress, progress-ring-fill, progress-pct, progress-sub,
  │     nav-total, nav-active, nav-done, visible-count-badge, summary-text)
  │
  ├── show/hide clear-completed-btn (style.display)
  │
  ├── update filter-tab--active class + aria-selected on all .filter-tab elements
  │
  ├── show/hide task list vs empty state (style.display)
  │   └── set empty-title / empty-sub text based on whether tasks exist at all
  │
  └── taskList.innerHTML = ''
      forEach(visible, task → taskList.appendChild(buildTaskEl(task)))
```

`buildTaskEl(task)` constructs a complete `<li>` for one task:
- `input[type=checkbox]` — checked state bound to task.completed
- `.task-text` span — task.text content
- `.task-meta` div — priority badge + optional due-date span
- `.task-actions` div — edit button + delete button
- Completed tasks get class `task-item--completed`

---

## 8. Edit Mode

Inline editing uses a **temporary DOM substitution** pattern:

```
startEdit(id, li, textEl)
  │
  ├── check for existing .task-edit-input (prevent concurrent edits)
  ├── create <input class="task-edit-input"> with task.text value
  ├── textEl.parentNode.replaceChild(inp, textEl)  ← replaces span with input
  ├── inp.focus(); inp.select()
  │
  ├── set `handled` flag (prevents blur double-fire after keyboard commit)
  │
  ├── keydown: Enter → commit()  |  Escape → cancel()
  └── blur: commit() (once)
      │
      commit():
        if handled → return
        set handled = true
        if newText.trim() && newText !== task.text → editTask() + saveTasks()
        render()   ← replaces temporary input with rebuilt task element
      │
      cancel():
        if handled → return
        set handled = true
        render()   ← restores original without saving
```

The `handled` flag prevents the blur event from firing `commit()` a second time when Enter/Escape already triggered a `render()` that removed the input from the DOM.

---

## 9. Filter and Search Flow

```
Filter change (tab click or sidebar nav click):
  state.filter = newFilter
  render()   ← no localStorage write, display-only change

Search change (input event):
  state.search = searchInput.value
  render()   ← no localStorage write, display-only change

getVisibleTasks:
  filterTasks(state.tasks, state.filter)   ← status filter first
    ↓
  searchTasks(filtered, state.search)      ← text search second
    ↓
  visible[]   ← what render() uses to build the DOM
```

Search and filter are **non-destructive**: `state.tasks` is never modified by display operations.

---

## 10. Overdue Detection

```javascript
function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  var today = new Date().toISOString().slice(0, 10);  // 'YYYY-MM-DD'
  return task.dueDate < today;  // lexicographic ISO date comparison
}
```

Called inside `buildTaskEl` for every task that has a `dueDate`. Completed tasks are explicitly exempt — a completed task with a past due date is never shown as overdue.

---

## 11. Greeting and Date (Display Only)

Set once during `init()`, never updated again:

```javascript
// Greeting based on hour-of-day
var h = new Date().getHours();
var g = h < 12 ? 'Good morning 👋' : h < 17 ? 'Good afternoon 👋' : 'Good evening 👋';
$('greeting-title').textContent = g;

// Date label
var now = new Date();
$('topbar-date').textContent = days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();
```

---

## 12. Important Implementation Decisions

| Decision | Rationale |
|----------|-----------|
| Single IIFE in app.js | Avoids global scope pollution without requiring ES modules or a bundler |
| task-logic.js mirrors app.js pure functions | Allows Node.js property-based tests without a DOM or browser |
| Full re-render on every change | Simple, predictable, no state/DOM sync bugs; fast enough for <500 tasks |
| `style.display` instead of `hidden` attribute | More reliable cross-browser for show/hide toggling via JS |
| `handled` flag in edit mode | Prevents double-commit when blur fires after Enter/Escape removes the input |
| Lexicographic ISO date comparison for overdue | `'YYYY-MM-DD' < 'YYYY-MM-DD'` works correctly for date ordering |
| `Array.prototype.slice.call(NodeList)` | ES5-compatible conversion; avoids `Array.from` which needs a polyfill |
| localStorage wrapped in try/catch | Private browsing or full storage silently fails rather than crashing |
| Tasks prepended, not appended | Most recently added task is most relevant; no sort needed |
| Sidebar nav items fire `handleFilterChange` | Sidebar is a visual shortcut to the same filter tabs — single handler |

---

## 13. Property-Based Test Coverage

The following invariants are verified by `tests/property.test.js` (22 tests, fast-check):

1. `addTask` always increases count by exactly 1
2. Added task always appears in result array
3. `addTask` does not mutate the original array
4. `deleteTask` always decreases count by exactly 1
5. Deleted task ID is absent from result
6. Deleting a non-existent ID leaves array unchanged
7. Double-toggling returns task to original `completed` state
8. Toggle preserves id, text, priority, dueDate
9. Toggle does not change array length
10. `filterTasks` result is always a subset of input
11. Filter "all" returns all tasks
12. Filter "active" returns only `!completed` tasks
13. Filter "completed" returns only `completed` tasks
14. Active count + completed count === total
15. `searchTasks` result is always a subset of input
16. Empty query returns all tasks
17. Whitespace query returns all tasks
18. Search never returns a task whose text does not contain the query
19. All task IDs in a batch are unique
20. JSON round-trip preserves all task fields
21. `editTask` preserves task ID
22. `editTask` with empty string does not change task text
