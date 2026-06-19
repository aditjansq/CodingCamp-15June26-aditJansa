# Design Document — Personal Dashboard

## Overview

A single-page personal productivity dashboard built with HTML, CSS, and Vanilla JavaScript. All data is persisted client-side via `localStorage`. The app has four widgets (Greeting, Focus Timer, To-Do List, Quick Links) plus a Light/Dark theme toggle. All three chosen challenges are always-on: Light/Dark mode, Custom name in greeting, and Change Pomodoro time. Duplicate task prevention and task sorting are also implemented.

---

## File Structure

```
/
├── index.html
├── css/
│   └── style.css
└── js/
    └── app.js
```

---

## Architecture

The app uses a **module pattern** inside a single `app.js` file. Each widget is an isolated object with its own `init()`, render, and event-binding methods. A shared `Storage` utility handles all `localStorage` reads/writes with try/catch guards.

```
app.js
├── Storage        — localStorage get/set/remove helpers
├── ThemeManager   — light/dark toggle, persists preference
├── Greeting       — clock, date, greeting text, custom name
├── Timer          — Pomodoro countdown, configurable duration
├── TodoList       — CRUD tasks, duplicate check, sort
└── QuickLinks     — CRUD links, URL validation
```

No build step. `index.html` loads `css/style.css` and `js/app.js` directly. Theme is applied via a `data-theme` attribute on `<body>`. The theme script runs inline in `<head>` (before CSS renders) to prevent flash of incorrect theme.

---

## Data Models

All data stored as JSON strings in `localStorage`.

### localStorage Keys
| Key | Type | Description |
|-----|------|-------------|
| `dashboard_theme` | `"light" \| "dark"` | Current theme |
| `dashboard_name` | `string` | User's display name (1–50 chars) |
| `dashboard_pomodoro_duration` | `number` | Session length in minutes (1–60) |
| `dashboard_tasks` | `Task[]` | Ordered array of tasks |
| `dashboard_links` | `Link[]` | Ordered array of quick links |

### Task Object
```js
{
  id: string,       // crypto.randomUUID() or Date.now().toString()
  text: string,     // 1–500 characters
  done: boolean     // false on creation
}
```

### Link Object
```js
{
  id: string,       // unique id
  label: string,    // 1–50 characters, display text
  url: string       // must start with http:// or https://
}
```

---

## Component Design

### ThemeManager
- Reads `dashboard_theme` from localStorage on init
- Falls back to `"light"` if missing or invalid
- Applies `data-theme="light|dark"` to `<body>`
- Toggle button swaps value and re-applies
- CSS uses `[data-theme="dark"]` selectors for dark colours

### Greeting
- `setInterval` every 1000ms calls `updateClock()`
- `updateClock()` formats time as `HH:MM:SS`, date as `Weekday, DD Month YYYY`
- `getGreetingPrefix(hour)` returns "Good morning" / "Good afternoon" / "Good evening"
- Name loaded from localStorage on init; displayed as `"[prefix], [name]!"` when set
- Name input: 1–50 char validation on save; stored to localStorage

### Timer
- State: `{ totalSeconds, remainingSeconds, intervalId, isRunning }`
- `loadDuration()` reads `dashboard_pomodoro_duration`, defaults to 25
- `start()` — sets `isRunning = true`, starts `setInterval(tick, 1000)`, disables Start btn
- `stop()` — clears interval, sets `isRunning = false`, re-enables Start btn
- `reset()` — calls `stop()`, restores `remainingSeconds = totalSeconds`, updates display
- `tick()` — decrements `remainingSeconds`; at 0 calls `complete()`
- `complete()` — calls `stop()`, adds `.timer-done` CSS class, plays `AudioContext` beep
- Duration input: integer 1–60, saved to localStorage, triggers `reset()`

### TodoList
- Tasks array loaded from localStorage on init, rendered in order
- `addTask(text)` — trims, validates length > 0 and ≤ 500, checks duplicates (case-insensitive), pushes new Task object, saves, re-renders
- `editTask(id)` — replaces task `<li>` content with inline input + save/cancel buttons
- `saveEdit(id, newText)` — validates non-empty, updates array, saves, re-renders
- `cancelEdit(id)` — re-renders without changes
- `toggleDone(id)` — flips `done`, saves, re-renders
- `deleteTask(id)` — filters array, saves, re-renders
- `sortTasks()` — stable sort: incomplete first, preserves relative order within each group, re-renders (does not mutate saved order)
- Each re-render calls `saveTasks()` which JSON-stringifies and writes to localStorage

### QuickLinks
- Links array loaded from localStorage on init
- `addLink(label, url)` — trims both, validates non-empty + url starts with `http://` or `https://`, pushes, saves, re-renders
- `deleteLink(id)` — filters, saves, re-renders
- Clicking a link button opens `window.open(url, '_blank', 'noopener,noreferrer')`
- On localStorage read error, initialises with `[]` and logs to console

---

## UI Layout

```
┌─────────────────────────────────────────────┐
│  [🌙 Toggle]                    Personal Dashboard │
├─────────────────────────────────────────────┤
│           GREETING WIDGET                   │
│   HH:MM:SS    Weekday, DD Month YYYY        │
│   Good morning, Alex!                       │
│   [Name input ___________] [Save]           │
├──────────────────┬──────────────────────────┤
│  FOCUS TIMER     │  TO-DO LIST              │
│  25:00           │  [Add task ___] [Add]    │
│  [▶ Start]       │  [Sort]                  │
│  [⏸ Stop ]       │  ○ Task one              │
│  [↺ Reset]       │  ✓ ~~Task two~~          │
│  Duration: [25]  │                          │
├──────────────────┴──────────────────────────┤
│  QUICK LINKS                                │
│  [Label ___] [URL ___________] [Add Link]   │
│  [YouTube ×]  [GitHub ×]  [Gmail ×]         │
└─────────────────────────────────────────────┘
```

---

## CSS Design Tokens

```css
/* Light theme (default) */
[data-theme="light"] {
  --bg: #f5f5f5;
  --surface: #ffffff;
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --accent: #4f46e5;
  --border: #e0e0e0;
  --btn-bg: #4f46e5;
  --btn-text: #ffffff;
}

/* Dark theme */
[data-theme="dark"] {
  --bg: #0f0f0f;
  --surface: #1e1e1e;
  --text-primary: #f0f0f0;
  --text-secondary: #aaaaaa;
  --accent: #818cf8;
  --border: #333333;
  --btn-bg: #818cf8;
  --btn-text: #0f0f0f;
}
```

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| localStorage read fails | Widget initialises with empty/default state; logs to console |
| localStorage write fails (QuotaExceededError) | Catches error, shows inline message "Could not save — storage full" |
| Invalid theme value in storage | Defaults to `"light"` |
| Invalid name in storage | Greeting shows prefix only |
| Invalid duration in storage | Timer defaults to 25 minutes |
| Audio context blocked | Silent fail — no audible alert; visual indicator still shown |

---

## Browser Compatibility Notes

- `localStorage` — supported in all target browsers
- `crypto.randomUUID()` — supported in Chrome 92+, Firefox 95+, Safari 15.4+, Edge 92+. Fallback: `Date.now().toString() + Math.random()`
- `AudioContext` — supported in all target browsers; requires prior user gesture (Start button satisfies this)
- CSS custom properties — fully supported in all target browsers
- No ES modules, no bundler — plain `<script src="js/app.js">` tag
