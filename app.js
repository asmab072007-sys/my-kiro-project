/**
 * TodoFlow — app.js
 * Kiro University Build-Along
 *
 * Architecture:
 *  - Pure business logic lives in task-logic.js (testable in Node)
 *  - This file handles DOM, state, events, and persistence
 *  - render() derives DOM from state on every change
 *  - localStorage syncs on every state change
 */

'use strict';

/* =========================================
   LOAD PURE LOGIC
   (task-logic.js must be loaded before app.js in HTML)
   ========================================= */

const {
  createTask,
  addTask,
  deleteTask,
  toggleTask,
  editTask,
  filterTasks,
  searchTasks,
  getVisibleTasks,
  isOverdue,
  formatDueDate,
} = window.TodoLogic;

/* =========================================
   CONSTANTS
   ========================================= */
const STORAGE_KEY = 'todoflow_tasks';

/* =========================================
   STATE
   ========================================= */
let state = {
  tasks: [],
  filter: 'all',      // 'all' | 'active' | 'completed'
  search: '',
};

/* =========================================
   PERSISTENCE
   ========================================= */

function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(t =>
      t && typeof t.id === 'string' &&
      typeof t.text === 'string' &&
      typeof t.completed === 'boolean'
    );
  } catch (e) {
    console.warn('Could not load from localStorage:', e);
    return [];
  }
}

