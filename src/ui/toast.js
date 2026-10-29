import { el } from './dom.js';

const DURATION = { success: 2500, error: 5000, undo: 5000 };

/**
 * Creates the toast region. show(notice) handles store notices:
 * { type, message, action?: { label, run }, key? } and { type: 'dismiss', key }.
 */
export function createToasts() {
  const element = el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
  const byKey = new Map();

  function remove(toast, key) {
    toast.remove();
    if (key && byKey.get(key) === toast) byKey.delete(key);
  }

  function show({ type, message, action, key }) {
    if (type === 'dismiss') {
      const toast = byKey.get(key);
      if (toast) remove(toast, key);
      return;
    }

    const toast = el(
      'div',
      { class: `toast toast--${type}` },
      el('span', { text: message }),
      action
        ? el('button', {
            class: 'toast__action',
            type: 'button',
            text: action.label,
            onClick: () => {
              remove(toast, key);
              action.run();
            },
          })
        : null,
    );
    element.append(toast);
    if (key) byKey.set(key, toast);
    setTimeout(() => remove(toast, key), DURATION[type] ?? DURATION.success);
  }

  return { element, show };
}
