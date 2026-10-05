# Coding Conventions

## Stack

- **HTML5** — semantic elements, ARIA attributes for accessibility
- **CSS3** — custom properties (CSS variables), flexbox/grid layout
- **Vanilla JavaScript (ES6+)** — modules via `<script type="module">` or IIFE
- **No frameworks, no build tools, no npm required**

## JavaScript Conventions

- Use `const` by default; `let` when reassignment is needed; never `var`
- Arrow functions for callbacks; named functions for top-level logic
- All task objects must follow the canonical Task shape:
  ```js
  {
    id: string,          // UUID or timestamp-based
    text: string,        // non-empty, trimmed
    completed: boolean,
    priority: 'low' | 'medium' | 'high',
    dueDate: string | null,  // ISO date string YYYY-MM-DD or null
    createdAt: string    // ISO timestamp
  }
  ```
- Business logic (add, edit, delete, filter, search) lives in `app.js`
- DOM manipulation is separated from data logic via render functions
- No inline event handlers in HTML — use `addEventListener` in JS

## CSS Conventions

- Use CSS custom properties for colors and spacing:
  ```css
  --color-primary: #6366f1;
  --color-danger: #ef4444;
  --spacing-unit: 8px;
  ```
- BEM-like class naming: `.task-item`, `.task-item--completed`, `.task-item__text`
- Mobile-first media queries

## File Structure

```
index.html       # Single HTML entry point
style.css        # All styles
app.js           # All application logic
tests/
  property.test.js   # Property-based tests
.kiro/
  specs/         # Specification documents
  steering/      # Steering documents
  agents/        # Custom agents
  hooks/         # Hook definitions
```

## Error Handling

- Always validate task text (non-empty after trim)
- Show inline validation messages, never alert()
- Gracefully handle corrupt localStorage data with try/catch

## Accessibility

- All interactive elements must be keyboard-accessible
- Use `aria-label` on icon-only buttons
- Maintain visible focus indicators
- Color contrast ratio ≥ 4.5:1 for text
