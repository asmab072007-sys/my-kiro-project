# TodoFlow — Requirements

**Version:** 1.0.0  
**Status:** Implemented  
**Stack:** HTML5 · CSS3 · Vanilla JavaScript (ES5-compatible IIFE) · localStorage  
**Entry point:** `index.html` + `app.js` + `style.css`  
**Run command:** `python3 -m http.server 8080` → open `http://localhost:8080`

---

## 1. Purpose

TodoFlow is a client-side task-management web application. It lets a single user create, organise, and track daily tasks entirely in the browser with no backend, no login, and no build step required. All data persists via `localStorage` under the key `todoflow_tasks`.

---

## 2. User Stories

### US-1 — Add Task
```
AS A user
I WANT TO type a task description, choose a priority and optional due date,
  then press Enter or click "Add task"
SO THAT the task immediately appears at the top of my task list
  and is saved for future sessions
```

### US-2 — Complete a Task
```
AS A user
I WANT TO click the checkbox next to a task
SO THAT the task is visually marked done (strikethrough, reduced opacity)
  and the active / completed counters update instantly
```

### US-3 — Uncomplete a Task
```
AS A user
I WANT TO click the checkbox on a completed task
SO THAT the task reverts to active status
  and the counters reflect the change
```

### US-4 — Edit a Task
```
AS A user
I WANT TO click the edit button (✏️) on a task
SO THAT I can update the task text inline,
  save with Enter or by clicking away,
  and cancel without saving with Escape
```

### US-5 — Delete a Task
```
AS A user
I WANT TO click the delete button (🗑️) on a task
SO THAT the task is permanently removed from the list and from localStorage
```

### US-6 — Search Tasks
```
AS A user
I WANT TO type in the search box
SO THAT the task list filters in real time to only show tasks
  whose text contains the search term (case-insensitive)
```

### US-7 — Filter by Status
```
AS A user
I WANT TO click All / Active / Completed filter tabs
SO THAT I only see tasks matching that status
  while search continues to apply within the filtered set
```

### US-8 — Set Priority
```
AS A user
I WANT TO choose Low, Medium, or High priority when adding a task
SO THAT each task displays a colour-coded priority badge
  (green = Low, amber = Medium, red = High)
```

### US-9 — Set Due Date
```
AS A user
I WANT TO optionally enter a due date when adding a task
SO THAT the task shows the formatted date,
  and past-due active tasks are highlighted with an overdue warning
```

### US-10 — See Task Counts
```
AS A user
I WANT TO see live counters for Total, In Progress (active), Completed,
  and a completion percentage
SO THAT I can understand my workload at a glance without counting manually
```

### US-11 — Persist Tasks Across Sessions
```
AS A user
I WANT my tasks, completion states, priorities, and due dates
  to still be there when I refresh or reopen the browser
SO THAT I never lose my work
```

### US-12 — Clear Completed Tasks
```
AS A user
I WANT TO click "Clear completed" when it is visible
SO THAT all completed tasks are removed from the list and localStorage in one action
```

### US-13 — See an Empty State
```
AS A user
WHEN the task list is empty (no tasks, or no results match filter/search)
I WANT TO see a friendly message instead of a blank area
SO THAT I understand the state of the application
```

---

## 3. Functional Requirements

