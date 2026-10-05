# TodoFlow — 3-Minute Demo Script

## Quick Setup (30 seconds before recording)

```bash
cd /path/to/my-kiro-project
python3 -m http.server 8080
# Open http://localhost:8080 in browser
```

---

## Demo Script (~2 minutes)

### Scene 1 — App Opens (10 sec)
- Open http://localhost:8080
- Show the clean UI: header, add form, empty state
- Point out: "No backend, loads instantly"

### Scene 2 — Add Tasks (25 sec)
- Type "Buy groceries" → set Priority: High → Add
- Type "Read Kiro docs" → set Priority: Medium → set Due date (today) → Add
- Type "Review pull request" → Priority: High → Add
- Show the task list with priority badges, counter updates to "3 active"

### Scene 3 — Complete a Task (10 sec)
- Click the checkbox on "Buy groceries"
- Show strikethrough, counter drops to "2 active"

### Scene 4 — Search (10 sec)
- Type "kiro" in the search box
- Show only "Read Kiro docs" appears
- Clear search → all tasks return

### Scene 5 — Filter (10 sec)
- Click "Completed" tab → shows only "Buy groceries"
- Click "Active" tab → shows remaining 2 tasks
- Click "All" → all 3 tasks

### Scene 6 — Edit a Task (10 sec)
- Hover over "Review pull request" → click ✏️
- Change text to "Review pull request — URGENT"
- Press Enter → text updates

### Scene 7 — Delete a Task (5 sec)
- Click 🗑️ on "Read Kiro docs"
- Task disappears immediately

### Scene 8 — Persistence (10 sec)
- Refresh the browser (Cmd+R)
- Tasks are still there — "Persisted in localStorage!"

---

## Kiro University Features (30 sec — optional screen share of VS Code)

Quickly show in Kiro IDE:
1. `.kiro/specs/todoflow-requirements.md` → "Spec-driven: all features come from here"
2. `.kiro/steering/` → "4 steering docs guided coding, UI, and testing"
3. `.kiro/hooks/validate-js-on-save.json` → "Hook: auto syntax check on every .js save"
4. `tests/property.test.js` → run `node tests/property.test.js` → "22 property-based tests pass"
5. `mcp-server/todoflow-mcp.js` → "MCP server: Kiro can query project info and test status"
6. `.kiro/agents/todo-qa-agent.md` → "Custom QA agent reviews spec compliance"

---

## Commands Reference

```bash
# Start the app
python3 -m http.server 8080

# Run property-based tests
node tests/property.test.js

# Test MCP server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | node mcp-server/todoflow-mcp.js
```
