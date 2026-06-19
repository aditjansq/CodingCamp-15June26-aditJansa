/* ============================================================
   Personal Dashboard — app.js
   Vanilla JS only. No frameworks. No build step.
   ============================================================ */

'use strict';

/* ============================================================
   STORAGE UTILITY
   ============================================================ */
const Storage = {
  get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.error('[Storage.get] Failed to read key:', key, e);
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.error('[Storage.set] localStorage quota exceeded for key:', key);
      } else {
        console.error('[Storage.set] Failed to write key:', key, e);
      }
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error('[Storage.remove] Failed to remove key:', key, e);
    }
  }
};

/* ============================================================
   HELPERS
   ============================================================ */
function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = message;
  // auto-clear after 3s
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.textContent = ''; }, 3000);
}

function clearError(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = '';
}

/* ============================================================
   THEME MANAGER
   ============================================================ */
const ThemeManager = {
  VALID: ['light', 'dark'],

  init() {
    // Theme already applied in <head> inline script; just sync the icon
    this.syncIcon();
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', () => this.toggle());
  },

  current() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  },

  apply(theme) {
    const t = this.VALID.includes(theme) ? theme : 'light';
    document.documentElement.setAttribute('data-theme', t);
    Storage.set('dashboard_theme', t);
    this.syncIcon();
  },

  toggle() {
    this.apply(this.current() === 'light' ? 'dark' : 'light');
  },

  syncIcon() {
    const icon = document.getElementById('theme-icon');
    if (icon) icon.textContent = this.current() === 'dark' ? '☀️' : '🌙';
  }
};

/* ============================================================
   GREETING WIDGET
   ============================================================ */
const Greeting = {
  intervalId: null,

  init() {
    this.updateClock();
    this.intervalId = setInterval(() => this.updateClock(), 1000);

    // Load saved name
    const savedName = this.loadName();
    const nameInput = document.getElementById('name-input');
    if (nameInput && savedName) nameInput.value = savedName;

    // Bind save button
    const saveBtn = document.getElementById('name-save');
    if (saveBtn) saveBtn.addEventListener('click', () => this.handleSaveName());

    // Allow Enter key in name input
    if (nameInput) {
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.handleSaveName();
      });
    }
  },

  loadName() {
    try {
      const raw = localStorage.getItem('dashboard_name');
      if (!raw) return '';
      const name = JSON.parse(raw);
      if (typeof name === 'string' && name.length >= 1 && name.length <= 50) {
        return name;
      }
      return '';
    } catch (e) {
      return '';
    }
  },

  updateClock() {
    const now = new Date();

    // Time: HH:MM:SS
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const timeEl = document.getElementById('greeting-time');
    if (timeEl) timeEl.textContent = `${h}:${m}:${s}`;

    // Date: Weekday, DD Month YYYY
    const dateEl = document.getElementById('greeting-date');
    if (dateEl) {
      dateEl.textContent = now.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }

    // Greeting
    this.renderGreeting(now.getHours());
  },

  getPrefix(hour) {
    if (hour >= 5 && hour < 12)  return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    return 'Good evening';
  },

  renderGreeting(hour) {
    const prefix = this.getPrefix(hour);
    const name   = this.loadName();
    const text   = name ? `${prefix}, ${name}!` : prefix;
    const el     = document.getElementById('greeting-text');
    if (el) el.textContent = text;
  },

  handleSaveName() {
    const input = document.getElementById('name-input');
    if (!input) return;
    const value = input.value.trim();
    if (value.length < 1) {
      showError('name-error', 'Please enter a name (1–50 characters).');
      return;
    }
    if (value.length > 50) {
      showError('name-error', 'Name must be 50 characters or fewer.');
      return;
    }
    Storage.set('dashboard_name', value);
    clearError('name-error');
    // Re-render greeting immediately
    this.renderGreeting(new Date().getHours());
  }
};

/* ============================================================
   FOCUS TIMER
   ============================================================ */
