# Implementation Tasks — Personal Dashboard

## Task List

- [x] 1. Project scaffold & HTML structure
- [x] 2. CSS foundation — design tokens, layout, light/dark themes
- [x] 3. Storage utility & theme manager
- [x] 4. Greeting widget — clock, date, greeting prefix, custom name
- [x] 5. Focus Timer — countdown, controls, completion alert, configurable duration
- [x] 6. To-Do List — add, edit, complete, delete, duplicate prevention, sort
- [x] 7. Quick Links — add, delete, open in new tab
- [x] 8. Polish — responsive layout, validation messages, accessibility attributes

---

## Task Details

### Task 1 — Project scaffold & HTML structure
**Files:** `index.html`

- Create `index.html` with semantic HTML5 boilerplate
- Link `css/style.css` in `<head>`
- Add inline `<script>` in `<head>` that reads `dashboard_theme` from localStorage and sets `data-theme` on `<body>` before first paint
- Add `<script src="js/app.js" defer>` before `</body>`
- Create sections: `<header>` (theme toggle), `<section id="greeting">`, `<section id="timer">`, `<section id="todo">`, `<section id="links">`
- Add all required IDs and ARIA labels for each widget

**Requirements:** R6.1, R5.4

---

### Task 2 — CSS foundation
**Files:** `css/style.css`

- Define CSS custom properties for light theme on `[data-theme="light"]` and dark theme on `[data-theme="dark"]`
- Base reset: `box-sizing`, `margin`, font family (system-ui or similar)
- Grid/flex layout for dashboard: greeting full-width top, timer + todo side by side, links full-width bottom
- Widget card styles using `--surface`, `--border`
- Button base styles, `.btn-primary`, `.btn-secondary`, `.btn-icon`
- Timer display: large `font-size`, monospace font
- Todo item styles: checkbox, strikethrough on `.done`, edit mode input
- Quick link button pill styles
- `.timer-done` class: accent border/background for completion indicator
- Responsive: stack to single column below 768px
- Smooth theme transition: `transition: background-color 0.2s, color 0.2s`

**Requirements:** R5.1, R5.2, R6.3, NFR-3

---

### Task 3 — Storage utility & ThemeManager
**Files:** `js/app.js`

- Implement `Storage` object with:
  - `get(key, fallback)` — try/catch JSON.parse, return fallback on error
  - `set(key, value)` — try/catch JSON.stringify + setItem, catch QuotaExceededError
  - `remove(key)`
- Implement `ThemeManager` object with:
  - `init()` — reads `dashboard_theme`, validates (`"light"` or `"dark"`), applies to `document.body.dataset.theme`, defaults to `"light"`
  - `toggle()` — flips theme, saves to localStorage, applies to body
  - Binds click on `#theme-toggle` button

**Requirements:** R5.1–R5.5, R6.1

---

### Task 4 — Greeting widget
**Files:** `js/app.js`

- Implement `Greeting` object with:
  - `init()` — loads name from localStorage, starts clock interval, calls `render()`
  - `updateClock()` — formats time as `HH:MM:SS`, date as `Weekday, DD Month YYYY` using `Date` API
  - `getPrefix(hour)` — returns "Good morning" (5–11), "Good afternoon" (12–17), "Good evening" (18–23, 0–4)
  - `render()` — builds greeting string: `"[prefix], [name]!"` if name saved, else `"[prefix]"` only
  - `saveName(value)` — trims, validates 1–50 chars, saves to localStorage, calls `render()`
  - Binds click on save button; on localStorage read error degrades to prefix-only
- `setInterval(updateClock, 1000)` started in `init()`

**Requirements:** R1.1–R1.11

---

### Task 5 — Focus Timer
**Files:** `js/app.js`

