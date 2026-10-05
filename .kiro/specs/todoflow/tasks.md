# TodoFlow — Implementation Tasks

**Feature:** TodoFlow Task Management Application  
**Status:** ✅ All tasks complete — documents the implementation as built  
**Derived from:** `requirements.md` (Requirements 1–13) and `design.md`

Each task maps to one or more requirements, has clear acceptance criteria to verify against, and is independently testable.

---

## Task 1: Project Foundation and Static Serving

**Requirement refs:** NFR (Non-Requirements section — no backend)  
**Status:** ✅ Done

- [x] Create `index.html` as the single HTML entry point
- [x] Create `style.css` with CSS custom properties (`:root` variables)
- [x] Create `app.js` as a self-contained IIFE (immediately-invoked function expression)
- [x] Confirm `python3 -m http.server 8080` serves all three files with HTTP 200
- [x] Confirm single `<script src="app.js">` after `</body>` — no module bundler
- [x] No uncaught browser console errors on load

**Verify:**
```bash
python3 -m http.server 8080
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/
# Expected: 200
```

---

## Task 2: Task Data Model and ID Generation

**Requirement refs:** Requirement 1 (AC-3), Design — Data Model  
**Status:** ✅ Done

- [x] Define `generateId()` → `Date.now().toString(36) + '-' + random(7 chars)`
- [x] Define `createTask(text, priority, dueDate)` returning canonical Task object:
  - `id` from `generateId()`
  - `text` trimmed
  - `completed: false`
  - `priority` validated against `['low','medium','high']`; defaults to `'medium'`
  - `dueDate` = value or `null`
  - `createdAt` = `new Date().toISOString()`
- [x] Mirror identical functions in `task-logic.js` for Node.js test access

**Verify:**
```bash
node -e "const {createTask} = require('./task-logic.js'); console.log(createTask('Test','invalid',null).priority)"
# Expected: medium
```

---

## Task 3: localStorage Persistence Layer

**Requirement refs:** Requirement 10 (all ACs)  
**Status:** ✅ Done

- [x] Implement `saveTasks(tasks)`:
  - `localStorage.setItem('todoflow_tasks', JSON.stringify(tasks))`
  - Wrapped in `try/catch`; errors logged with `console.warn`, not thrown
- [x] Implement `loadTasks()`:
  - Read `localStorage.getItem('todoflow_tasks')`
  - Return `[]` if null, if not an array, or on JSON parse error
  - Filter out entries missing valid `id` (string), `text` (string), `completed` (boolean)
- [x] Confirm `saveTasks` is called after every single state mutation

**Verify:** Add a task, open DevTools → Application → localStorage → confirm `todoflow_tasks` key exists with correct JSON.

---

## Task 4: Application State and Init

**Requirement refs:** Design — State Management  
**Status:** ✅ Done

- [x] Define `state = { tasks: [], filter: 'all', search: '' }` inside the IIFE
- [x] Implement `init()` that:
  - Resolves all DOM element references via `document.getElementById`
  - Attaches all event listeners
  - Sets greeting text based on `new Date().getHours()`
  - Sets date text from `new Date()`
  - Calls `state.tasks = loadTasks()`
  - Calls `render()`
- [x] Guard: `if (document.readyState === 'loading') addEventListener('DOMContentLoaded', init) else init()`

---

## Task 5: Add Task

**Requirement refs:** Requirement 1 (AC-1 through AC-4)  
**Status:** ✅ Done

- [x] Implement `addTask(tasks, task)` → `[task].concat(tasks)` (prepend)
- [x] Implement `handleAdd()`:
  - Read and trim `taskInput.value`
  - If empty: call `showValidation('Task cannot be empty')`, focus input, return
  - Create task via `createTask(text, prioritySelect.value, dueDateInput.value || null)`
  - `state.tasks = addTask(state.tasks, task)`
  - `saveTasks(state.tasks)`
  - Clear input fields, reset priority to 'medium', focus input
  - Call `render()`
  - Apply `task-item--new` CSS animation class to first list item
- [x] Wire `add-btn` click → `handleAdd`
- [x] Wire `task-input` keydown Enter → `handleAdd`
- [x] Wire `task-input` input event → clear validation if value is non-empty

