# TodoFlow — Implementation Tasks

**Version:** 1.0.0  
**Status:** All tasks completed — this list documents the implementation as built  
**Derived from:** `requirements.md` (AC-1 through AC-18) and `design.md`

Each task maps to one or more acceptance criteria and can be verified independently.

---

## Phase 1 — Project Foundation

### T-1: Project scaffold
- [x] Create `index.html` with semantic HTML structure (sidebar + main layout)
- [x] Create `style.css` with CSS custom properties
- [x] Create `app.js` as a self-contained IIFE
- [x] Confirm `python3 -m http.server 8080` serves the app correctly
- **Verifies:** NFR-1, NFR-2

### T-2: Task data model
- [x] Define the canonical Task object shape in `app.js` (`createTask` function)
- [x] Implement `generateId()` using `Date.now().toString(36)` + random suffix
- [x] Mirror functions in `task-logic.js` for Node.js test access
- **Verifies:** Data model in `requirements.md` §6

### T-3: localStorage layer
- [x] Implement `saveTasks(tasks)` — `JSON.stringify` to `localStorage['todoflow_tasks']`
- [x] Implement `loadTasks()` — parse, validate, filter corrupt entries, return `[]` on error
- [x] Wrap both functions in `try/catch` to handle storage errors gracefully
- **Verifies:** FR-20, FR-21, AC-15, AC-16, NFR-8

---

## Phase 2 — Core Task Operations

### T-4: Add task
- [x] Implement `addTask(tasks, task)` — prepend new task to array
- [x] Wire `handleAdd()` to Add button click and Enter keydown on task input
- [x] Validate non-empty text; show "Task cannot be empty" message on failure
- [x] Clear and re-focus input after successful add
- [x] Trigger `saveTasks` + `render()` after each add
- **Verifies:** FR-1, FR-2, FR-5, AC-1, AC-2

### T-5: Complete / uncomplete task
- [x] Implement `toggleTask(tasks, id)` — flip `completed` boolean, preserve all other fields
- [x] Wire checkbox `change` event in `buildTaskEl` to `handleToggle(id)`
- [x] Apply `task-item--completed` CSS class for visual completed state
- **Verifies:** FR-6, AC-3, AC-4

### T-6: Edit task
- [x] Implement `editTask(tasks, id, newText)` — update text if non-empty, return unchanged array otherwise
- [x] Implement `startEdit(id, li, textEl)` — inline DOM substitution (span → input)
- [x] Handle Enter (commit), Escape (cancel), blur (commit)
- [x] Use `handled` flag to prevent double-commit when DOM removal fires blur
- [x] Guard against concurrent edits (cancel existing edit before starting new)
- **Verifies:** FR-7, AC-5

### T-7: Delete task
- [x] Implement `deleteTask(tasks, id)` — filter out matching task
- [x] Wire delete button click in `buildTaskEl` to `handleDelete(id)`
- **Verifies:** FR-8, AC-6

### T-8: Clear completed
- [x] Implement `handleClearCompleted()` — filter `state.tasks` to remove all completed
- [x] Show "Clear completed" button only when `completedCount > 0`
- **Verifies:** FR-19, US-12

---

## Phase 3 — Filtering and Search

### T-9: Filter tabs
- [x] Implement `filterTasks(tasks, filter)` — `all/active/completed` switch
- [x] Wire each `.filter-tab` click to `handleFilterChange(filter)`
- [x] Update `filter-tab--active` class and `aria-selected` on each render
- [x] Wire sidebar nav items to the same `handleFilterChange` handler
- **Verifies:** FR-9, FR-10, FR-11, AC-7, AC-8, AC-9

### T-10: Search
- [x] Implement `searchTasks(tasks, query)` — case-insensitive substring match on `task.text`
- [x] Wire search input `input` event to `handleSearch(query)`
- [x] Compose filter then search in `getVisibleTasks`
- **Verifies:** FR-12, FR-13, AC-10, AC-11

---

## Phase 4 — Priority and Due Dates

### T-11: Priority
- [x] Add priority `<select>` to the add form (medium / low / high options)
- [x] Validate priority in `createTask` — invalid values default to `'medium'`
- [x] Render `priority-badge priority-badge--{low|medium|high}` in task metadata
- **Verifies:** FR-3, AC-12

### T-12: Due date
- [x] Add `<input type="date">` to the add form; pass value to `createTask`
- [x] Store as `YYYY-MM-DD` string or `null`
- [x] Render formatted date with `formatDueDate()` using `toLocaleDateString('en-US')`
- **Verifies:** FR-4, AC-13

### T-13: Overdue detection
- [x] Implement `isOverdue(task)` — compare `task.dueDate < today` (ISO lexicographic) AND `!task.completed`
- [x] Apply `due-date--overdue` CSS class with ⚠ prefix in `buildTaskEl`
- [x] Confirm completed tasks are never marked overdue
- **Verifies:** FR-14, FR-15, FR-16, AC-14

---

## Phase 5 — Counters and Statistics