const Timer = {
  totalSeconds:     25 * 60,
  remainingSeconds: 25 * 60,
  intervalId:       null,
  isRunning:        false,

  init() {
    this.loadDuration();
    this.bindControls();
    this.updateDisplay();
    this.syncDurationInput();
  },

  loadDuration() {
    const saved = Storage.get('dashboard_pomodoro_duration', null);
    const mins  = parseInt(saved, 10);
    const valid = Number.isInteger(mins) && mins >= 1 && mins <= 60;
    const duration = valid ? mins : 25;
    this.totalSeconds     = duration * 60;
    this.remainingSeconds = duration * 60;
  },

  bindControls() {
    document.getElementById('timer-start')?.addEventListener('click', () => this.start());
    document.getElementById('timer-stop')?.addEventListener('click',  () => this.stop());
    document.getElementById('timer-reset')?.addEventListener('click', () => this.reset());
    document.getElementById('duration-save')?.addEventListener('click', () => this.handleSaveDuration());
    document.getElementById('duration-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleSaveDuration();
    });
  },

  formatTime(seconds) {
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    return `${m}:${s}`;
  },

  updateDisplay() {
    const el = document.getElementById('timer-display');
    if (el) el.textContent = this.formatTime(this.remainingSeconds);
  },

  syncDurationInput() {
    const input = document.getElementById('duration-input');
    if (input) input.value = Math.round(this.totalSeconds / 60);
  },

  start() {
    if (this.isRunning) return;
    // Clear completion state if restarting
    document.getElementById('timer-display')?.classList.remove('timer-done');
    const doneMsg = document.getElementById('timer-done-msg');
    if (doneMsg) doneMsg.textContent = '';

    this.isRunning = true;
    this.setButtonStates();
    this.intervalId = setInterval(() => this.tick(), 1000);
  },

  stop() {
    if (!this.isRunning) return; // idempotent
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning  = false;
    this.setButtonStates();
  },

  reset() {
    this.stop();
    this.remainingSeconds = this.totalSeconds;
    this.updateDisplay();
    document.getElementById('timer-display')?.classList.remove('timer-done');
    const doneMsg = document.getElementById('timer-done-msg');
    if (doneMsg) doneMsg.textContent = '';
    this.setButtonStates();
  },

  tick() {
    this.remainingSeconds--;
    this.updateDisplay();
    if (this.remainingSeconds <= 0) {
      this.complete();
    }
  },

  complete() {
    this.stop();
    // Visual indicator
    document.getElementById('timer-display')?.classList.add('timer-done');
    const doneMsg = document.getElementById('timer-done-msg');
    if (doneMsg) doneMsg.textContent = '🎉 Session complete!';
    // Audible alert
    this.playBeep();
  },

  playBeep() {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 1.0);
    } catch (e) {
      // Silent fail — audio blocked or unavailable
      console.warn('[Timer.playBeep] Audio unavailable:', e.message);
    }
  },

  setButtonStates() {
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');
    if (startBtn) startBtn.disabled = this.isRunning;
    if (stopBtn)  stopBtn.disabled  = !this.isRunning;
    if (resetBtn) resetBtn.disabled = false;
  },

  handleSaveDuration() {
    const input = document.getElementById('duration-input');
    if (!input) return;
    const raw  = input.value.trim();
    const mins = parseInt(raw, 10);
    if (!Number.isInteger(mins) || mins < 1 || mins > 60) {
      showError('duration-error', 'Please enter a whole number between 1 and 60.');
      return;
    }
    clearError('duration-error');
    Storage.set('dashboard_pomodoro_duration', mins);
    this.totalSeconds = mins * 60;
    this.reset();
  }
};

/* ============================================================
   TO-DO LIST
   ============================================================ */
