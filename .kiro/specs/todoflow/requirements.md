# TodoFlow — Requirements Specification

**Feature:** TodoFlow Task Management Application  
**Type:** Existing implementation — spec written from source of truth  
**Status:** ✅ Complete  
**Source files:** `app.js` · `task-logic.js` · `index.html` · `style.css`  
**Run:** `python3 -m http.server 8080` → `http://localhost:8080`

---

## Introduction

TodoFlow is a **client-side, single-page task management application** that runs entirely in the browser. There is no backend, no authentication, no build step, and no installation required. Tasks are persisted automatically in `localStorage`. The application is designed to be opened, used, and relied on immediately.

---

## Requirements

### Requirement 1 — Add Task

**User Story:**
As a user, I want to add a task with text, priority, and an optional due date, so that I can track what I need to do.

**Acceptance Criteria:**

1. WHEN the user types non-empty text and clicks "Add task" or presses Enter  
   THEN a new task appears at the top of the task list  
   AND the task is saved to localStorage  
   AND the Total and Active counters increment by 1  
   AND the input field is cleared and focused

2. WHEN the user attempts to add a task with empty or whitespace-only text  
   THEN no task is created  
   AND the inline message "Task cannot be empty" is displayed  
   AND the message automatically clears after 3 seconds

3. WHEN a new task is created  
   THEN it has the fields: `id` (unique string), `text` (trimmed), `completed: false`, `priority` (from select), `dueDate` (from date input or null), `createdAt` (ISO timestamp)

4. WHEN the priority select is set to an invalid value  
   THEN the task is created with `priority: 'medium'` as the default

---

### Requirement 2 — Complete and Uncomplete a Task

**User Story:**
As a user, I want to mark a task as complete or incomplete by clicking its checkbox, so that I can track my progress.

**Acceptance Criteria:**

1. GIVEN an active task is displayed  
   WHEN the user clicks the task checkbox  
   THEN `task.completed` becomes `true`  
   AND the task gains strikethrough styling and reduced opacity  
   AND the Active counter decrements by 1  
   AND the Completed counter increments by 1  
   AND the change is saved to localStorage

2. GIVEN a completed task is displayed  
   WHEN the user clicks the task checkbox  
   THEN `task.completed` becomes `false`  
   AND the strikethrough and reduced opacity are removed  
   AND the Active counter increments by 1  
   AND the Completed counter decrements by 1  
   AND the change is saved to localStorage

3. WHEN a task is toggled twice  
   THEN `task.completed` returns to its original value  
   AND all other task fields (id, text, priority, dueDate) are unchanged

---

### Requirement 3 — Edit a Task

**User Story:**
As a user, I want to edit a task's text inline, so that I can correct mistakes or update task details without deleting and recreating it.

**Acceptance Criteria:**

1. GIVEN a task is visible  
   WHEN the user clicks the ✏️ edit button  
   THEN the task text span is replaced by a focused text input pre-filled with the current text

2. WHEN the user types new text and presses Enter OR clicks away (blur)  
   THEN the task text is updated to the trimmed new value  
   AND the change is saved to localStorage  
   AND the input is replaced by the updated task text span

3. WHEN the user presses Escape while editing  
   THEN the original text is restored without any change to localStorage

4. WHEN the user clears the input and presses Enter  
   THEN the edit is rejected silently (original text is preserved)

5. WHEN a second task's edit button is clicked while another task is already in edit mode  
   THEN the first edit is committed (via blur) before the second edit begins

---

### Requirement 4 — Delete a Task

**User Story:**
As a user, I want to delete a task so that I can permanently remove items I no longer need.

**Acceptance Criteria:**

1. GIVEN a task is visible  
   WHEN the user clicks the 🗑️ delete button  
   THEN the task is immediately removed from the list  
   AND removed from localStorage  
   AND all counters update to reflect the removal

2. WHEN a task is deleted  
   THEN no other tasks are affected

---

### Requirement 5 — Filter Tasks

**User Story:**
As a user, I want to filter tasks by All, Active, or Completed so that I can focus on what is relevant.

**Acceptance Criteria:**

1. WHEN the user clicks the "All" filter tab  
   THEN all tasks are shown (subject to the current search)  
   AND the "All" tab has the active visual state

2. WHEN the user clicks the "Active" filter tab  
   THEN only tasks where `completed === false` are shown  
   AND no completed task is visible

3. WHEN the user clicks the "Completed" filter tab  
   THEN only tasks where `completed === true` are shown  
   AND no active task is visible

4. WHEN the user clicks a sidebar navigation item (Dashboard / My Tasks / Active / Completed)  
   THEN the corresponding filter is applied  
   AND the filter tabs in the toolbar update to match

5. WHEN the active filter has no matching tasks  
   THEN the empty state is shown with "No tasks match"

---

### Requirement 6 — Search Tasks

**User Story:**
As a user, I want to search tasks by text so that I can quickly find a specific item.

**Acceptance Criteria:**

1. WHEN the user types in the search box  
   THEN the task list immediately shows only tasks whose text contains the query (case-insensitive)  
   AND the search is applied on top of the current filter

2. WHEN the user clears the search input  
   THEN all tasks matching the current filter are shown again

3. WHEN search returns no results  
   THEN the empty state is shown with "No tasks match"

4. WHEN search is active AND a filter is applied  
   THEN only tasks that satisfy BOTH the filter AND the search query are shown

---

### Requirement 7 — Set Priority

**User Story:**
As a user, I want to assign a priority (Low, Medium, High) to each task so that I can identify what is most important.