### T-14: Live counters
- [x] Compute `activeCount`, `completedCount`, `pct` inside `render()`
- [x] Update `#active-count`, `#stat-total`, `#stat-done`, `#stat-progress`
- [x] Update sidebar counts `#nav-total`, `#nav-active`, `#nav-done`
- [x] Update toolbar visible-count badge `#visible-count-badge`
- [x] Update footer `#summary-text`
- **Verifies:** FR-17, AC-17

### T-15: Progress ring
- [x] Set `stroke-dashoffset` on `#progress-ring-fill` to `circumference × (1 - pct/100)`
- [x] Update `#progress-pct` text and `#progress-sub` "X of Y done" text
- [x] Animate via CSS `transition: stroke-dashoffset 0.6s`
- [x] Respect `prefers-reduced-motion` (transition disabled via media query)
- **Verifies:** FR-18, NFR-10

---

## Phase 6 — UI and Empty States

### T-16: Empty state
- [x] Show `#empty-state` (display: '') when `visible.length === 0`
- [x] Show "No tasks yet" + add-prompt when `state.tasks.length === 0`
- [x] Show "No tasks match" + change-filter prompt when tasks exist but none visible
- [x] Hide `#task-list` (display: 'none') whenever empty state is shown
- **Verifies:** FR-22, AC-18

### T-17: Validation message
- [x] Show "Task cannot be empty" in `#validation-msg` on failed add
- [x] Auto-clear message after 3 seconds
- [x] Clear message immediately when user starts typing valid text
- [x] Use `role="alert"` and `aria-live="assertive"` for screen reader announcement
- **Verifies:** FR-2, AC-2

### T-18: Responsive layout
- [x] Sidebar becomes horizontal top nav at `< 720px`
- [x] Stats row switches to 2-column grid at `< 1100px`
- [x] Add form stacks vertically at `< 520px`
- [x] `btn--icon` always visible (opacity: 1) on mobile
- **Verifies:** NFR-4

### T-19: Accessibility
- [x] All interactive elements have `type="button"` to prevent accidental form submit
- [x] Checkboxes have `aria-label` describing the task and intended action
- [x] Edit/delete buttons have `aria-label` with the task text
- [x] Filter tabs have `role="tab"` and `aria-selected`
- [x] Validation message has `role="alert"` and `aria-live="assertive"`
- [x] Focus states visible via `:focus-visible` outline
- **Verifies:** NFR-5, NFR-9

---

## Phase 7 — Testing

### T-20: Property-based tests (`tests/property.test.js`)
- [x] Install `fast-check` as devDependency
- [x] Write 22 property-based tests for all 8 invariant categories
- [x] Run: `node tests/property.test.js` — all pass
- **Verifies:** Requirements §7

### T-21: Functional simulation (`tests/functional-sim.js`)
- [x] Write 57 assertions covering all 14 functional areas
- [x] Run: `node tests/functional-sim.js` — all pass

### T-22: Logic audit (`tests/logic-audit.js`)
- [x] Write 50 assertions testing all embedded `app.js` pure functions
- [x] Run: `node tests/logic-audit.js` — all pass

---

## Phase 8 — Kiro University Requirements

### T-23: Spec-driven development
- [x] Create `.kiro/specs/todoflow/requirements.md` (this set of docs)
- [x] Create `.kiro/specs/todoflow/design.md`
- [x] Create `.kiro/specs/todoflow/tasks.md`

### T-24: Steering documents
- [x] `.kiro/steering/product.md` — purpose, goals, non-goals
- [x] `.kiro/steering/coding-conventions.md` — JS style, file structure, accessibility
- [x] `.kiro/steering/ui-ux-conventions.md` — layout, colour, interaction patterns
- [x] `.kiro/steering/testing-conventions.md` — what to test, how to run tests

### T-25: Hook
- [x] `.kiro/hooks/validate-js-on-save.json` — PostFileSave Node.js syntax check on `.js` files

### T-26: MCP server
- [x] `mcp-server/todoflow-mcp.js` — JSON-RPC 2.0 over stdio
- [x] Tools: `get_project_info`, `get_test_status`, `get_task_statistics`
- [x] `.kiro/settings/mcp.json` registers it for Kiro

### T-27: Custom agent
- [x] `.kiro/agents/todo-qa-agent.md` — spec compliance + accessibility + test runner

### T-28: Powers
- [x] Used `bundled://investigate` workflow to verify spec compliance
- [x] Findings in `.agents/todoflow-spec-investigation.md`

---

## Verification Checklist

Run these commands to confirm the implementation is complete and correct:

```bash
# Start the app
python3 -m http.server 8080
# Open http://localhost:8080

# Run all tests
node tests/property.test.js     # Expected: 22 passed, 0 failed
node tests/functional-sim.js    # Expected: 57 passed, 0 failed
node tests/logic-audit.js       # Expected: 50 passed, 0 failed
npm test                        # Runs property tests via npm script

# Verify MCP server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
  | node mcp-server/todoflow-mcp.js
```
