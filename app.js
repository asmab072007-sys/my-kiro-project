/**
 * TodoFlow — app.js
 * Kiro University Build-Along
 *
 * Single self-contained file: all business logic + DOM + state + persistence.
 * No external dependencies. No bridge pattern. Works as a plain classic script.
 *
 * task-logic.js is kept separately for Node.js property-based testing.
 * The pure functions below are kept in sync with task-logic.js.
 */

(function () {
  'use strict';

  /* =============================================
     PURE BUSINESS LOGIC  (mirrors task-logic.js)
     ============================================= */

  var PRIORITIES = ['low', 'medium', 'high'];

  function generateId() {
    return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }

  function createTask(text, priority, dueDate) {
    priority = PRIORITIES.indexOf(priority) !== -1 ? priority : 'medium';
    return {
      id:        generateId(),
      text:      text.trim(),
      completed: false,
      priority:  priority,
      dueDate:   dueDate || null,
      createdAt: new Date().toISOString()
    };
  }

  function addTask(tasks, task) {
    return [task].concat(tasks);
  }

  function deleteTask(tasks, id) {
    return tasks.filter(function (t) { return t.id !== id; });
  }

  function toggleTask(tasks, id) {
    return tasks.map(function (t) {
      return t.id === id ? Object.assign({}, t, { completed: !t.completed }) : t;
    });
  }

  function editTask(tasks, id, newText) {
    var trimmed = newText.trim();
    if (!trimmed) return tasks;
    return tasks.map(function (t) {
      return t.id === id ? Object.assign({}, t, { text: trimmed }) : t;
    });
  }

  function filterTasks(tasks, filter) {
    if (filter === 'active')    return tasks.filter(function (t) { return !t.completed; });
    if (filter === 'completed') return tasks.filter(function (t) { return  t.completed; });
    return tasks;
  }

  function searchTasks(tasks, query) {
    var q = query ? query.trim().toLowerCase() : '';
    if (!q) return tasks;
    return tasks.filter(function (t) { return t.text.toLowerCase().indexOf(q) !== -1; });
  }

  function getVisibleTasks(tasks, filter, search) {
    return searchTasks(filterTasks(tasks, filter), search);
  }

  function isOverdue(task) {
    if (!task.dueDate || task.completed) return false;
    var today = new Date().toISOString().slice(0, 10);
    return task.dueDate < today;
  }

  function formatDueDate(dueDate) {
    if (!dueDate) return '';
    var parts = dueDate.split('-');
    var d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  /* =============================================
     CONSTANTS
     ============================================= */

  var STORAGE_KEY = 'todoflow_tasks';

  /* =============================================
     STATE  — single source of truth
     ============================================= */

  var state = {
    tasks:  [],
    filter: 'all',
    search: ''
  };

  /* =============================================
     PERSISTENCE
     ============================================= */

  function saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.warn('[TodoFlow] localStorage save failed:', e);
    }
  }

  function loadTasks() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter(function (t) {
        return t &&
          typeof t.id        === 'string' &&
          typeof t.text      === 'string' &&
          typeof t.completed === 'boolean';
      });
    } catch (e) {
      console.warn('[TodoFlow] localStorage load failed:', e);
      return [];
    }
  }

  /* =============================================
     DOM HELPERS
     ============================================= */

  function $(id) { return document.getElementById(id); }

  /* =============================================
     DOM REFERENCES  (resolved after DOMContentLoaded)
     ============================================= */

  var taskInput, prioritySelect, dueDateInput, addBtn;
  var taskList, emptyState, emptyTitle, emptySub;
  var validationMsg, searchInput;
  var activeCountEl, summaryTextEl, clearCompletedBtn;
  var statTotalEl, statDoneEl;          // stat cards
  var statProgressEl, progressRingEl, progressPctEl, progressSubEl; // progress
  var navTotalEl, navActiveEl, navDoneEl; // sidebar counters
  var visibleCountBadgeEl;              // toolbar badge
  var filterTabEls;  // array, not NodeList

  /* =============================================
     VALIDATION MESSAGE
     ============================================= */

  var validationTimer = null;

  function showValidation(msg) {
    validationMsg.textContent = msg;
    clearTimeout(validationTimer);
    validationTimer = setTimeout(function () {
      validationMsg.textContent = '';
    }, 3000);
  }

  function clearValidation() {
    clearTimeout(validationTimer);
    validationMsg.textContent = '';
  }

  /* =============================================
     RENDER
     ============================================= */

  function render() {
    var visible       = getVisibleTasks(state.tasks, state.filter, state.search);
    var activeCount   = state.tasks.filter(function (t) { return !t.completed; }).length;
    var completedCount = state.tasks.filter(function (t) { return  t.completed; }).length;

    /* header badge */
    activeCountEl.textContent = activeCount;

    /* stat cards */
    if (statTotalEl)    statTotalEl.textContent    = state.tasks.length;
    if (statDoneEl)     statDoneEl.textContent     = completedCount;

    /* progress % */
    var pct = state.tasks.length > 0
      ? Math.round((completedCount / state.tasks.length) * 100) : 0;
    if (statProgressEl) statProgressEl.textContent = pct + '%';
    if (progressPctEl)  progressPctEl.textContent  = pct + '%';
    if (progressSubEl)  progressSubEl.textContent  =
      completedCount + ' of ' + state.tasks.length + ' done';
    if (progressRingEl) {
      var circumference = 138.2;
      var offset = circumference - (pct / 100) * circumference;
      progressRingEl.style.strokeDashoffset = offset;
    }

    /* sidebar nav counts */
    if (navTotalEl)  navTotalEl.textContent  = state.tasks.length;
    if (navActiveEl) navActiveEl.textContent = activeCount;
    if (navDoneEl)   navDoneEl.textContent   = completedCount;

    /* visible count badge */
    if (visibleCountBadgeEl) {
      visibleCountBadgeEl.textContent =
        visible.length + ' task' + (visible.length !== 1 ? 's' : '');
    }

    /* footer summary */
    summaryTextEl.textContent =
      state.tasks.length + ' task' + (state.tasks.length !== 1 ? 's' : '') +
      ' total · ' + completedCount + ' completed';

    /* clear-completed button */
    clearCompletedBtn.style.display = completedCount > 0 ? '' : 'none';

    /* filter tab highlight */
    filterTabEls.forEach(function (tab) {
      var active = tab.getAttribute('data-filter') === state.filter;
      if (active) {
        tab.classList.add('filter-tab--active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('filter-tab--active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    /* empty state vs task list */
    if (visible.length === 0) {
      taskList.style.display  = 'none';
      emptyState.style.display = '';
      if (state.tasks.length === 0) {
        emptyTitle.textContent = 'No tasks yet';
        emptySub.textContent   = 'Add a task above to get started!';
      } else {
        emptyTitle.textContent = 'No tasks match';
        emptySub.textContent   = 'Try a different filter or search term.';
      }
    } else {
      taskList.style.display  = '';
      emptyState.style.display = 'none';
    }

    /* rebuild task list */
    taskList.innerHTML = '';
    visible.forEach(function (task) {
      taskList.appendChild(buildTaskEl(task));
    });
  }

  /* =============================================
     BUILD A TASK <LI>
     ============================================= */

  function buildTaskEl(task) {
    var li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' task-item--completed' : '');
    li.setAttribute('data-id', task.id);

    /* --- checkbox --- */
    var cb = document.createElement('input');
    cb.type      = 'checkbox';
    cb.className = 'task-checkbox';
    cb.checked   = task.completed;
    cb.setAttribute('aria-label',
      'Mark "' + task.text + '" as ' + (task.completed ? 'incomplete' : 'complete'));
    cb.addEventListener('change', function () { handleToggle(task.id); });

    /* --- body --- */
    var body   = document.createElement('div');
    body.className = 'task-body';

    var textEl = document.createElement('span');
    textEl.className   = 'task-text';
    textEl.textContent = task.text;

    var meta = document.createElement('div');
    meta.className = 'task-meta';

    /* priority badge */
    var badge = document.createElement('span');
    badge.className   = 'priority-badge priority-badge--' + task.priority;
    badge.textContent = task.priority;
    meta.appendChild(badge);

    /* due date */
    if (task.dueDate) {
      var due = document.createElement('span');
      var overdue = isOverdue(task);
      due.className   = 'due-date' + (overdue ? ' due-date--overdue' : '');
      due.textContent = (overdue ? '⚠ ' : '📅 ') + formatDueDate(task.dueDate);
      meta.appendChild(due);
    }

    body.appendChild(textEl);
    body.appendChild(meta);

    /* --- actions --- */
    var actions = document.createElement('div');
    actions.className = 'task-actions';

    var editBtn = document.createElement('button');
    editBtn.type      = 'button';
    editBtn.className = 'btn btn--icon btn--edit';
    editBtn.setAttribute('aria-label', 'Edit: ' + task.text);
    editBtn.textContent = '✏️';
    editBtn.addEventListener('click', function () {
      var existing = li.querySelector('.task-edit-input');
      if (existing) { existing.blur(); return; }
      startEdit(task.id, li, textEl);
    });

    var delBtn = document.createElement('button');
    delBtn.type      = 'button';
    delBtn.className = 'btn btn--icon btn--delete';
    delBtn.setAttribute('aria-label', 'Delete: ' + task.text);
    delBtn.textContent = '🗑️';
    delBtn.addEventListener('click', function () { handleDelete(task.id); });

    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    li.appendChild(cb);
    li.appendChild(body);
    li.appendChild(actions);

    return li;
  }

  /* =============================================
     INLINE EDIT
     ============================================= */

  function startEdit(id, li, textEl) {
    /* cancel any other active edit first */
    var anyEdit = taskList.querySelector('.task-edit-input');
    if (anyEdit) { anyEdit.blur(); return; }

    var task = state.tasks.filter(function (t) { return t.id === id; })[0];
    if (!task) return;

    var inp = document.createElement('input');
    inp.type      = 'text';
    inp.className = 'task-edit-input';
    inp.value     = task.text;
    inp.setAttribute('aria-label', 'Edit task text');

    textEl.parentNode.replaceChild(inp, textEl);
    inp.focus();
    inp.select();

    var handled = false;

    function commit() {
      if (handled) return;
      handled = true;
      var newText = inp.value.trim();
      if (newText && newText !== task.text) {
        state.tasks = editTask(state.tasks, id, newText);
        saveTasks(state.tasks);
      }
      render();
    }

    function cancel() {
      if (handled) return;
      handled = true;
      render();
    }

    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter')  { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });

    inp.addEventListener('blur', commit, { once: true });
  }

  /* =============================================
     EVENT HANDLERS
     ============================================= */

  function handleAdd() {
    var text = taskInput.value.trim();
    if (!text) {
      showValidation('Task cannot be empty');
      taskInput.focus();
      return;
    }
    clearValidation();

    var task = createTask(text, prioritySelect.value, dueDateInput.value || null);
    state.tasks = addTask(state.tasks, task);
    saveTasks(state.tasks);

    taskInput.value       = '';
    dueDateInput.value    = '';
    prioritySelect.value  = 'medium';
    taskInput.focus();

    render();

    /* entry animation on new item */
    var first = taskList.querySelector('.task-item');
    if (first) {
      first.classList.add('task-item--new');
      first.addEventListener('animationend', function () {
        first.classList.remove('task-item--new');
      }, { once: true });
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

  function handleFilterChange(filter) {
    state.filter = filter;
    render();
  }

  function handleSearch(q) {
    state.search = q;
    render();
  }

  function handleClearCompleted() {
    state.tasks = state.tasks.filter(function (t) { return !t.completed; });
    saveTasks(state.tasks);
    render();
  }

  /* =============================================
     INIT  — runs after DOM is ready
     ============================================= */

  function init() {
    /* resolve DOM references */
    taskInput        = $('task-input');
    prioritySelect   = $('priority-select');
    dueDateInput     = $('due-date-input');
    addBtn           = $('add-btn');
    taskList         = $('task-list');
    emptyState       = $('empty-state');
    emptyTitle       = $('empty-title');
    emptySub         = $('empty-sub');
    validationMsg    = $('validation-msg');
    searchInput      = $('search-input');
    activeCountEl    = $('active-count');
    summaryTextEl    = $('summary-text');
    clearCompletedBtn = $('clear-completed-btn');
    statTotalEl      = $('stat-total');
    statDoneEl       = $('stat-done');
    statProgressEl   = $('stat-progress');
    progressRingEl   = $('progress-ring-fill');
    progressPctEl    = $('progress-pct');
    progressSubEl    = $('progress-sub');
    navTotalEl       = $('nav-total');
    navActiveEl      = $('nav-active');
    navDoneEl        = $('nav-done');
    visibleCountBadgeEl = $('visible-count-badge');
    filterTabEls     = Array.prototype.slice.call(
      document.querySelectorAll('.filter-tab')
    );

    /* wire up events */
    addBtn.addEventListener('click', handleAdd);

    taskInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') handleAdd();
    });

    taskInput.addEventListener('input', function () {
      if (taskInput.value.trim()) clearValidation();
    });

    filterTabEls.forEach(function (tab) {
      tab.addEventListener('click', function () {
        handleFilterChange(tab.getAttribute('data-filter'));
      });
    });

    searchInput.addEventListener('input', function () {
      handleSearch(searchInput.value);
    });

    clearCompletedBtn.addEventListener('click', handleClearCompleted);

    /* wire sidebar nav items as filter shortcuts */
    var sidebarNavItems = Array.prototype.slice.call(
      document.querySelectorAll('.sidebar-nav-item[data-filter]')
    );
    sidebarNavItems.forEach(function (btn) {
      btn.addEventListener('click', function () {
        /* update active state */
        sidebarNavItems.forEach(function (b) {
          b.classList.remove('sidebar-nav-item--active');
          b.removeAttribute('aria-current');
        });
        btn.classList.add('sidebar-nav-item--active');
        btn.setAttribute('aria-current', 'page');
        /* trigger filter change */
        handleFilterChange(btn.getAttribute('data-filter'));
      });
    });

    /* set greeting based on time of day */
    (function () {
      var greetEl = $('greeting-title');
      if (!greetEl) return;
      var h = new Date().getHours();
      var g = h < 12 ? 'Good morning 👋'
            : h < 17 ? 'Good afternoon 👋'
            : 'Good evening 👋';
      greetEl.textContent = g;
    }());

    /* set current date display */
    (function () {
      var dateEl = $('topbar-date');
      if (!dateEl) return;
      var now  = new Date();
      var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      var months = ['January','February','March','April','May','June',
                    'July','August','September','October','November','December'];
      dateEl.textContent =
        days[now.getDay()] + ', ' + months[now.getMonth()] + ' ' + now.getDate();
    }());

    /* load persisted tasks and render */
    state.tasks = loadTasks();
    render();
  }

  /* Run init after DOM is fully parsed */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}()); /* end IIFE */
