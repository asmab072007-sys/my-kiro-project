# TodoFlow — Specification

## 1. Project Overview

**Name:** TodoFlow  
**Type:** Client-side To-Do web application  
**Stack:** HTML, CSS, Vanilla JavaScript, localStorage  
**Goal:** A polished, responsive task manager that runs entirely in the browser with no backend.

---

## 2. User Stories

### US-1: Add Task
AS A user  
I WANT TO add a new task with text, priority, and optional due date  
SO THAT I can track what I need to do

### US-2: Complete Task
AS A user  
I WANT TO mark a task as completed  
SO THAT I can track my progress

### US-3: Edit Task
AS A user  
I WANT TO edit an existing task's text  
SO THAT I can correct mistakes or update task details

### US-4: Delete Task
AS A user  
I WANT TO delete a task  
SO THAT I can remove tasks I no longer need

### US-5: Filter Tasks
AS A user  
I WANT TO filter tasks by All / Active / Completed  
SO THAT I can focus on what's relevant

### US-6: Search Tasks
AS A user  
I WANT TO search tasks by text  
SO THAT I can quickly find a specific task

### US-7: Set Priority
AS A user  
I WANT TO assign Low / Medium / High priority to tasks  
SO THAT I can see what's most important

### US-8: Set Due Date
AS A user  
I WANT TO set a due date on a task  
SO THAT I know when something is due

### US-9: Persistent Storage
AS A user  
I WANT my tasks to persist when I refresh the browser  
SO THAT I don't lose my data

### US-10: Task Counts
AS A user  
I WANT TO see how many tasks are active and completed  
SO THAT I can understand my workload at a glance

---

## 3. Functional Requirements

| ID    | Requirement |
|-------|-------------|
| FR-1  | User can add a task with non-empty text |
| FR-2  | User can set priority (low/medium/high) when adding a task |
| FR-3  | User can set an optional due date (YYYY-MM-DD) when adding a task |
| FR-4  | User can toggle task completion status |
| FR-5  | User can edit task text inline |
| FR-6  | User can delete a task |
| FR-7  | User can filter tasks: All, Active, Completed |
| FR-8  | User can search tasks by text (case-insensitive, real-time) |
| FR-9  | App displays count of active tasks and total tasks |
| FR-10 | Tasks persist in localStorage across page refreshes |
| FR-11 | Overdue tasks (past due date, not completed) are visually highlighted |
| FR-12 | Empty state is shown when no tasks match the current view |

---

## 4. Non-Functional Requirements

| ID     | Requirement |
|--------|-------------|
| NFR-1  | App loads in <500ms (no external API calls) |
| NFR-2  | Works in Chrome, Firefox, Safari (modern versions) |
| NFR-3  | Responsive: usable on screens 320px–1440px wide |
| NFR-4  | No backend, no authentication, no build step required |
| NFR-5  | localStorage handles up to 500 tasks without performance issues |
| NFR-6  | All interactive elements accessible via keyboard |
| NFR-7  | Color contrast ratio ≥ 4.5:1 for all text |

---

## 5. Acceptance Criteria

### AC-1: Add Task
```
GIVEN the app is open
WHEN the user enters non-empty text and clicks Add (or presses Enter)
THEN a new task appears at the top of the task list
AND the task is stored in localStorage
AND the active task counter increments by 1
```

### AC-2: Reject Empty Task
```
GIVEN the task input is empty or whitespace only
WHEN the user attempts to add a task
THEN no task is added
AND an inline validation message "Task cannot be empty" is displayed
```

### AC-3: Complete Task
```
GIVEN an active task exists
WHEN the user clicks the task's checkbox
THEN the task is marked completed (checkbox checked, text struck through)
AND the active count decrements by 1
AND the completed count increments by 1
```

### AC-4: Edit Task
```
GIVEN a task exists
WHEN the user clicks the edit button
THEN the task text becomes editable inline
WHEN the user saves (Enter or blur)
THEN the updated text is saved to localStorage
```

### AC-5: Delete Task
```
GIVEN a task exists
WHEN the user clicks the delete button
THEN the task is removed from the list
AND removed from localStorage
```

### AC-6: Filter Tasks
```
GIVEN tasks in various states exist
WHEN the user clicks "Active"
THEN only incomplete tasks are shown
WHEN the user clicks "Completed"
THEN only completed tasks are shown
WHEN the user clicks "All"
THEN all tasks are shown
```

### AC-7: Search Tasks
```
GIVEN tasks exist
WHEN the user types in the search box
THEN only tasks whose text contains the search term (case-insensitive) are shown
WHEN the search box is cleared
THEN all tasks matching the current filter are shown
```

### AC-8: Persistence
```
GIVEN tasks exist
WHEN the user refreshes the page
THEN all tasks are restored exactly as they were
```

### AC-9: Overdue Indicator
```
GIVEN a task has a due date in the past and is not completed
WHEN the task list renders
THEN the due date is displayed in red with an overdue indicator
```

### AC-10: Priority Badge
```
GIVEN a task has priority set
WHEN the task is displayed
THEN a colored priority badge is visible (green=low, yellow=medium, red=high)
```

---

## 6. Data Model

```typescript
interface Task {
  id: string;           // unique identifier (timestamp + random)
  text: string;         // task description, non-empty, trimmed
  completed: boolean;   // completion status
  priority: 'low' | 'medium' | 'high';  // default: 'medium'
  dueDate: string | null;  // ISO date 'YYYY-MM-DD' or null
  createdAt: string;    // ISO datetime string
}
```

---

## 7. Testing Requirements

- Property-based tests must verify all core invariants (see testing-conventions.md)
- Tests run without a browser via Node.js
- All 7 properties must pass consistently
