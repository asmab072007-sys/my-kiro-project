# Testing Conventions

## Testing Philosophy

- Test business logic, not DOM rendering
- Property-based tests verify invariants that must hold for ALL valid inputs
- Unit tests verify specific behaviors with known inputs

## Property-Based Testing

**Library:** fast-check (loaded via CDN for zero-install)
**Runner:** Node.js with `node --experimental-vm-modules` or direct browser test page

**What to property-test:**
1. **Add task invariant** — adding a task always increases count by exactly 1
2. **Delete task invariant** — deleting a task removes exactly that task ID
3. **Toggle invariant** — double-toggling completion returns task to original state
4. **Filter invariant** — filtering never creates or destroys tasks, only hides them
5. **Persistence invariant** — serialize → deserialize round-trip preserves all task data
6. **Uniqueness invariant** — all task IDs remain unique after any number of adds
7. **Search invariant** — search results are always a subset of the full task list

**Property test file:** `tests/property.test.js`

**How to run:**
```bash
node tests/property.test.js
```

## Test Structure

```js
// Each test uses fc.assert + fc.property
fc.assert(
  fc.property(arbitraryInput, (input) => {
    // arrange, act
    // return boolean or throw on failure
  })
);
```

## What NOT to test

- DOM rendering details
- CSS class names
- Browser-specific behaviors
- localStorage directly (mock it in tests)
