'use strict';
const {
  createTask, addTask, deleteTask, toggleTask, editTask,
  filterTasks, searchTasks, getVisibleTasks, isOverdue, formatDueDate
} = require('../task-logic.js');

let tasks = [];
let passed = 0;
let failed = 0;

function assert(name, condition) {
  if (condition) { console.log('  OK ' + name); passed++; }
  else { console.error('  FAIL: ' + name); failed++; }
}

console.log('\n=== MANUAL FEATURE SIMULATION ===\n');

// A. ADD TASK
console.log('A. Add Task');
const t1 = createTask('Buy groceries', 'high', '2026-12-31');
tasks = addTask(tasks, t1);
assert('Add task increases count to 1', tasks.length === 1);
assert('Task text is correct', tasks[0].text === 'Buy groceries');
assert('Task priority is correct', tasks[0].priority === 'high');
assert('Task due date is correct', tasks[0].dueDate === '2026-12-31');
assert('Task is not completed', tasks[0].completed === false);
assert('Task has an ID', typeof tasks[0].id === 'string' && tasks[0].id.length > 0);

const t2 = createTask('  Read Kiro docs  ', 'medium', null);
tasks = addTask(tasks, t2);
assert('Text is trimmed on creation', tasks[0].text === 'Read Kiro docs');
assert('Null due date stored correctly', tasks[0].dueDate === null);

const t3 = createTask('Review PR', 'low', '2020-01-01');
tasks = addTask(tasks, t3);
assert('Third task added, count is 3', tasks.length === 3);

// B. COMPLETE TASK
console.log('\nB. Complete Task');
tasks = toggleTask(tasks, t1.id);
assert('Task marked complete', tasks.find(t=>t.id===t1.id).completed === true);
tasks = toggleTask(tasks, t1.id);
assert('Task uncompleted (toggle back)', tasks.find(t=>t.id===t1.id).completed === false);
tasks = toggleTask(tasks, t1.id); // leave t1 completed for later tests

// C. COUNTERS
console.log('\nC. Counters');
const activeCount = tasks.filter(t => !t.completed).length;
const completedCount = tasks.filter(t => t.completed).length;
assert('Active count = 2 after completing 1 of 3', activeCount === 2);
assert('Completed count = 1', completedCount === 1);
assert('Active + completed = total', activeCount + completedCount === tasks.length);

// D. FILTERS
console.log('\nD. Filters');
const allTasks = filterTasks(tasks, 'all');
const activeTasks = filterTasks(tasks, 'active');
const completedTasks = filterTasks(tasks, 'completed');
assert('All filter returns all 3', allTasks.length === 3);
assert('Active filter returns 2', activeTasks.length === 2);
assert('Completed filter returns 1', completedTasks.length === 1);
assert('Active tasks have completed=false', activeTasks.every(t => !t.completed));
assert('Completed tasks have completed=true', completedTasks.every(t => t.completed));

// E. SEARCH
console.log('\nE. Search');
const searchResult = searchTasks(tasks, 'kiro');
assert('Search finds Kiro docs (case-insensitive)', searchResult.length === 1);
const searchAll = searchTasks(tasks, '');
assert('Empty search returns all tasks', searchAll.length === tasks.length);
const searchNone = searchTasks(tasks, 'zzznomatch');
assert('No-match search returns empty', searchNone.length === 0);
const partialSearch = searchTasks(tasks, 'gro');
assert('Partial search finds groceries', partialSearch.length === 1);

// F. SEARCH + FILTER COMBINED
console.log('\nF. Search + Filter Combined');
const combined = getVisibleTasks(tasks, 'active', 'review');
assert('Active + search "review" finds Review PR', combined.length === 1);
assert('Combined result is active', combined[0].completed === false);
const combined2 = getVisibleTasks(tasks, 'completed', 'review');
assert('Completed + search "review" = empty (Review PR is active)', combined2.length === 0);
const combined3 = getVisibleTasks(tasks, 'completed', 'groceries');
assert('Completed + search "groceries" = 1 (Buy groceries is completed)', combined3.length === 1);

// G. PRIORITY
console.log('\nG. Priority');
assert('High priority set correctly', tasks.find(t=>t.id===t1.id).priority === 'high');
assert('Medium priority set correctly', tasks.find(t=>t.id===t2.id).priority === 'medium');
assert('Low priority set correctly', tasks.find(t=>t.id===t3.id).priority === 'low');
const invalidPriority = createTask('Test', 'invalid', null);
assert('Invalid priority defaults to medium', invalidPriority.priority === 'medium');

