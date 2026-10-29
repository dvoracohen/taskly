// Theme toggle. The saved choice lives in localStorage; without one, the system preference
// applies (in CSS) and this button just reflects it.
import { oppositeTheme, resolveTheme, THEME_KEY } from '../lib/theme.js';
import { el } from './dom.js';

const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function readSaved() {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch {
    return null;
  }
}

function save(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Storage blocked: the choice still applies for this visit.
  }
}

export function createThemeToggle() {
  const glyph = el('span', { class: 'icon-button__glyph', 'aria-hidden': 'true' });
  const text = el('span', { class: 'icon-button__text' });
  const button = el(
    'button',
    { class: 'icon-button theme-toggle', type: 'button', onClick: toggle },
    glyph,
    text,
  );

  const current = () => resolveTheme(readSaved(), systemDark.matches);

  // The label names the action: what clicking will switch to.
  function sync() {
    const next = oppositeTheme(current());
    const label = next === 'dark' ? 'מצב כהה' : 'מצב בהיר';
    glyph.textContent = next === 'dark' ? '☾' : '☀';
    text.textContent = label;
    button.setAttribute('aria-label', label);
  }

  function toggle() {
    const next = oppositeTheme(current());
    save(next);
    document.documentElement.dataset.theme = next;
    sync();
  }

  systemDark.addEventListener('change', sync);
  sync();
  return { element: button };
}
