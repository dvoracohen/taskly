// Pure keyboard-shortcut matching. Takes a KeyboardEvent-like object.
//   n  (or מ, the same key on a Hebrew layout)  -> 'new'
//   /  (or ., the same key on a Hebrew layout)  -> 'search'
//   Ctrl/Cmd+Z                                  -> 'undo'
// Shortcuts are ignored while typing in a field. Esc is handled natively by <dialog>
// and by the mobile menu itself.

const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTyping(target) {
  if (!target) return false;
  return TYPING_TAGS.has(target.tagName) || Boolean(target.isContentEditable);
}

export function matchShortcut({ key, ctrlKey, metaKey, altKey, target }) {
  if (isTyping(target)) return null;

  if ((ctrlKey || metaKey) && !altKey && (key === 'z' || key === 'Z' || key === 'ז')) {
    return 'undo';
  }
  if (ctrlKey || metaKey || altKey) return null;

  if (key === 'n' || key === 'N' || key === 'מ') return 'new';
  if (key === '/' || key === '.') return 'search';
  return null;
}