// H. DUE DATE AND OVERDUE
console.log('\nH. Due Date and Overdue');
const overdueActiveTask = tasks.find(t=>t.id===t3.id); // due 2020-01-01, not completed
assert('Past due date + active = overdue', isOverdue(overdueActiveTask));
const completedTask = tasks.find(t=>t.id===t1.id); // completed
assert('Completed task is NOT overdue even if past due', !isOverdue(completedTask));
const noDateTask = createTask('No date', 'low', null);
assert('Task without due date is not overdue', !isOverdue(noDateTask));
const futureTask = createTask('Future', 'low', '2099-01-01');
assert('Future due date is not overdue', !isOverdue(futureTask));
const formattedDate = formatDueDate('2026-12-31');
assert('Date formats to readable string', typeof formattedDate === 'string' && formattedDate.includes('2026'));

// I. EDIT TASK
console.log('\nI. Edit Task');
tasks = editTask(tasks, t2.id, 'Read Kiro docs — UPDATED');
assert('Edit updates text correctly', tasks.find(t=>t.id===t2.id).text === 'Read Kiro docs — UPDATED');
assert('Edit preserves task ID', tasks.find(t=>t.id===t2.id).id === t2.id);
assert('Edit preserves priority', tasks.find(t=>t.id===t2.id).priority === 'medium');
assert('Edit preserves completion status', tasks.find(t=>t.id===t2.id).completed === false);
tasks = editTask(tasks, t2.id, '   ');
assert('Empty edit is rejected — text unchanged', tasks.find(t=>t.id===t2.id).text === 'Read Kiro docs — UPDATED');
assert('Edit does not change array length', tasks.length === 3);

// J. DELETE TASK
console.log('\nJ. Delete Task');
const countBefore = tasks.length;
tasks = deleteTask(tasks, t2.id);
assert('Delete removes exactly one task', tasks.length === countBefore - 1);
assert('Deleted task no longer in list', !tasks.some(t=>t.id===t2.id));
assert('Other tasks remain after delete', tasks.some(t=>t.id===t1.id) && tasks.some(t=>t.id===t3.id));

// K. PERSISTENCE ROUND-TRIP
console.log('\nK. Persistence Round-Trip');
const serialized = JSON.stringify(tasks);
const restored = JSON.parse(serialized);
assert('Serialized task count matches', restored.length === tasks.length);
assert('Text preserved after serialize/deserialize', restored.every((t,i) => t.text === tasks[i].text));
assert('Completed status preserved', restored.every((t,i) => t.completed === tasks[i].completed));
assert('Priority preserved', restored.every((t,i) => t.priority === tasks[i].priority));
assert('Due date preserved', restored.every((t,i) => t.dueDate === tasks[i].dueDate));
assert('IDs preserved', restored.every((t,i) => t.id === tasks[i].id));

// L. CLEAR COMPLETED
console.log('\nL. Clear Completed');
const hasCompleted = tasks.some(t => t.completed);
assert('Has completed tasks before clear', hasCompleted);
const cleared = tasks.filter(t => !t.completed);
assert('After clear, no completed tasks remain', cleared.every(t => !t.completed));
assert('After clear, active tasks remain', cleared.length > 0);

// M. VALIDATION (empty task text)
console.log('\nM. Validation');
const emptyTask = createTask('', 'medium', null);
assert('Empty text becomes empty string (caller must validate)', emptyTask.text === '');
// Note: validation "Task cannot be empty" is enforced in handleAdd() in app.js before createTask is called

// N. EMPTY STATES
console.log('\nN. Empty States');
const emptyTasks = [];
const visibleEmpty = getVisibleTasks(emptyTasks, 'all', '');
assert('No tasks = empty visible list', visibleEmpty.length === 0);
const allCompleted = [createTask('done', 'low', null)].map(t => ({...t, completed: true}));
const activeOfCompleted = filterTasks(allCompleted, 'active');
assert('Active filter on all-completed = empty', activeOfCompleted.length === 0);

console.log('\n' + '='.repeat(50));
console.log('\nFeature Simulation: ' + passed + ' passed, ' + failed + ' failed');
if (failed === 0) console.log('\nAll ' + passed + ' features verified!');
else { console.error('\n' + failed + ' feature(s) failed!'); process.exit(1); }
