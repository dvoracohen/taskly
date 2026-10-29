import { el } from './dom.js';

const DURATION = { success: 2500, error: 5000 };

/** Creates the toast region. Call show({ type, message }) to display one. */
export function createToasts() {
  const element = el('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });

  function show({ type, message }) {
    const toast = el('div', { class: `toast toast--${type}`, text: message });
    element.append(toast);
    setTimeout(() => toast.remove(), DURATION[type] ?? DURATION.success);
  }

  return { element, show };
}