const TodoList = {
  tasks: [],

  init() {
    this.tasks = Storage.get('dashboard_tasks', []);
    if (!Array.isArray(this.tasks)) this.tasks = [];
    this.bindControls();
    this.render();
  },

  bindControls() {
    document.getElementById('todo-add')?.addEventListener('click', () => this.handleAdd());
    document.getElementById('todo-sort')?.addEventListener('click', () => this.sort());
    document.getElementById('todo-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleAdd();
    });
  },

  saveTasks() {
    const ok = Storage.set('dashboard_tasks', this.tasks);
    if (!ok) showError('todo-error', 'Could not save — storage full.');
  },

  handleAdd() {
    const input = document.getElementById('todo-input');
    if (!input) return;
    const text = input.value.trim();

    if (text.length === 0) {
      showError('todo-error', 'Task cannot be empty.');
      return;
    }
    if (text.length > 500) {
      showError('todo-error', 'Task must be 500 characters or fewer.');
      return;
    }
    // Duplicate check (case-insensitive)
    const isDuplicate = this.tasks.some(
      t => t.text.toLowerCase() === text.toLowerCase()
    );
    if (isDuplicate) {
      showError('todo-error', 'This task already exists.');
      return;
    }

    clearError('todo-error');
    this.tasks.push({ id: generateId(), text, done: false });
    this.saveTasks();
    this.render();
    input.value = '';
    input.focus();
  },

  toggleDone(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.done = !task.done;
      this.saveTasks();
      this.render();
    }
  },

  deleteTask(id) {
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasks();
    this.render();
  },

  sort() {
    // Stable sort: incomplete first, preserve relative order within groups
    const incomplete = this.tasks.filter(t => !t.done);
    const done       = this.tasks.filter(t =>  t.done);
    // Render only — do NOT mutate saved order
    this.renderList([...incomplete, ...done]);
  },

  render() {
    this.renderList(this.tasks);
  },

  renderList(list) {
    const ul = document.getElementById('todo-list');
    if (!ul) return;
    ul.innerHTML = '';

    if (list.length === 0) {
      const empty = document.createElement('li');
      empty.textContent = 'No tasks yet. Add one above!';
      empty.style.cssText = 'color:var(--text-secondary);font-size:0.875rem;padding:0.5rem 0;';
      ul.appendChild(empty);
      return;
    }

    list.forEach(task => {
      const li = document.createElement('li');
      li.className = `todo-item${task.done ? ' done' : ''}`;
      li.dataset.id = task.id;

      // Checkbox
      const checkbox = document.createElement('input');
      checkbox.type      = 'checkbox';
      checkbox.className = 'todo-checkbox';
      checkbox.checked   = task.done;
      checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'incomplete' : 'complete'}`);
      checkbox.addEventListener('change', () => this.toggleDone(task.id));

      // Text
      const span = document.createElement('span');
      span.className = 'todo-text';
      span.textContent = task.text;

      // Actions
      const actions = document.createElement('div');
      actions.className = 'todo-item-actions';

      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-secondary btn-small';
      editBtn.textContent = '✏️';
      editBtn.setAttribute('aria-label', `Edit task: ${task.text}`);
      editBtn.addEventListener('click', () => this.enterEditMode(task.id));

      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn-secondary btn-small';
      delBtn.textContent = '🗑️';
      delBtn.setAttribute('aria-label', `Delete task: ${task.text}`);
      delBtn.addEventListener('click', () => this.deleteTask(task.id));

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(actions);
      ul.appendChild(li);
    });
  },

  enterEditMode(id) {
    const task = this.tasks.find(t => t.id === id);
    if (!task) return;

    const li = document.querySelector(`#todo-list [data-id="${id}"]`);
    if (!li) return;

    // Replace content with edit input
    li.innerHTML = '';
    li.className = 'todo-item';

    const editInput = document.createElement('input');
    editInput.type      = 'text';
    editInput.className = 'todo-edit-input';
    editInput.value     = task.text;
    editInput.maxLength = 500;
    editInput.setAttribute('aria-label', 'Edit task text');

    const actions = document.createElement('div');
    actions.className = 'todo-item-actions';

    const saveBtn = document.createElement('button');
    saveBtn.className   = 'btn btn-primary btn-small';
    saveBtn.textContent = '✔';
    saveBtn.setAttribute('aria-label', 'Save edit');
    saveBtn.addEventListener('click', () => this.saveEdit(id, editInput.value));

    const cancelBtn = document.createElement('button');
    cancelBtn.className   = 'btn btn-secondary btn-small';
    cancelBtn.textContent = '✖';
    cancelBtn.setAttribute('aria-label', 'Cancel edit');
    cancelBtn.addEventListener('click', () => this.render());

    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  this.saveEdit(id, editInput.value);
      if (e.key === 'Escape') this.render();
    });

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);
    li.appendChild(editInput);
    li.appendChild(actions);
    editInput.focus();
    editInput.select();
  },

  saveEdit(id, newText) {
    const text = newText.trim();
    if (text.length === 0) {
      showError('todo-error', 'Task cannot be empty.');
      return;
    }
    if (text.length > 500) {
      showError('todo-error', 'Task must be 500 characters or fewer.');
      return;
    }
    clearError('todo-error');
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.text = text;
      this.saveTasks();
    }
    this.render();
  }
};