**Verify:** AC-1 and AC-2 from requirements.md

---

## Task 6: Validation Message

**Requirement refs:** Requirement 1 (AC-2), Requirement 13 (AC-5)  
**Status:** ✅ Done

- [x] `showValidation(msg)`: sets `validationMsg.textContent`, starts 3-second auto-clear timer
- [x] `clearValidation()`: clears text and cancels timer
- [x] `#validation-msg` has `role="alert"` and `aria-live="assertive"` in HTML

---

## Task 7: Complete and Uncomplete Task

**Requirement refs:** Requirement 2 (all ACs)  
**Status:** ✅ Done

- [x] Implement `toggleTask(tasks, id)` → maps to `{...t, completed: !t.completed}` for matching id
- [x] `handleToggle(id)`: `state.tasks = toggleTask(...)`, `saveTasks`, `render()`
- [x] In `buildTaskEl`: checkbox `change` event → `handleToggle(task.id)`
- [x] `task-item--completed` class applied when `task.completed === true`
- [x] CSS: completed task has `text-decoration: line-through` and `opacity: 0.6`

**Verify:** AC-1, AC-2, AC-3 in Requirement 2

---

## Task 8: Edit Task

**Requirement refs:** Requirement 3 (all ACs)  
**Status:** ✅ Done

- [x] Implement `editTask(tasks, id, newText)` → rejects empty trim; updates text otherwise
- [x] Implement `startEdit(id, li, textEl)`:
  - Guard against concurrent edits: if `.task-edit-input` already in DOM, blur it and return
  - Create `<input class="task-edit-input">` pre-filled with `task.text`
  - `textEl.parentNode.replaceChild(inp, textEl)`
  - `inp.focus(); inp.select()`
  - `let handled = false`
  - `commit()`: if `handled` return; set `handled=true`; save if changed; `render()`
  - `cancel()`: if `handled` return; set `handled=true`; `render()` (no save)
  - keydown Enter → `commit()`, keydown Escape → `cancel()`
  - blur → `commit()` (once)
- [x] Edit button click: check for existing `.task-edit-input` on same `li` first

**Verify:** AC-1 through AC-5 in Requirement 3

---

## Task 9: Delete Task

**Requirement refs:** Requirement 4 (all ACs)  
**Status:** ✅ Done

- [x] Implement `deleteTask(tasks, id)` → `tasks.filter(t => t.id !== id)`
- [x] `handleDelete(id)`: `state.tasks = deleteTask(...)`, `saveTasks`, `render()`
- [x] Delete button in `buildTaskEl` → `handleDelete(task.id)`

---

## Task 10: Filter Tasks

**Requirement refs:** Requirement 5 (all ACs)  
**Status:** ✅ Done

- [x] Implement `filterTasks(tasks, filter)` — three-way switch on 'all'/'active'/'completed'
- [x] `handleFilterChange(filter)`: `state.filter = filter`, `render()`
- [x] Wire each `.filter-tab[data-filter]` click → `handleFilterChange`
- [x] In `render()`: update `filter-tab--active` class and `aria-selected` on every tab
- [x] Wire each `.sidebar-nav-item[data-filter]` click → same `handleFilterChange`
- [x] Sidebar nav: update `sidebar-nav-item--active` class and `aria-current` on click

**Verify:** AC-1 through AC-5 in Requirement 5

---

## Task 11: Search Tasks

**Requirement refs:** Requirement 6 (all ACs)  
**Status:** ✅ Done

- [x] Implement `searchTasks(tasks, query)` — case-insensitive substring match on `task.text`
- [x] Implement `getVisibleTasks(tasks, filter, search)` — `searchTasks(filterTasks(...), search)`
- [x] `handleSearch(q)`: `state.search = q`, `render()`
- [x] Wire `search-input` input event → `handleSearch(searchInput.value)`

---

## Task 12: Priority Badges

**Requirement refs:** Requirement 7 (all ACs)  
**Status:** ✅ Done

