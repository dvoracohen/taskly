// Pure theme resolution. The same key is read by the inline script in index.html.

export const THEME_KEY = 'taskly-theme';
export const THEMES = ['light', 'dark'];

/** A saved 'light' / 'dark' wins; anything else (null, junk) follows the system. */
export function resolveTheme(stored, systemPrefersDark) {
  if (THEMES.includes(stored)) return stored;
  return systemPrefersDark ? 'dark' : 'light';
}

export const oppositeTheme = (theme) => (theme === 'dark' ? 'light' : 'dark');