/* =========================================
   DOM REFERENCES
   ========================================= */
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const dueDateInput = document.getElementById('due-date-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptySub = document.getElementById('empty-sub');
const validationMsg = document.getElementById('validation-msg');
const searchInput = document.getElementById('search-input');
const filterTabs = document.querySelectorAll('.filter-tab');
const activeCountEl = document.getElementById('active-count');
const summaryTextEl = document.getElementById('summary-text');
const clearCompletedBtn = document.getElementById('clear-completed-btn');

/* =========================================
   VALIDATION
   ========================================= */
let validationTimer = null;

function showValidation(msg) {
  validationMsg.textContent = msg;
  clearTimeout(validationTimer);
  validationTimer = setTimeout(() => { validationMsg.textContent = ''; }, 3000);
}

function clearValidation() {
  validationMsg.textContent = '';
  clearTimeout(validationTimer);
}

/* =========================================
   RENDER
   ========================================= */

function render() {
  const visible = getVisibleTasks(state.tasks, state.filter, state.search);
  const activeCount = state.tasks.filter(t => !t.completed).length;
  const completedCount = state.tasks.filter(t => t.completed).length;

  // Header badge
  activeCountEl.textContent = activeCount;

  // Summary footer
  summaryTextEl.textContent =
    `${state.tasks.length} task${state.tasks.length !== 1 ? 's' : ''} total · ${completedCount} completed`;

  // Clear completed button
  clearCompletedBtn.hidden = completedCount === 0;

  // Filter tabs
  filterTabs.forEach(tab => {
    const isActive = tab.dataset.filter === state.filter;
    tab.classList.toggle('filter-tab--active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  // Empty state
  if (visible.length === 0) {
    taskList.hidden = true;
    emptyState.hidden = false;
    if (state.tasks.length === 0) {
      emptyTitle.textContent = 'No tasks yet';
      emptySub.textContent = 'Add a task above to get started!';
    } else {
      emptyTitle.textContent = 'No tasks match';
      emptySub.textContent = 'Try a different filter or search term.';
    }
  } else {
    taskList.hidden = false;
    emptyState.hidden = true;
  }

  // Render task items
  taskList.innerHTML = '';
  visible.forEach(task => {
    taskList.appendChild(createTaskElement(task));
  });
}

function createTaskElement(task) {
  const li = document.createElement('li');
  li.className = `task-item${task.completed ? ' task-item--completed' : ''}`;
  li.dataset.id = task.id;

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'task-checkbox';
  checkbox.checked = task.completed;
  checkbox.setAttribute('aria-label',
    `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
  checkbox.addEventListener('change', () => handleToggle(task.id));

  // Body
  const body = document.createElement('div');
  body.className = 'task-body';

  const textEl = document.createElement('span');
  textEl.className = 'task-text';
  textEl.textContent = task.text;

  const meta = document.createElement('div');
  meta.className = 'task-meta';

  // Priority badge
  const badge = document.createElement('span');
  badge.className = `priority-badge priority-badge--${task.priority}`;
  badge.textContent = task.priority;
  meta.appendChild(badge);

  // Due date
  if (task.dueDate) {
    const due = document.createElement('span');
    due.className = `due-date${isOverdue(task) ? ' due-date--overdue' : ''}`;
    due.textContent = `${isOverdue(task) ? '⚠ ' : '📅 '}${formatDueDate(task.dueDate)}`;
    meta.appendChild(due);
  }

  body.appendChild(textEl);
  body.appendChild(meta);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'task-actions';

  const editBtn = document.createElement('button');
  editBtn.className = 'btn btn--icon btn--edit';
  editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
  editBtn.textContent = '✏️';
  editBtn.addEventListener('click', () => handleEditStart(task.id, li, textEl));

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn--icon btn--delete';
  deleteBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
  deleteBtn.textContent = '🗑️';
  deleteBtn.addEventListener('click', () => handleDelete(task.id));

  actions.appendChild(editBtn);
  actions.appendChild(deleteBtn);

  li.appendChild(checkbox);
  li.appendChild(body);
  li.appendChild(actions);

  return li;
}

/* =========================================
   EVENT HANDLERS
   ========================================= */

function handleAdd() {
  const text = taskInput.value.trim();
  if (!text) {
    showValidation('Task cannot be empty');
    taskInput.focus();
    return;
  }
  clearValidation();

  const task = createTask(text, prioritySelect.value, dueDateInput.value || null);
  state.tasks = addTask(state.tasks, task);
  saveTasks(state.tasks);

  // Reset inputs
  taskInput.value = '';
  dueDateInput.value = '';
  prioritySelect.value = 'medium';
  taskInput.focus();

  render();

  // Animate new item
  const firstItem = taskList.querySelector('.task-item');
  if (firstItem) {
    firstItem.classList.add('task-item--new');
    firstItem.addEventListener('animationend',
      () => firstItem.classList.remove('task-item--new'), { once: true });
  }
}

function handleToggle(id) {
  state.tasks = toggleTask(state.tasks, id);
  saveTasks(state.tasks);
  render();
}

function handleDelete(id) {
  state.tasks = deleteTask(state.tasks, id);
  saveTasks(state.tasks);
  render();
}

function handleEditStart(id, li, textEl) {
  const task = state.tasks.find(t => t.id === id);
  if (!task) return;

  const editInputEl = document.createElement('input');
  editInputEl.type = 'text';
  editInputEl.className = 'task-edit-input';
  editInputEl.value = task.text;
  editInputEl.setAttribute('aria-label', 'Edit task text');

  textEl.replaceWith(editInputEl);
  editInputEl.focus();
  editInputEl.select();

  function saveEdit() {
    const newText = editInputEl.value.trim();
    if (newText && newText !== task.text) {
      state.tasks = editTask(state.tasks, id, newText);
      saveTasks(state.tasks);
    }
    render();
  }

  editInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); saveEdit(); }
    if (e.key === 'Escape') { render(); }
  });

  editInputEl.addEventListener('blur', saveEdit, { once: true });
}

function handleFilterChange(filter) {
  state.filter = filter;
  render();
}

function handleSearch(query) {
  state.search = query;
  render();
}

function handleClearCompleted() {
  state.tasks = state.tasks.filter(t => !t.completed);
  saveTasks(state.tasks);
  render();
}

/* =========================================
   EVENT LISTENERS
   ========================================= */

addBtn.addEventListener('click', handleAdd);

taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleAdd();
});

taskInput.addEventListener('input', () => {
  if (taskInput.value.trim()) clearValidation();
});

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => handleFilterChange(tab.dataset.filter));
});

searchInput.addEventListener('input', (e) => handleSearch(e.target.value));

clearCompletedBtn.addEventListener('click', handleClearCompleted);

/* =========================================
   INIT
   ========================================= */

function init() {
  state.tasks = loadTasks();
  render();
}

init();
