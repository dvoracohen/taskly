// Hash routing: #/today (default), #/all, #/done.
import { VIEWS } from '../lib/views.js';

export const DEFAULT_VIEW = 'today';

/** The view named by the current hash, or null if the hash is empty or unknown. */
export function currentView() {
  const match = location.hash.match(/^#\/([a-z]+)$/);
  return match && match[1] in VIEWS ? match[1] : null;
}

/** Calls onChange(view) now and on every hash change; unknown hashes redirect to the default. */
export function startRouter(onChange) {
  const handle = () => {
    const view = currentView();
    if (!view) {
      // replace() keeps the bad hash out of history; it fires hashchange again.
      location.replace(`#/${DEFAULT_VIEW}`);
      return;
    }
    onChange(view);
  };
  window.addEventListener('hashchange', handle);
  handle();
}