- [x] `<select id="priority-select">` with options: medium (default), low, high
- [x] In `buildTaskEl`: create `<span class="priority-badge priority-badge--{priority}">`
- [x] CSS: `priority-badge--low` = green; `priority-badge--medium` = amber; `priority-badge--high` = red
- [x] Badges use a coloured dot (`::before` content) for additional visual cue

---

## Task 13: Due Date Display

**Requirement refs:** Requirement 8 (AC-1, AC-2)  
**Status:** ✅ Done

- [x] `<input type="date" id="due-date-input">` in add form
- [x] `createTask` stores `dueDateInput.value || null`
- [x] Implement `formatDueDate(dueDate)` — splits on '-', constructs `Date` to avoid UTC shift, returns `toLocaleDateString('en-US', ...)`
- [x] In `buildTaskEl`: if `task.dueDate` → render `<span class="due-date">📅 {formatted}</span>`

---

## Task 14: Overdue Detection

**Requirement refs:** Requirement 8 (AC-3, AC-4)  
**Status:** ✅ Done

- [x] Implement `isOverdue(task)`:
  - Returns `false` if `!task.dueDate` or `task.completed`
  - Returns `task.dueDate < new Date().toISOString().slice(0, 10)`
- [x] In `buildTaskEl`: if `isOverdue(task)` → add `due-date--overdue` class, prefix with ⚠
- [x] CSS: `.due-date--overdue` = red text, red-tinted pill with border

---

## Task 15: Live Counters and Progress Ring

**Requirement refs:** Requirement 9 (all ACs)  
**Status:** ✅ Done

- [x] In `render()` compute: `activeCount`, `completedCount`, `pct = Math.round(completed/total * 100)`
- [x] Update: `active-count`, `stat-total`, `stat-done`, `stat-progress`, `progress-pct`, `progress-sub`
- [x] Update: `nav-total`, `nav-active`, `nav-done`, `visible-count-badge`, `summary-text`
- [x] Progress ring: `circumference = 138.2`, `stroke-dashoffset = circumference × (1 - pct/100)`
- [x] CSS: `transition: stroke-dashoffset 0.6s cubic-bezier(.4,0,.2,1)` on `#progress-ring-fill`
- [x] CSS: `@media (prefers-reduced-motion: reduce)` disables transition

---

## Task 16: Clear Completed

**Requirement refs:** Requirement 12 (all ACs)  
**Status:** ✅ Done

- [x] `handleClearCompleted()`: filter `state.tasks` to `!completed`, save, render
- [x] Wire `clear-completed-btn` click → `handleClearCompleted`
- [x] In `render()`: `clearCompletedBtn.style.display = completedCount > 0 ? '' : 'none'`

---

## Task 17: Empty States

**Requirement refs:** Requirement 11 (all ACs)  
**Status:** ✅ Done

- [x] In `render()`:
  - `visible.length === 0` → `taskList.style.display = 'none'`, `emptyState.style.display = ''`
  - `state.tasks.length === 0` → title "All clear!", sub "You have no tasks here..."
  - `state.tasks.length > 0` → title "No tasks match", sub "Try a different filter..."
  - `visible.length > 0` → `taskList.style.display = ''`, `emptyState.style.display = 'none'`
- [x] Empty state SVG illustration in `index.html`

---

## Task 18: Responsive Layout

**Requirement refs:** Requirement 13 (AC-1, AC-2)  
**Status:** ✅ Done

- [x] Base layout: CSS Grid/Flex two-column (230 px sidebar + flex main)
- [x] `@media (max-width: 1100px)` — stats in 2-column grid
- [x] `@media (max-width: 720px)` — sidebar becomes horizontal top nav
- [x] `@media (max-width: 520px)` — full single-column stack
- [x] `@media (max-width: 360px)` — stat card labels/icons hidden
- [x] No horizontal overflow at any tested width

---

## Task 19: Accessibility

**Requirement refs:** Requirement 13 (AC-3 through AC-6)  
**Status:** ✅ Done

