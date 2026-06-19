# Requirements Document

## Introduction

The Personal Dashboard is a client-side web application built with HTML, CSS, and Vanilla JavaScript. It provides a focused, distraction-free productivity hub that runs entirely in the browser with no backend server. On load, it greets the user by name and shows the current time and date, a Pomodoro focus timer, a persistent to-do list, and a set of quick-access links — all stored in the browser's Local Storage. Optional enhancements include light/dark mode, a custom name in the greeting, a configurable Pomodoro duration, duplicate task prevention, and task sorting.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Local_Storage**: The browser's `localStorage` API used for client-side persistence.
- **Greeting_Widget**: The section that displays the current time, date, and a personalized greeting message.
- **Focus_Timer**: The Pomodoro-style countdown timer widget.
- **Todo_List**: The task management widget that stores, displays, and manages user tasks.
- **Quick_Links**: The widget that stores and displays user-defined shortcut links to external websites.
- **Task**: A single to-do item with a text description and a completion state.
- **Link**: A user-defined entry containing a label and a URL.
- **Session**: The active countdown interval started by the Focus_Timer.
- **Pomodoro_Duration**: The configurable length of a focus session in minutes; defaults to 25.

---

## Requirements

### Requirement 1: Greeting Widget

**User Story:** As a user, I want to see the current time, date, and a contextual greeting when I open the dashboard, so that I have an immediate sense of the time of day without leaving the tab.

#### Acceptance Criteria

1. THE Greeting_Widget SHALL display the current date in the format "Weekday, DD Month YYYY" (e.g., "Monday, 16 June 2025").
2. THE Greeting_Widget SHALL display the current time in HH:MM:SS 24-hour format, updated on an interval of exactly one second (±1 second tolerance).
3. WHEN the local hour is between 05:00 and 11:59, THE Greeting_Widget SHALL display the greeting prefix "Good morning".
4. WHEN the local hour is between 12:00 and 17:59, THE Greeting_Widget SHALL display the greeting prefix "Good afternoon".
5. WHEN the local hour is between 18:00 and 23:59, THE Greeting_Widget SHALL display the greeting prefix "Good evening".
6. WHEN the local hour is between 00:00 and 04:59, THE Greeting_Widget SHALL display the greeting prefix "Good evening".
7. IF a custom display name has been saved to Local_Storage, THEN THE Greeting_Widget SHALL display the greeting as "[prefix], [name]!" (e.g., "Good morning, Alex!").
8. IF no custom display name has been saved to Local_Storage, THEN THE Greeting_Widget SHALL display the greeting prefix only, without any name appended.
9. WHERE the custom name feature is enabled, THE Dashboard SHALL provide an input field that allows the user to enter a display name of between 1 and 50 characters and save it to Local_Storage via an explicit save action.
10. WHEN a display name is saved to Local_Storage, THE Greeting_Widget SHALL load and display that name on every subsequent page load.
11. IF reading the display name from Local_Storage fails or returns an unrecognised value, THEN THE Greeting_Widget SHALL degrade gracefully and display the greeting prefix only, without any name appended.

---

### Requirement 2: Focus Timer

**User Story:** As a user, I want a Pomodoro countdown timer with Start, Stop, and Reset controls, so that I can manage focused work sessions without switching to another app.

#### Acceptance Criteria

1. THE Focus_Timer SHALL display the remaining time in MM:SS format.
2. WHEN the Dashboard loads, THE Focus_Timer SHALL initialise the display to the current Pomodoro_Duration (default 25:00).
3. WHEN the user activates the Start control, THE Focus_Timer SHALL begin counting down one second per real-world second.
4. WHILE a Session is active, THE Focus_Timer SHALL disable the Start control and keep the Stop and Reset controls available to prevent duplicate sessions.
5. WHEN the user activates the Stop control and a Session is active, THE Focus_Timer SHALL pause the countdown and retain the remaining time.
6. IF the user activates the Stop control and no Session is active, THEN THE Focus_Timer SHALL take no action (idempotent).
7. WHEN the user activates the Reset control, THE Focus_Timer SHALL stop any active Session and restore the display to the full Pomodoro_Duration.
8. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop the Session, display a visible completion indicator (e.g., a message or colour change), and play an audible alert sound.
9. WHERE the configurable Pomodoro duration feature is enabled, THE Dashboard SHALL provide an input that allows the user to set Pomodoro_Duration to a whole number of minutes between 1 and 60.
10. WHERE the configurable Pomodoro duration feature is enabled, WHEN the user saves a new Pomodoro_Duration, THE Focus_Timer SHALL persist the value to Local_Storage and reset the display to the new duration.

---

### Requirement 3: To-Do List

**User Story:** As a user, I want to add, edit, complete, and delete tasks that persist across browser sessions, so that I can track my daily to-dos without losing them on page refresh.

