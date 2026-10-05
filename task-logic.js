/**
 * TodoFlow — task-logic.js
 * Pure business logic with no DOM dependencies.
 * Shared by app.js (browser) and tests/property.test.js (Node).
 */

'use strict';

const PRIORITIES = ['low', 'medium', 'high'];

/**
 * Generate a unique ID.
 * @returns {string}
 */
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Create a new task object.
 * @param {string} text
 * @param {'low'|'medium'|'high'} priority
 * @param {string|null} dueDate
 * @returns {object}
 */
function createTask(text, priority = 'medium', dueDate = null) {
  return {
    id: generateId(),
    text: text.trim(),
    completed: false,
    priority: PRIORITIES.includes(priority) ? priority : 'medium',
    dueDate: dueDate || null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Add a task to a task array. Returns new array.
 * @param {object[]} tasks
 * @param {object} task
 * @returns {object[]}
 */
function addTask(tasks, task) {
  return [task, ...tasks];
}

/**
 * Delete a task by ID. Returns new array.
 * @param {object[]} tasks
 * @param {string} id
 * @returns {object[]}
 */
function deleteTask(tasks, id) {
  return tasks.filter(t => t.id !== id);
}

/**
 * Toggle completion of a task. Returns new array.
 * @param {object[]} tasks
 * @param {string} id
 * @returns {object[]}
 */
function toggleTask(tasks, id) {
  return tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
}

/**
 * Edit a task's text. Returns new array.
 * @param {object[]} tasks
 * @param {string} id
 * @param {string} newText
 * @returns {object[]}
 */
function editTask(tasks, id, newText) {
  const trimmed = newText.trim();
  if (!trimmed) return tasks;
  return tasks.map(t => t.id === id ? { ...t, text: trimmed } : t);
}

/**
 * Filter tasks by status.
 * @param {object[]} tasks
 * @param {'all'|'active'|'completed'} filter
 * @returns {object[]}
 */
function filterTasks(tasks, filter) {
  if (filter === 'active') return tasks.filter(t => !t.completed);
  if (filter === 'completed') return tasks.filter(t => t.completed);
  return tasks;
}

/**
 * Search tasks by text (case-insensitive).
 * @param {object[]} tasks
 * @param {string} query
 * @returns {object[]}
 */
function searchTasks(tasks, query) {
  if (!query.trim()) return tasks;
  const q = query.trim().toLowerCase();
  return tasks.filter(t => t.text.toLowerCase().includes(q));
}

/**
 * Get visible tasks (filter + search applied).
 * @param {object[]} tasks
 * @param {string} filter
 * @param {string} search
 * @returns {object[]}
 */
function getVisibleTasks(tasks, filter, search) {
  return searchTasks(filterTasks(tasks, filter), search);
}

/**
 * Check if a task is overdue.
 * @param {object} task
 * @returns {boolean}
 */
function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;
  const today = new Date().toISOString().slice(0, 10);
  return task.dueDate < today;
}

/**
 * Format a due date for display.
 * @param {string} dueDate
 * @returns {string}
 */
function formatDueDate(dueDate) {
  if (!dueDate) return '';
  const [year, month, day] = dueDate.split('-');
  const date = new Date(+year, +month - 1, +day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* =========================================
   EXPORTS (Node.js + browser fallback)
   ========================================= */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
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
    generateId,
    PRIORITIES,
  };
}