- Implement `Timer` object with state `{ totalSeconds, remainingSeconds, intervalId, isRunning }`
- `init()` — calls `loadDuration()`, renders initial display, binds Start/Stop/Reset/Save-duration buttons
- `loadDuration()` — reads `dashboard_pomodoro_duration`, validates integer 1–60, defaults to 25
- `formatTime(seconds)` — returns `"MM:SS"` string
- `updateDisplay()` — sets `#timer-display` text content
- `start()` — guards if already running; sets `isRunning = true`; disables Start btn; enables Stop/Reset; starts `setInterval(tick, 1000)`
- `stop()` — clears interval, sets `isRunning = false`, re-enables Start, hides completion indicator
- `reset()` — calls `stop()`, restores `remainingSeconds = totalSeconds`, calls `updateDisplay()`
- `tick()` — decrements `remainingSeconds`, calls `updateDisplay()`; if `remainingSeconds === 0` calls `complete()`
- `complete()` — calls `stop()`, adds `.timer-done` to timer element, plays `AudioContext` beep (440 Hz, 0.5s); wraps AudioContext in try/catch for silent fail
- `saveDuration(minutes)` — validates 1–60 integer, saves to localStorage, updates `totalSeconds`, calls `reset()`

**Requirements:** R2.1–R2.10

---

### Task 6 — To-Do List
**Files:** `js/app.js`

- Implement `TodoList` object with state `{ tasks: [] }`
- `init()` — loads tasks from localStorage via `Storage.get`, calls `render()`
- `saveTasks()` — calls `Storage.set('dashboard_tasks', tasks)`; on QuotaExceededError shows inline error message
- `render()` — clears `#todo-list` ul, maps `tasks` array to `<li>` elements; completed tasks get `.done` class + strikethrough
- Each `<li>` has: checkbox (toggle done), task text span, Edit button, Delete button
- `addTask(text)` — trims, validates non-empty + ≤ 500 chars, checks case-insensitive duplicate against existing tasks, pushes `{ id, text, done: false }`, calls `saveTasks()` + `render()`
- `enterEditMode(id)` — replaces task `<li>` content with `<input>` pre-filled with current text, Save and Cancel buttons
- `saveEdit(id, newText)` — trims, validates non-empty, finds task by id, updates text, calls `saveTasks()` + `render()`
- `cancelEdit()` — calls `render()` without changes
- `toggleDone(id)` — flips `done` boolean, calls `saveTasks()` + `render()`
- `deleteTask(id)` — filters out task, calls `saveTasks()` + `render()`
- `sort()` — creates sorted copy (incomplete first, stable), re-renders without mutating saved order
- Binds Add button click and Enter key on add input; binds Sort button click

**Requirements:** R3.1–R3.11

---

### Task 7 — Quick Links
**Files:** `js/app.js`

- Implement `QuickLinks` object with state `{ links: [] }`
- `init()` — loads links from localStorage via `Storage.get` with try/catch; on error logs to console and uses `[]`; calls `render()`
- `savLinks()` — calls `Storage.set('dashboard_links', links)`
- `render()` — clears `#links-list`, maps `links` to pill `<button>` elements each with a delete `×` button
- `addLink(label, url)` — trims both; validates label non-empty + ≤ 50 chars; validates url non-empty + starts with `http://` or `https://`; pushes `{ id, label, url }`; calls `saveLinks()` + `render()`
- `deleteLink(id)` — filters out link, calls `saveLinks()` + `render()`
- Clicking a link button calls `window.open(url, '_blank', 'noopener,noreferrer')`
- Binds Add button click; shows inline validation messages on invalid input

**Requirements:** R4.1–R4.7

---

### Task 8 — Polish & accessibility
**Files:** `index.html`, `css/style.css`, `js/app.js`

- Add `aria-label` to all icon-only buttons (theme toggle, delete, edit)
- Add `role="list"` to task and link lists
- Add `aria-live="polite"` to validation message containers so screen readers announce errors
- Ensure focus is returned to the add-task input after adding a task
- Ensure focus is returned to the edit button after cancelling edit
- Verify tab order is logical across all widgets
- Add `<meta name="viewport" content="width=device-width, initial-scale=1">` in HTML head
- Test all four widgets render without overflow on 375px viewport
- Verify no JavaScript errors on load in all target browsers

**Requirements:** R6.3, NFR-1, NFR-3
