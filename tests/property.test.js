/**
 * TodoFlow — Property-Based Tests
 * Kiro University Build-Along
 *
 * Uses: fast-check (https://fast-check.dev/)
 * Run:  node tests/property.test.js
 *
 * Tests invariants that must hold for ALL valid inputs,
 * not just specific hand-picked examples.
 */

'use strict';

const fc = require('fast-check');
const {
  createTask,
  addTask,
  deleteTask,
  toggleTask,
  editTask,
  filterTasks,
  searchTasks,
  getVisibleTasks,
} = require('../task-logic.js');

/* =========================================
   TEST RUNNER
   ========================================= */

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

/* =========================================
   ARBITRARIES (generators for random inputs)
   ========================================= */

/** Random non-empty trimmed string (task text) */
const arbText = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0)
  .map(s => s.trim());

/** Random priority */
const arbPriority = fc.constantFrom('low', 'medium', 'high');

/** Random due date or null — use integer tuple to avoid Date invalid values */
const arbDueDate = fc.oneof(
  fc.constant(null),
  fc.record({
    y: fc.integer({ min: 2020, max: 2030 }),
    m: fc.integer({ min: 1, max: 12 }),
    d: fc.integer({ min: 1, max: 28 }),
  }).map(({ y, m, d }) =>
    `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
  )
);

/** Random task object */
const arbTask = fc.record({
  text: arbText,
  priority: arbPriority,
  dueDate: arbDueDate,
}).map(({ text, priority, dueDate }) => createTask(text, priority, dueDate));

/** Random array of tasks (0–20 items) */
const arbTasks = fc.array(arbTask, { minLength: 0, maxLength: 20 });

/** Random non-empty array of tasks */
const arbNonEmptyTasks = fc.array(arbTask, { minLength: 1, maxLength: 20 });

/** Random filter value */
const arbFilter = fc.constantFrom('all', 'active', 'completed');

/* =========================================
   PROPERTY-BASED TESTS
   ========================================= */

console.log('\n📋 TodoFlow Property-Based Tests\n');
console.log('─'.repeat(50));
console.log('Property 1: Add Task Invariants');

test('Adding a task always increases count by exactly 1', () => {
  fc.assert(
    fc.property(arbTasks, arbTask, (tasks, newTask) => {
      const result = addTask(tasks, newTask);
      return result.length === tasks.length + 1;
    }),
    { numRuns: 500 }
  );
});

test('Added task appears in the result array', () => {
  fc.assert(
    fc.property(arbTasks, arbTask, (tasks, newTask) => {
      const result = addTask(tasks, newTask);
      return result.some(t => t.id === newTask.id);
    }),
    { numRuns: 500 }
  );
});

test('Add does not mutate original array', () => {
  fc.assert(
    fc.property(arbTasks, arbTask, (tasks, newTask) => {
      const originalLength = tasks.length;
      addTask(tasks, newTask);
      return tasks.length === originalLength;
    }),
    { numRuns: 300 }
  );
});

console.log('─'.repeat(50));
console.log('Property 2: Delete Task Invariants');

test('Deleting a task decreases count by exactly 1', () => {
  fc.assert(
    fc.property(arbNonEmptyTasks, (tasks) => {
      const target = tasks[Math.floor(Math.random() * tasks.length)];
      const result = deleteTask(tasks, target.id);
      return result.length === tasks.length - 1;
    }),
    { numRuns: 500 }
  );
});

test('Deleted task no longer appears in the list', () => {
  fc.assert(
    fc.property(arbNonEmptyTasks, (tasks) => {
      const target = tasks[0];
      const result = deleteTask(tasks, target.id);
      return !result.some(t => t.id === target.id);
    }),
    { numRuns: 500 }
  );
});

test('Deleting a non-existent ID leaves array unchanged', () => {
  fc.assert(
    fc.property(arbTasks, (tasks) => {
      const result = deleteTask(tasks, 'non-existent-id-xyz');
      return result.length === tasks.length;
    }),
    { numRuns: 300 }
  );
});

console.log('─'.repeat(50));
console.log('Property 3: Toggle Completion Invariants');

test('Toggling a task twice returns it to original completed state', () => {
  fc.assert(
    fc.property(arbNonEmptyTasks, (tasks) => {
      const target = tasks[0];
      const originalCompleted = target.completed;
      const once = toggleTask(tasks, target.id);
      const twice = toggleTask(once, target.id);
      const restored = twice.find(t => t.id === target.id);
      return restored && restored.completed === originalCompleted;
    }),
    { numRuns: 500 }
  );
});

test('Toggle preserves task identity (id, text, priority, dueDate)', () => {
  fc.assert(
    fc.property(arbNonEmptyTasks, (tasks) => {
      const target = tasks[0];
      const result = toggleTask(tasks, target.id);
      const toggled = result.find(t => t.id === target.id);
      return toggled &&
        toggled.id === target.id &&
        toggled.text === target.text &&
        toggled.priority === target.priority &&
        toggled.dueDate === target.dueDate;
    }),
    { numRuns: 500 }
  );
});

test('Toggle does not change array length', () => {
  fc.assert(
    fc.property(arbNonEmptyTasks, (tasks) => {
      const result = toggleTask(tasks, tasks[0].id);
      return result.length === tasks.length;
    }),
    { numRuns: 300 }
  );
});

console.log('─'.repeat(50));
console.log('Property 4: Filter Invariants');

test('Filtering never creates new tasks (result is a subset)', () => {
  fc.assert(
    fc.property(arbTasks, arbFilter, (tasks, filter) => {
      const result = filterTasks(tasks, filter);
      return result.every(t => tasks.some(orig => orig.id === t.id));
    }),
    { numRuns: 500 }
  );
});

test('Filter "all" returns all tasks', () => {
  fc.assert(
    fc.property(arbTasks, (tasks) => {
      const result = filterTasks(tasks, 'all');
      return result.length === tasks.length;
    }),
    { numRuns: 300 }
  );
});

test('Filter "active" returns only incomplete tasks', () => {
  fc.assert(
    fc.property(arbTasks, (tasks) => {
      const result = filterTasks(tasks, 'active');
      return result.every(t => !t.completed);
    }),
    { numRuns: 500 }
  );
});

test('Filter "completed" returns only completed tasks', () => {
  fc.assert(
    fc.property(arbTasks, (tasks) => {
      const result = filterTasks(tasks, 'completed');
      return result.every(t => t.completed);
    }),
    { numRuns: 500 }
  );
});

test('Filter active + completed counts sum to total', () => {
  fc.assert(
    fc.property(arbTasks, (tasks) => {
      const active = filterTasks(tasks, 'active').length;
      const completed = filterTasks(tasks, 'completed').length;
      return active + completed === tasks.length;
    }),
    { numRuns: 500 }
  );
});

console.log('─'.repeat(50));
console.log('Property 5: Search Invariants');

test('Search results are always a subset of input tasks', () => {
  fc.assert(
    fc.property(arbTasks, fc.string({ maxLength: 20 }), (tasks, query) => {
      const result = searchTasks(tasks, query);
      return result.every(t => tasks.some(orig => orig.id === t.id));
    }),
    { numRuns: 500 }
  );
});

test('Empty search query returns all tasks', () => {
  fc.assert(
    fc.property(arbTasks, (tasks) => {
      const result = searchTasks(tasks, '');
      return result.length === tasks.length;
    }),
    { numRuns: 300 }
  );
});

test('Whitespace-only search query returns all tasks', () => {
  fc.assert(
    fc.property(arbTasks, (tasks) => {
      const result = searchTasks(tasks, '   ');
      return result.length === tasks.length;
    }),
    { numRuns: 200 }
  );
});

test('Search never returns a task whose text does not include the query', () => {
  fc.assert(
    fc.property(arbTasks, arbText.filter(s => s.length >= 2), (tasks, query) => {
      const result = searchTasks(tasks, query);
      return result.every(t =>
        t.text.toLowerCase().includes(query.toLowerCase())
      );
    }),
    { numRuns: 500 }
  );
});

console.log('─'.repeat(50));
console.log('Property 6: Task ID Uniqueness');

test('All task IDs in a batch of additions remain unique', () => {
  fc.assert(
    fc.property(fc.array(arbTask, { minLength: 2, maxLength: 50 }), (tasks) => {
      const ids = tasks.map(t => t.id);
      const unique = new Set(ids);
      return unique.size === ids.length;
    }),
    { numRuns: 200 }
  );
});

console.log('─'.repeat(50));
console.log('Property 7: Persistence Round-Trip');

test('Serialize then deserialize preserves all task data exactly', () => {
  fc.assert(
    fc.property(arbTasks, (tasks) => {
      const serialized = JSON.stringify(tasks);
      const restored = JSON.parse(serialized);
      return restored.length === tasks.length &&
        restored.every((t, i) =>
          t.id === tasks[i].id &&
          t.text === tasks[i].text &&
          t.completed === tasks[i].completed &&
          t.priority === tasks[i].priority &&
          t.dueDate === tasks[i].dueDate
        );
    }),
    { numRuns: 500 }
  );
});

console.log('─'.repeat(50));
console.log('Property 8: Edit Task Invariants');

test('Editing a task preserves its ID', () => {
  fc.assert(
    fc.property(arbNonEmptyTasks, arbText, (tasks, newText) => {
      const target = tasks[0];
      const result = editTask(tasks, target.id, newText);
      const edited = result.find(t => t.id === target.id);
      return edited !== undefined;
    }),
    { numRuns: 500 }
  );
});

test('Editing a task with empty string does not change it', () => {
  fc.assert(
    fc.property(arbNonEmptyTasks, (tasks) => {
      const target = tasks[0];
      const result = editTask(tasks, target.id, '   ');
      const unchanged = result.find(t => t.id === target.id);
      return unchanged && unchanged.text === target.text;
    }),
    { numRuns: 300 }
  );
});

/* =========================================
   RESULTS SUMMARY
   ========================================= */

console.log('─'.repeat(50));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.error(`❌ ${failed} test(s) failed\n`);
  process.exit(1);
} else {
  console.log(`✅ All ${passed} property-based tests passed!\n`);
  process.exit(0);
}
