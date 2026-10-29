// Global keyboard shortcuts. Matching is pure (lib/shortcuts.js); this only dispatches.
import { matchShortcut } from '../lib/shortcuts.js';
import { el } from './dom.js';

/** handlers: { new(), search(), undo() → boolean (true if something was undone) } */
export function installShortcuts(handlers) {
  document.addEventListener('keydown', (event) => {
    // Shortcuts are for the page itself, not while a dialog or the mobile menu is open.
    if (event.defaultPrevented || document.querySelector('dialog[open], .sidebar--open')) return;

    const action = matchShortcut(event);
    if (!action) return;
    if (action === 'undo' && !handlers.undo()) return; // nothing to undo: let the browser act
    if (action !== 'undo') handlers[action]();
    event.preventDefault();
  });
}

/** Small visible hint listing the shortcuts (hidden on touch-only devices via CSS). */
export function shortcutHint() {
  const key = (text) => el('kbd', { text });
  return el(
    'p',
    { class: 'shortcut-hint' },
    'קיצורים: ',
    key('n'),
    ' משימה חדשה · ',
    key('/'),
    ' חיפוש · ',
    key('Esc'),
    ' סגירה · ',
    key('Ctrl+Z'),
    ' ביטול מחיקה',
  );
}
