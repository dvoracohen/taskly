// Tiny DOM builder. Text always goes through textContent / text nodes — never innerHTML.

const PROPERTIES = new Set(['value', 'checked', 'disabled', 'hidden', 'type']);

/**
 * el('button', { class: 'x', text: 'Hi', onClick: fn, 'aria-label': '…' }, ...children)
 * - `text` sets textContent; `onX` adds an event listener; null/false values are skipped.
 * - Children may be nodes or strings (strings become text nodes).
 */
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (PROPERTIES.has(key)) node[key] = value;
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  node.append(...children.flat().filter((c) => c !== null && c !== undefined && c !== false));
  return node;
}

/** Visually hidden text for screen readers. */
export const srOnly = (text) => el('span', { class: 'sr-only', text });