| ID    | Requirement |
|-------|-------------|
| FR-1  | User can add a task with non-empty, trimmed text (max 200 characters) |
| FR-2  | Attempting to add an empty or whitespace-only task shows the inline message "Task cannot be empty" and does NOT create a task |
| FR-3  | Priority is set at creation time: `low`, `medium`, or `high`; any invalid value defaults to `medium` |
| FR-4  | Due date is optional; stored as `YYYY-MM-DD` string or `null` |
| FR-5  | New tasks are prepended to the top of the list |
| FR-6  | User can toggle task completion; toggle is repeatable (completing and uncompleting must both work) |
| FR-7  | User can edit task text inline; empty text after trim is rejected silently (original text preserved) |
| FR-8  | User can delete any task; deletion is immediate, no confirmation dialog |
| FR-9  | Filter "All" shows every task regardless of status |
| FR-10 | Filter "Active" shows only tasks where `completed === false` |
| FR-11 | Filter "Completed" shows only tasks where `completed === true` |
| FR-12 | Search is case-insensitive substring match applied on top of the active filter |
| FR-13 | Clearing search restores all tasks that match the current filter |
| FR-14 | A task is overdue if: `dueDate` is not null, `dueDate < today` (ISO string comparison), and `completed === false` |
| FR-15 | Overdue tasks display the due date with a red warning badge (⚠) |
| FR-16 | Completed overdue tasks are NOT marked overdue |
| FR-17 | The header stat cards always show live counts: Total, Active (In Progress), Completed, Completion % |
| FR-18 | The sidebar progress ring animates to reflect `completedCount / totalCount × 100` |
| FR-19 | "Clear completed" button is hidden when there are no completed tasks; visible otherwise |
| FR-20 | All tasks are saved to `localStorage` under the key `todoflow_tasks` as a JSON array after every mutation |
| FR-21 | On page load, tasks are read from `localStorage`; corrupt or non-array data is discarded gracefully |
| FR-22 | The empty state shows different text depending on context: "No tasks yet" (nothing added), "No tasks match" (filter/search has no results) |

---

## 4. Non-Functional Requirements

| ID     | Requirement |
|--------|-------------|
| NFR-1  | No backend, no build step, no npm install required to run |
| NFR-2  | Single `python3 -m http.server 8080` command serves the complete application |
| NFR-3  | No uncaught JavaScript errors in the browser console |
| NFR-4  | App is usable on screens from 320 px to 1440 px wide |
| NFR-5  | All interactive elements (add, edit, delete, complete, filter, search) are keyboard accessible |
| NFR-6  | Edit mode: Enter saves, Escape cancels, clicking away saves |
| NFR-7  | No external runtime dependencies (fonts loaded from Google Fonts CDN are the only network request) |
| NFR-8  | `localStorage` write errors are caught and logged; they must not crash the application |
| NFR-9  | Color contrast ratio ≥ 4.5:1 for all body text against its background |
| NFR-10 | `prefers-reduced-motion` media query disables animations |

---

## 5. Acceptance Criteria

All criteria follow the **GIVEN / WHEN / THEN** format and are tested in `tests/functional-sim.js` and `tests/property.test.js`.

### AC-1: Add Task
```
GIVEN the task input is focused and contains non-empty text
  AND a priority is selected (defaults to "medium")
WHEN the user clicks "Add task" or presses Enter
THEN a new task object is created with the given text (trimmed), priority, dueDate, completed=false
AND the task appears at the top of the visible task list
AND `localStorage['todoflow_tasks']` includes the new task
AND the Total and Active counters increment by 1
AND the input field is cleared and focused
```

### AC-2: Reject Empty Task
```
GIVEN the task input is empty or contains only whitespace
WHEN the user clicks "Add task" or presses Enter
THEN no task is created
AND the inline validation message "Task cannot be empty" appears
AND the message disappears after 3 seconds
```

### AC-3: Complete Task
```
GIVEN an active (completed=false) task is visible
WHEN the user clicks its checkbox
THEN task.completed becomes true
AND the task text gains strikethrough styling and reduced opacity
AND the Active counter decrements by 1
AND the Completed counter increments by 1
AND the change is persisted to localStorage
```

### AC-4: Uncomplete Task
```
GIVEN a completed task is visible
WHEN the user clicks its checkbox
THEN task.completed becomes false
AND the strikethrough and reduced opacity are removed
AND the Active counter increments by 1
AND the Completed counter decrements by 1
AND the change is persisted to localStorage
```

### AC-5: Edit Task
```
GIVEN a task exists
WHEN the user clicks the ✏️ edit button
THEN the task text is replaced by an inline text input pre-filled with the current text

WHEN the user types new text and presses Enter (or clicks away)
THEN the task.text is updated to the trimmed new text
AND the change is persisted to localStorage

WHEN the user presses Escape
THEN the input is removed and the original text is restored without saving

WHEN the user clears the input and presses Enter
THEN the original text is preserved (empty edit is rejected)
```

### AC-6: Delete Task
```
GIVEN a task exists
WHEN the user clicks the 🗑️ delete button
THEN the task is removed from the list immediately
AND removed from localStorage
AND all counters update to reflect the removal
```