- [x] All `<button>` elements have `type="button"`
- [x] Checkboxes: `aria-label="Mark '{text}' as {complete|incomplete}"`
- [x] Edit buttons: `aria-label="Edit: {text}"`
- [x] Delete buttons: `aria-label="Delete: {text}"`
- [x] Filter tabs: `role="tab"`, `aria-selected` updated on every render
- [x] Validation message: `role="alert"`, `aria-live="assertive"`
- [x] `:focus-visible` outline applied globally
- [x] `@media (prefers-reduced-motion: reduce)` disables all animations

---

## Task 20: Property-Based Tests

**Requirement refs:** All requirements — invariant verification  
**Status:** ✅ Done — 22 tests, 0 failures

- [x] Install `fast-check` as devDependency (`npm install fast-check --save-dev`)
- [x] Create `tests/property.test.js` with 22 tests across 8 invariant categories:
  1. Add invariants (count +1, task appears, no mutation)
  2. Delete invariants (count -1, task absent, no-op on missing id)
  3. Toggle invariants (double-toggle restores state, identity preserved, length unchanged)
  4. Filter invariants (subset, all=all, active=!completed, completed=completed, sum=total)
  5. Search invariants (subset, empty=all, whitespace=all, no false positives)
  6. ID uniqueness (batch of 50 tasks — all IDs unique)
  7. Persistence round-trip (JSON serialize/deserialize preserves all fields)
  8. Edit invariants (ID preserved, empty rejected)

**Run:**
```bash
node tests/property.test.js
# Expected: 22 passed, 0 failed
```

---

## Task 21: Functional Simulation Tests

**Status:** ✅ Done — 57 assertions, 0 failures

- [x] Create `tests/functional-sim.js` — exercises all 14 feature areas end-to-end
- [x] Create `tests/logic-audit.js` — 50 assertions verifying embedded `app.js` functions

**Run:**
```bash
node tests/functional-sim.js   # Expected: 57 passed, 0 failed
node tests/logic-audit.js      # Expected: 50 passed, 0 failed
npm test                        # Runs property tests
```

---

## Task 22: MCP Server

**Status:** ✅ Done

- [x] `mcp-server/todoflow-mcp.js` — JSON-RPC 2.0 over stdio
- [x] Tool: `get_project_info` — returns name, version, stack, file list
- [x] Tool: `get_test_status` — runs `node tests/property.test.js`, returns pass/fail counts
- [x] Tool: `get_task_statistics` — parses exported tasks JSON, returns completion stats
- [x] `.kiro/settings/mcp.json` — registers server for Kiro IDE

---

## Verification Checklist

Use this checklist to confirm the entire implementation is working:

```bash
# 1. Start the application
python3 -m http.server 8080
# Open http://localhost:8080

# 2. Property-based tests
node tests/property.test.js
# Expected output: ✅ All 22 property-based tests passed!

# 3. Functional simulation
node tests/functional-sim.js
# Expected output: Feature Simulation: 57 passed, 0 failed

# 4. Logic audit
node tests/logic-audit.js
# Expected output: Logic Audit: 50 passed, 0 failed

# 5. npm test
npm test
# Expected: 22 passed, 0 failed

# 6. MCP server
printf '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}\n' \
  | node mcp-server/todoflow-mcp.js
# Expected: JSON with get_project_info, get_test_status, get_task_statistics
```

**Manual verification steps:**

| Step | Action | Expected result |
|------|--------|----------------|
| Add | Type "Buy milk", click Add | Task appears at top, counter updates |
| Empty add | Click Add with empty input | "Task cannot be empty" message |
| Complete | Click checkbox on any task | Strikethrough, counter updates |
| Uncomplete | Click checkbox again | Strikethrough removed |
| Edit | Click ✏️, change text, Enter | Text updated |
| Edit cancel | Click ✏️, change text, Escape | Original text restored |
| Delete | Click 🗑️ | Task removed |
| Filter Active | Click "Active" tab | Only incomplete tasks shown |
| Filter Completed | Click "Completed" tab | Only completed tasks shown |
| Search | Type "milk" in search | Only matching tasks shown |
| Priority badge | Add with High priority | Red "high" badge visible |
| Due date | Add with past date | ⚠ overdue badge in red |
| Refresh | F5 / Cmd+R | All tasks restored from localStorage |
| Clear completed | Complete a task, click "Clear completed" | Completed tasks removed |
