# Kiro University Build-Along — Evidence File

**Project:** TodoFlow — Client-side To-Do list web application  
**Challenge:** Kiro University Build-Along 2026  
**Participant:** Kiro University participant  

---

## Project Description

TodoFlow is a polished, responsive To-Do list web application built with HTML, CSS, and Vanilla JavaScript. It runs entirely in the browser with no backend, no build step, and no external APIs. Tasks persist via localStorage and include priority levels, due dates, search, filtering, and task counts.

---

## How to Run the Project

```bash
# Clone the repo, then:
cd my-kiro-project
python3 -m http.server 8080
# Open http://localhost:8080
```

## How to Run Tests (Property-Based)

```bash
node tests/property.test.js
# Expected: 22 passed, 0 failed
```

## How to Run the npm test script

```bash
npm test
# Runs the same property-based tests
```

---

## Kiro University Lesson Evidence

### 1. Spec-Driven Development
**Evidence file:** `.kiro/specs/todoflow-requirements.md`  
**How it was used:** Before writing any code, a full specification was created covering user stories (US-1 through US-10), 12 functional requirements, 7 non-functional requirements, and 10 testable acceptance criteria (AC-1 through AC-10) in GIVEN/WHEN/THEN format. Every feature in the app — add, edit, delete, complete, search, filter, priority, due dates, persistence — traces back to a specific acceptance criterion in the spec.

---

### 2. Steering Documents
**Evidence files:** `.kiro/steering/product.md`, `.kiro/steering/coding-conventions.md`, `.kiro/steering/ui-ux-conventions.md`, `.kiro/steering/testing-conventions.md`  
**How it was used:** Four steering documents guided the implementation: `product.md` defines the project purpose and non-goals; `coding-conventions.md` specifies the canonical Task data shape, file structure, naming conventions, and accessibility rules; `ui-ux-conventions.md` defines the color palette, layout, interaction patterns, and empty states; `testing-conventions.md` specifies which properties to test and how to structure fast-check tests. These documents influenced every implementation decision.

---

### 3. Hooks
**Evidence file:** `.kiro/hooks/validate-js-on-save.json`  
**How it was used:** A `PostFileSave` hook fires automatically whenever a `.js`, `.html`, or `.css` file is saved in the project. It runs a Node.js syntax check on the saved file and logs the result to the terminal, catching JavaScript errors immediately after each save without requiring a manual build step. The existing `kironomics.json` hook (session analytics) was preserved untouched.

---

### 4. Property-Based Testing
**Evidence file:** `tests/property.test.js`  
**How it was used:** 22 property-based tests were written using the `fast-check` library, testing 8 categories of invariants across the pure task logic (`task-logic.js`): (1) adding a task always increases count by exactly 1; (2) deleting removes exactly that task; (3) double-toggling preserves original completion state; (4) filtering is a pure subset operation (active + completed counts sum to total); (5) search results are always a subset of input; (6) all task IDs remain unique; (7) JSON serialize/deserialize round-trip preserves all task data; (8) editing with empty string leaves task unchanged. All 22 tests pass consistently with 200–500 random inputs each.

---

### 5. Powers
**Evidence:** The Kiro `bundled://investigate` workflow recipe (a built-in Kiro Power) was used to perform an automated spec compliance investigation of the TodoFlow codebase. The investigation verified that `index.html` correctly loads `task-logic.js` before `app.js`, confirmed that the filter and search logic matches acceptance criteria AC-6 and AC-7, and identified any gaps between spec and implementation. This is documented in `.agents/todoflow-spec-investigation.md`.  
**Note:** No third-party Powers were installed in this environment; the bundled Kiro workflow Powers were used directly, which is the genuine available capability.

---

### 6. Model Context Protocol (MCP)
**Evidence files:** `mcp-server/todoflow-mcp.js`, `.kiro/settings/mcp.json`  
**How it was used:** A custom MCP server (`todoflow-mcp`) was built and configured for Kiro to use. It exposes 3 tools over JSON-RPC 2.0 via stdio: `get_project_info` (returns app name, version, tech stack, and Kiro features list), `get_test_status` (runs the property-based test suite and returns pass/fail counts), and `get_task_statistics` (parses an exported tasks JSON file and returns completion rate, priority breakdown, and overdue task list). The server was verified to respond correctly to all 3 tool calls. The MCP config at `.kiro/settings/mcp.json` registers it so Kiro can call these tools directly.

---

### 7. Custom Agents
**Evidence file:** `.kiro/agents/todo-qa-agent.md`  
**How it was used:** A "Todo QA Agent" was created with clear responsibilities: check spec compliance against all 10 acceptance criteria, run property-based tests, verify accessibility attributes (aria-labels, form labels, ARIA roles), check coding conventions (no `var`, no inline handlers, proper error handling), and produce a structured QA report checklist. The agent was invoked and all checks passed: 22 tests, 11 aria-labels, 2 form labels, no `var`, no inline handlers, localStorage errors handled with try/catch.

---

## Demo Instructions

See `DEMO.md` for the full 2-minute demo script.

**Quick demo path:**
1. `python3 -m http.server 8080` → open http://localhost:8080
2. Add 3 tasks with different priorities and a due date
3. Complete one, search, filter, edit, delete
4. Refresh → data persists
5. Show `.kiro/` folder in Kiro IDE → spec, steering, hooks, agent
6. Run `node tests/property.test.js` → 22 tests pass

---

## File Map

| File | Kiro Feature |
|------|-------------|
| `.kiro/specs/todoflow-requirements.md` | Spec-Driven Development |
| `.kiro/steering/product.md` | Steering Documents |
| `.kiro/steering/coding-conventions.md` | Steering Documents |
| `.kiro/steering/ui-ux-conventions.md` | Steering Documents |
| `.kiro/steering/testing-conventions.md` | Steering Documents |
| `.kiro/hooks/validate-js-on-save.json` | Hooks |
| `.kiro/hooks/kironomics.json` | Hooks (pre-existing, preserved) |
| `tests/property.test.js` | Property-Based Testing |
| `mcp-server/todoflow-mcp.js` | MCP |
| `.kiro/settings/mcp.json` | MCP |
| `.kiro/agents/todo-qa-agent.md` | Custom Agents |
| `.agents/todoflow-spec-investigation.md` | Powers (investigate workflow) |
| `index.html` | Application |
| `style.css` | Application |
| `app.js` | Application (DOM layer) |
| `task-logic.js` | Application (pure logic, testable) |