### AC-7: Filter — All
```
GIVEN tasks with mixed completion states exist
WHEN the user selects the "All" filter tab
THEN every task in state.tasks (matching the current search) is shown
AND the "All" tab has the active/selected visual state
```

### AC-8: Filter — Active
```
GIVEN tasks with mixed completion states exist
WHEN the user selects the "Active" filter tab
THEN only tasks where completed=false (and matching search) are shown
AND no completed task is visible
```

### AC-9: Filter — Completed
```
GIVEN at least one completed task exists
WHEN the user selects the "Completed" filter tab
THEN only tasks where completed=true (and matching search) are shown
AND no active task is visible
```

### AC-10: Search
```
GIVEN tasks exist
WHEN the user types a search query (e.g. "kiro")
THEN the list shows only tasks whose text contains "kiro" (case-insensitive)

WHEN the user clears the search input
THEN all tasks matching the current filter are shown again
```

### AC-11: Search + Filter Combined
```
GIVEN tasks exist with mixed states
WHEN filter = "active" AND search = "review"
THEN only active tasks containing "review" are shown
AND completed tasks containing "review" are NOT shown
```

### AC-12: Priority Badge
```
GIVEN a task with priority = "high" is displayed
THEN a red badge labelled "high" appears in the task metadata row

GIVEN a task with priority = "medium"
THEN an amber badge labelled "medium" appears

GIVEN a task with priority = "low"
THEN a green badge labelled "low" appears
```

### AC-13: Due Date Display
```
GIVEN a task has dueDate = "2026-12-31"
WHEN the task is rendered
THEN the due date is displayed as "Dec 31, 2026" with a 📅 icon
```

### AC-14: Overdue Detection
```
GIVEN a task has a dueDate that is earlier than today's ISO date
  AND the task is not completed
WHEN the task is rendered
THEN the due date element has class "due-date--overdue"
AND displays a ⚠ warning prefix

GIVEN a task is completed (regardless of dueDate)
THEN it is NOT shown as overdue
```

### AC-15: Persistence
```
GIVEN one or more tasks exist (with various states, priorities, due dates)
WHEN the user refreshes the browser
THEN every task is restored from localStorage with the same id, text,
  completed, priority, dueDate, and createdAt values
```

### AC-16: Corrupt localStorage Recovery
```
GIVEN localStorage contains malformed JSON or a non-array value
WHEN the app initialises
THEN it starts with an empty task list
AND no JavaScript error is thrown
```

### AC-17: Counters
```
GIVEN the app state changes (add/edit/delete/toggle)
THEN the following always reflect the true state:
  - stat-total     = state.tasks.length
  - active-count   = tasks where !completed
  - stat-done      = tasks where completed
  - stat-progress  = Math.round(done/total * 100)% (0% when total=0)
  - progress ring  = animates to match stat-progress
```

### AC-18: Empty States
```
GIVEN state.tasks.length === 0
THEN the task list is hidden and the empty state shows "No tasks yet"

GIVEN state.tasks.length > 0 but visible.length === 0
THEN the empty state shows "No tasks match"
```

---

## 6. Task Data Model

The canonical task object stored in localStorage and held in `state.tasks`:

```javascript
{
  id:        string,   // generateId() = Date.now().toString(36) + '-' + random(7 chars)
  text:      string,   // non-empty, trimmed; max 200 chars enforced by HTML attribute
  completed: boolean,  // false on creation; toggled by handleToggle()
  priority:  string,   // 'low' | 'medium' | 'high'; default 'medium'
  dueDate:   string|null, // 'YYYY-MM-DD' ISO date string, or null
  createdAt: string    // new Date().toISOString() at creation time
}
```

**localStorage key:** `todoflow_tasks`  
**Storage format:** `JSON.stringify(state.tasks)` — a JSON array of task objects.

---

## 7. Out of Scope

- User authentication or accounts
- Multi-user collaboration
- Server-side storage or sync
- Task ordering / drag-and-drop reordering
- Sub-tasks or task nesting
- Recurring tasks
- Notifications or reminders
- Editing priority or due date after creation