/* ============================================================
   QUICK LINKS
   ============================================================ */
const QuickLinks = {
  links: [],

  init() {
    try {
      const saved = Storage.get('dashboard_links', []);
      this.links = Array.isArray(saved) ? saved : [];
    } catch (e) {
      console.error('[QuickLinks.init] Failed to load links:', e);
      this.links = [];
    }
    this.bindControls();
    this.render();
  },

  bindControls() {
    document.getElementById('link-add')?.addEventListener('click', () => this.handleAdd());
    document.getElementById('link-url')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleAdd();
    });
    document.getElementById('link-label')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleAdd();
    });
  },

  saveLinks() {
    const ok = Storage.set('dashboard_links', this.links);
    if (!ok) showError('links-error', 'Could not save — storage full.');
  },

  handleAdd() {
    const labelInput = document.getElementById('link-label');
    const urlInput   = document.getElementById('link-url');
    if (!labelInput || !urlInput) return;

    const label = labelInput.value.trim();
    const url   = urlInput.value.trim();

    if (label.length === 0) {
      showError('links-error', 'Label cannot be empty.');
      return;
    }
    if (label.length > 50) {
      showError('links-error', 'Label must be 50 characters or fewer.');
      return;
    }
    if (url.length === 0) {
      showError('links-error', 'URL cannot be empty.');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      showError('links-error', 'URL must start with http:// or https://');
      return;
    }

    clearError('links-error');
    this.links.push({ id: generateId(), label, url });
    this.saveLinks();
    this.render();
    labelInput.value = '';
    urlInput.value   = '';
    labelInput.focus();
  },

  deleteLink(id) {
    this.links = this.links.filter(l => l.id !== id);
    this.saveLinks();
    this.render();
  },

  render() {
    const container = document.getElementById('links-list');
    if (!container) return;
    container.innerHTML = '';

    if (this.links.length === 0) {
      const empty = document.createElement('p');
      empty.textContent = 'No links yet. Add your favourite sites above!';
      empty.style.cssText = 'color:var(--text-secondary);font-size:0.875rem;';
      container.appendChild(empty);
      return;
    }

    this.links.forEach(link => {
      const item = document.createElement('div');
      item.className = 'link-item';
      item.setAttribute('role', 'listitem');

      const btn = document.createElement('button');
      btn.className   = 'link-btn';
      btn.textContent = link.label;
      btn.setAttribute('aria-label', `Open ${link.label} (${link.url})`);
      btn.addEventListener('click', () => {
        window.open(link.url, '_blank', 'noopener,noreferrer');
      });

      const delBtn = document.createElement('button');
      delBtn.className   = 'link-delete';
      delBtn.textContent = '×';
      delBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
      delBtn.addEventListener('click', () => this.deleteLink(link.id));

      item.appendChild(btn);
      item.appendChild(delBtn);
      container.appendChild(item);
    });
  }
};

/* ============================================================
   BOOTSTRAP — init all modules on DOMContentLoaded
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  Greeting.init();
  Timer.init();
  TodoList.init();
  QuickLinks.init();
});
