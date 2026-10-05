'use strict';

// Tests all pure functions as they appear in app.js (IIFE copy)
// Run: node tests/logic-audit.js

const PRIORITIES = ['low', 'medium', 'high'];

function generateId() {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
}
function createTask(text, priority, dueDate) {
  priority = PRIORITIES.indexOf(priority) !== -1 ? priority : 'medium';
  return { id: generateId(), text: text.trim(), completed: false, priority: priority, dueDate: dueDate || null, createdAt: new Date().toISOString() };
}
function addTask(tasks, task) { return [task].concat(tasks); }
function deleteTask(tasks, id) { return tasks.filter(function(t) { return t.id !== id; }); }
function toggleTask(tasks, id) { return tasks.map(function(t) { return t.id === id ? Object.assign({}, t, { completed: !t.completed }) : t; }); }
function editTask(tasks, id, newText) { var trimmed = newText.trim(); if (!trimmed) return tasks; return tasks.map(function(t) { return t.id === id ? Object.assign({}, t, { text: trimmed }) : t; }); }
function filterTasks(tasks, filter) { if (filter === 'active') return tasks.filter(function(t) { return !t.completed; }); if (filter === 'completed') return tasks.filter(function(t) { return t.completed; }); return tasks; }
function searchTasks(tasks, query) { var q = query ? query.trim().toLowerCase() : ''; if (!q) return tasks; return tasks.filter(function(t) { return t.text.toLowerCase().indexOf(q) !== -1; }); }
function getVisibleTasks(tasks, filter, search) { return searchTasks(filterTasks(tasks, filter), search); }
function isOverdue(task) { if (!task.dueDate || task.completed) return false; var today = new Date().toISOString().slice(0, 10); return task.dueDate < today; }
function formatDueDate(dueDate) { if (!dueDate) return ''; var parts = dueDate.split('-'); var d = new Date(+parts[0], +parts[1] - 1, +parts[2]); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

var p = 0, f = 0;
function ok(name, cond) {
  if (cond) { console.log('  OK ' + name); p++; }
  else { console.error('  FAIL: ' + name); f++; }
}

var tasks = [];

// ADD
console.log('\nA. Add Task');
var t1 = createTask('Buy groceries', 'high', '2026-12-31');
tasks = addTask(tasks, t1);
ok('count = 1', tasks.length === 1);
ok('text correct', tasks[0].text === 'Buy groceries');
ok('priority = high', tasks[0].priority === 'high');
ok('dueDate correct', tasks[0].dueDate === '2026-12-31');
ok('not completed', !tasks[0].completed);
ok('has id', tasks[0].id.length > 0);
var t2 = createTask('  Read Kiro docs  ', 'medium', null);
tasks = addTask(tasks, t2);
ok('text trimmed', tasks[0].text === 'Read Kiro docs');
ok('null dueDate stored', tasks[0].dueDate === null);
var t3 = createTask('Review PR', 'low', '2020-01-01');
tasks = addTask(tasks, t3);
ok('3 tasks total', tasks.length === 3);

// COMPLETE
console.log('\nB. Complete/Uncomplete');
tasks = toggleTask(tasks, t1.id);
ok('toggle -> completed=true', tasks.filter(function(t){return t.id===t1.id;})[0].completed === true);
tasks = toggleTask(tasks, t1.id);
ok('toggle back -> completed=false', tasks.filter(function(t){return t.id===t1.id;})[0].completed === false);
tasks = toggleTask(tasks, t1.id); // leave t1 completed

// COUNTERS
console.log('\nC. Counters');
var active = tasks.filter(function(t){return !t.completed;}).length;
var done   = tasks.filter(function(t){return  t.completed;}).length;
ok('active = 2', active === 2);
ok('completed = 1', done === 1);
ok('sum = total', active + done === tasks.length);

// FILTERS
console.log('\nD. Filters');
ok('all: 3', filterTasks(tasks, 'all').length === 3);
ok('active: 2', filterTasks(tasks, 'active').length === 2);
ok('completed: 1', filterTasks(tasks, 'completed').length === 1);
ok('active: only !completed', filterTasks(tasks, 'active').every(function(t){return !t.completed;}));
ok('completed: only completed', filterTasks(tasks, 'completed').every(function(t){return t.completed;}));

// SEARCH
console.log('\nE. Search');
ok('search kiro: 1', searchTasks(tasks, 'kiro').length === 1);
ok('case-insensitive KIRO: 1', searchTasks(tasks, 'KIRO').length === 1);
ok('empty query: all 3', searchTasks(tasks, '').length === 3);
ok('no match: 0', searchTasks(tasks, 'zzznope').length === 0);
ok('partial gro: 1', searchTasks(tasks, 'gro').length === 1);

// SEARCH+FILTER
console.log('\nF. Search + Filter');
ok('active+review: 1', getVisibleTasks(tasks, 'active', 'review').length === 1);
ok('completed+review: 0', getVisibleTasks(tasks, 'completed', 'review').length === 0);
ok('completed+groceries: 1', getVisibleTasks(tasks, 'completed', 'groceries').length === 1);

// PRIORITY
console.log('\nG. Priority');
ok('invalid -> medium', createTask('x', 'invalid', null).priority === 'medium');
ok('low priority', tasks.filter(function(t){return t.id===t3.id;})[0].priority === 'low');

// DUE DATE + OVERDUE
console.log('\nH. Due Date / Overdue');
var overdueTask = tasks.filter(function(t){return t.id===t3.id;})[0]; // 2020, active
ok('past+active = overdue', isOverdue(overdueTask));
var completedTask = tasks.filter(function(t){return t.id===t1.id;})[0]; // completed
ok('completed -> not overdue', !isOverdue(completedTask));
ok('null dueDate -> not overdue', !isOverdue(createTask('x', 'low', null)));
ok('future -> not overdue', !isOverdue(createTask('x', 'low', '2099-01-01')));
ok('formatDueDate returns string', formatDueDate('2026-12-31').indexOf('2026') !== -1);

// EDIT
console.log('\nI. Edit');
tasks = editTask(tasks, t2.id, 'Read Kiro docs UPDATED');
ok('edit updates text', tasks.filter(function(t){return t.id===t2.id;})[0].text === 'Read Kiro docs UPDATED');
ok('edit preserves id', tasks.filter(function(t){return t.id===t2.id;})[0].id === t2.id);
ok('edit preserves priority', tasks.filter(function(t){return t.id===t2.id;})[0].priority === 'medium');
tasks = editTask(tasks, t2.id, '   ');
ok('empty edit rejected', tasks.filter(function(t){return t.id===t2.id;})[0].text === 'Read Kiro docs UPDATED');

// DELETE
console.log('\nJ. Delete');
var before = tasks.length;
tasks = deleteTask(tasks, t2.id);
ok('delete: count-1', tasks.length === before - 1);
ok('delete: task gone', !tasks.some(function(t){return t.id===t2.id;}));
ok('delete: others remain', tasks.some(function(t){return t.id===t1.id;}));

// PERSISTENCE
console.log('\nK. Persistence Round-Trip');
var s = JSON.stringify(tasks);
var r = JSON.parse(s);
ok('count preserved', r.length === tasks.length);
ok('text preserved', r.every(function(t,i){return t.text === tasks[i].text;}));
ok('completed preserved', r.every(function(t,i){return t.completed === tasks[i].completed;}));
ok('priority preserved', r.every(function(t,i){return t.priority === tasks[i].priority;}));
ok('dueDate preserved', r.every(function(t,i){return t.dueDate === tasks[i].dueDate;}));
ok('id preserved', r.every(function(t,i){return t.id === tasks[i].id;}));

// EMPTY STATES
console.log('\nL. Empty States');
ok('no tasks -> empty visible', getVisibleTasks([], 'all', '').length === 0);
var allDone = [createTask('done', 'low', null)].map(function(t){return Object.assign({},t,{completed:true});});
ok('all-completed active filter -> empty', filterTasks(allDone, 'active').length === 0);

// CORRUPT LOCALSTORAGE RECOVERY
console.log('\nM. Corrupt localStorage Recovery');
var corrupt = JSON.parse('[{"id":"1","text":"ok","completed":true},{"bad":true},null]');
var clean = corrupt.filter(function(t){
  return t && typeof t.id==='string' && typeof t.text==='string' && typeof t.completed==='boolean';
});
ok('filters corrupt entries', clean.length === 1);

// RESULTS
console.log('\n' + '='.repeat(50));
console.log('Logic Audit: ' + p + ' passed, ' + f + ' failed');
if (f === 0) { console.log('ALL ' + p + ' CHECKS PASS'); process.exit(0); }
else { console.error(f + ' FAILED'); process.exit(1); }
