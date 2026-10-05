# UI/UX Conventions

## Design Language

- **Style:** Clean, modern, minimal — inspired by Linear and Notion
- **Color scheme:** Indigo primary (#6366f1), white background, gray neutrals
- **Typography:** System font stack for speed; no external font loading
- **Spacing:** 8px grid system

## Layout

- Max content width: 720px, centered
- Header with app name and task counter badge
- Input section: text field + add button always visible at top
- Filter bar: All / Active / Completed tabs + search box
- Task list: scrollable, with smooth transitions
- Footer: task count summary

## Task Item Design

- Checkbox on left (large, easy to click on mobile)
- Task text in center (strikethrough when completed)
- Priority badge (colored pill): Low=green, Medium=yellow, High=red
- Due date display with overdue highlighting (red text)
- Edit and Delete buttons appear on hover/focus (icon buttons)
- Completed tasks shown with reduced opacity

## Interaction Patterns

- Add task: press Enter or click Add button
- Edit task: click text or edit icon → inline edit mode → Enter/blur to save
- Delete: click trash icon → immediate removal (no confirmation needed for speed)
- Complete: click checkbox → immediate toggle
- Search: real-time filtering as user types
- Filter tabs: single-click tab switching

## Empty States

- No tasks at all: illustration + "No tasks yet — add one above!"
- No results for search/filter: "No tasks match your search"

## Responsive Breakpoints

- Mobile (<480px): single column, larger touch targets
- Tablet/Desktop (≥480px): comfortable padding, hover states

## Validation

- Empty task text: show inline red message "Task cannot be empty"
- Message auto-dismisses after 3 seconds or on next input