**Acceptance Criteria:**

1. WHEN the user adds a task with priority "high"  
   THEN a red pill badge labelled "high" appears in the task's metadata row

2. WHEN the user adds a task with priority "medium"  
   THEN an amber pill badge labelled "medium" appears

3. WHEN the user adds a task with priority "low"  
   THEN a green pill badge labelled "low" appears

4. WHEN a task is displayed  
   THEN the priority badge is always visible (not hidden until hover)

5. WHEN the priority select has no value selected  
   THEN the task defaults to "medium" priority

---

### Requirement 8 — Set Due Date

**User Story:**
As a user, I want to optionally set a due date on a task so that I know when it needs to be completed.

**Acceptance Criteria:**

1. WHEN the user sets a due date and adds a task  
   THEN the due date is stored as a `YYYY-MM-DD` string  
   AND displayed in the task as "Mon DD, YYYY" with a 📅 icon

2. WHEN the due date input is left empty  
   THEN `task.dueDate` is stored as `null`  
   AND no due date is shown on the task

3. WHEN a task has a due date that is earlier than today's date  
   AND the task is not completed  
   THEN the task is marked as overdue  
   AND the due date is displayed with a ⚠ prefix and red warning styling

4. WHEN a task is completed  
   THEN it is never shown as overdue regardless of its due date

5. WHEN the page is refreshed  
   THEN due dates are restored exactly as stored

---

### Requirement 9 — Task Counters and Progress

**User Story:**
As a user, I want to see live statistics so that I can understand my workload and progress at a glance.

**Acceptance Criteria:**

1. AFTER any task is added, deleted, completed, or uncompleted  
   THEN all of the following update immediately:
   - `stat-total` = total number of tasks
   - `active-count` (In Progress) = tasks where `!completed`
   - `stat-done` (Completed) = tasks where `completed`
   - `stat-progress` = `Math.round(done / total * 100)` % (0% when total = 0)
   - Sidebar nav counts (nav-total, nav-active, nav-done)
   - Footer summary text
   - Visible-count badge in the toolbar

2. WHEN the progress percentage changes  
   THEN the circular SVG progress ring in the sidebar animates to the new value  
   AND the "X of Y done" text below it updates

3. WHEN there are zero tasks  
   THEN `stat-progress` shows "0%"  
   AND the progress ring is empty

---

### Requirement 10 — localStorage Persistence

**User Story:**
As a user, I want my tasks to survive a page refresh so that I never lose my work.

**Acceptance Criteria:**

1. AFTER any task mutation (add / edit / delete / toggle / clear completed)  
   THEN `localStorage['todoflow_tasks']` is immediately updated with the current task array as JSON

2. WHEN the page loads  
   THEN tasks are read from `localStorage['todoflow_tasks']`  
   AND every task with valid `id` (string), `text` (string), `completed` (boolean) is restored  
   AND any malformed entry is silently discarded

3. WHEN localStorage contains corrupt JSON or a non-array value  
   THEN the application starts with an empty task list  
   AND no JavaScript error is thrown

4. WHEN localStorage is full or write access is denied  
   THEN the error is caught and logged with `console.warn`  
   AND the application continues to function normally for the session

---

### Requirement 11 — Empty States

**User Story:**
As a user, when there are no tasks to display, I want to see a helpful message instead of a blank area.

**Acceptance Criteria:**

1. WHEN `state.tasks.length === 0`  
   THEN the task list is hidden  
   AND the empty state shows the SVG illustration, "All clear!", and "You have no tasks here. Add one to get started."

2. WHEN tasks exist but none match the current filter or search  
   THEN the task list is hidden  
   AND the empty state shows "No tasks match" and "Try a different filter or search term."

3. WHEN at least one task is visible  
   THEN the empty state is hidden  
   AND the task list is shown

---

### Requirement 12 — Clear Completed

**User Story:**
As a user, I want to remove all completed tasks at once so that I can declutter my list.

**Acceptance Criteria:**

1. WHEN there are one or more completed tasks  
   THEN the "Clear completed" button is visible

2. WHEN there are no completed tasks  
   THEN the "Clear completed" button is hidden

3. WHEN the user clicks "Clear completed"  
   THEN all tasks where `completed === true` are removed from `state.tasks`  
   AND removed from localStorage  
   AND the task list and counters update immediately

---

### Requirement 13 — Responsive Layout and Accessibility

**User Story:**
As a user, I want the application to work on any screen size and be usable with a keyboard.

**Acceptance Criteria:**

1. AT viewport widths from 320 px to 1440 px  
   THEN the layout adapts without horizontal scrolling  
   AND all controls remain usable

2. WHEN viewport width is below 720 px  
   THEN the sidebar becomes a horizontal top navigation bar

3. ALL interactive elements (add, checkbox, edit, delete, filter, search, clear completed)  
   CAN be reached and activated using keyboard Tab + Enter/Space

4. WHEN an element receives focus  
   THEN a visible focus outline is shown

5. ALL icon-only buttons  
   HAVE an `aria-label` describing their action and target task

6. WHEN the user has `prefers-reduced-motion` enabled  
   THEN all CSS transitions and animations are disabled

---

## Non-Requirements (Out of Scope)

- User authentication or accounts
- Multi-user collaboration or syncing
- Server-side storage or API calls
- Task ordering / drag-and-drop reordering
- Sub-tasks or task hierarchies
- Recurring tasks or reminders
- Editing priority or due date after task creation
- Dark mode
