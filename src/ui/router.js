// Hash routing: #/today (default), #/all, #/done, #/category/:id, #/category/none.
import { VIEWS } from '../lib/views.js';

export const DEFAULT_HASH = '#/today';

/**
 * Parses a hash into a route, or null if it is empty / unknown.
 * Routes: { view: 'today'|'all'|'done' } or { view: 'category', categoryId: string|null }.
 */
export function parseHash(hash) {
  const view = hash.match(/^#\/([a-z]+)$/);
  if (view && view[1] in VIEWS) return { view: view[1] };

  const category = hash.match(/^#\/category\/([A-Za-z0-9-]+)$/);
  if (category) {
    return { view: 'category', categoryId: category[1] === 'none' ? null : category[1] };
  }
  return null;
}

/** The hash for a route (inverse of parseHash). */
export function routeHash(route) {
  if (route.view !== 'category') return `#/${route.view}`;
  return `#/category/${route.categoryId ?? 'none'}`;
}

/** Calls onChange(route) now and on every hash change; unknown hashes redirect to the default. */
export function startRouter(onChange) {
  const handle = () => {
    const route = parseHash(location.hash);
    if (!route) {
      // replace() keeps the bad hash out of history; it fires hashchange again.
      location.replace(DEFAULT_HASH);
      return;
    }
    onChange(route);
  };
  window.addEventListener('hashchange', handle);
  handle();
}