#### Acceptance Criteria

1. THE Todo_List SHALL persist all Tasks to Local_Storage so that the list is restored in insertion order on every page load.
2. WHEN the user submits a non-empty task description of up to 500 characters, THE Todo_List SHALL add a new Task with completion state set to false.
3. IF the user submits an empty or whitespace-only task description, THEN THE Todo_List SHALL reject the submission and display an inline validation message.
4. WHEN the user activates the edit control for a Task, THE Todo_List SHALL enter edit mode for that Task, presenting the existing description in an editable input field with a save and a cancel action.
5. WHEN the user saves an edited task description that is non-empty, THE Todo_List SHALL update the Task text, exit edit mode, and persist the change to Local_Storage.
6. IF the user saves an edited task description that is empty or whitespace-only, THEN THE Todo_List SHALL reject the save and display an inline validation message.
7. WHEN the user activates the cancel action during edit mode, THE Todo_List SHALL discard changes and restore the original task description without modifying Local_Storage.
8. WHEN the user activates the complete control for a Task, THE Todo_List SHALL toggle the Task's completion state and apply a strikethrough style to completed tasks.
9. WHEN the user activates the delete control for a Task, THE Todo_List SHALL permanently remove the Task from the list and from Local_Storage.
10. WHERE the duplicate task prevention feature is enabled, IF the user submits a task description that matches an existing Task description (case-insensitive), THEN THE Todo_List SHALL reject the submission and display a duplicate-warning message.
11. WHERE the task sorting feature is enabled, WHEN the user activates the sort control, THE Todo_List SHALL reorder the displayed list so that incomplete tasks appear before completed tasks.

---

### Requirement 4: Quick Links

**User Story:** As a user, I want to save and display shortcut buttons to my favourite websites, so that I can navigate to them in one click directly from the dashboard.

#### Acceptance Criteria

1. THE Quick_Links widget SHALL persist all Links to Local_Storage so that the list is restored in insertion order on every page load.
2. WHEN the user submits a Link with a non-empty label (up to 50 characters) and a valid URL, THE Quick_Links widget SHALL add the Link and render it as a clickable button.
3. IF the user submits a Link with an empty label or an empty URL field, THEN THE Quick_Links widget SHALL reject the submission and display an inline validation message identifying the empty field.
4. IF the user submits a URL that does not begin with "http://" or "https://", THEN THE Quick_Links widget SHALL reject the submission and display a URL format validation message.
5. WHEN the user activates a Link button, THE Dashboard SHALL open the associated URL in a new browser tab without navigating away from the dashboard.
6. WHEN the user activates the delete control for a Link, THE Quick_Links widget SHALL permanently remove the Link from the list and from Local_Storage.
7. IF reading Links from Local_Storage fails or returns malformed data, THEN THE Quick_Links widget SHALL initialise with an empty list and log the error to the browser console.

---

### Requirement 5: Light / Dark Mode

**User Story:** As a user, I want to toggle between light and dark visual themes, so that I can use the dashboard comfortably in different lighting conditions.

#### Acceptance Criteria

1. WHERE the light/dark mode feature is enabled, THE Dashboard SHALL provide a toggle control that switches between a light theme and a dark theme.
2. WHEN the user activates the theme toggle, THE Dashboard SHALL apply the selected theme to all visible UI elements within 300 milliseconds, without a page reload.
3. WHEN a theme is selected, THE Dashboard SHALL persist the user's theme preference to Local_Storage.
4. WHEN the Dashboard loads and a valid theme preference is found in Local_Storage, THE Dashboard SHALL apply that theme before first paint to prevent a flash of incorrect theme.
5. IF no theme preference is found in Local_Storage or the stored value is unrecognised, THEN THE Dashboard SHALL apply the light theme as the default.

---

### Requirement 6: Application Structure and Performance

**User Story:** As a developer, I want the codebase to follow strict structural conventions and load quickly, so that the project remains maintainable and performant.

#### Acceptance Criteria

1. THE Dashboard SHALL be implemented using exactly one HTML file, one CSS file located in the `css/` directory, and one JavaScript file located in the `js/` directory.
2. THE Dashboard SHALL contain no server-side code and require no build step or development server to run.
3. WHEN the Dashboard is opened in Chrome, Firefox, Edge, or Safari (latest stable versions), THE Dashboard SHALL render all widgets visible in the viewport without clipping or overflow, and produce no JavaScript errors in the browser console.
4. WHEN the Dashboard page loads on a connection of at least 10 Mbps, THE Dashboard SHALL reach an interactive state — defined as all widgets rendered and responsive to user input — within 2 seconds.
5. WHEN the user interacts with any widget (adding a task, toggling theme, clicking a link), THE Dashboard SHALL reflect the visual change in the UI within 100 milliseconds without a page reload, and persist the data to Local_Storage before the next user interaction.
