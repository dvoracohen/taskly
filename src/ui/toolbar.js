import { SORT_OPTIONS } from '../lib/query.js';
import { el } from './dom.js';

/** Search field + sort select. Calls onChange({ search, sort }) whenever either changes. */
export function createToolbar({ onChange }) {
  const search = el('input', {
    class: 'toolbar__search',
    type: 'search',
    placeholder: 'חיפוש…',
    'aria-label': 'חיפוש משימות',
    autocomplete: 'off',
    onInput: emit,
  });
  const sort = el(
    'select',
    { class: 'toolbar__sort', onChange: emit },
    SORT_OPTIONS.map(([value, label]) => el('option', { value, text: label })),
  );

  function emit() {
    onChange({ search: search.value, sort: sort.value });
  }

  const element = el(
    'div',
    { class: 'toolbar' },
    search,
    el('label', { class: 'toolbar__sort-label' }, el('span', { text: 'מיון:' }), sort),
  );

  return {
    element,
    focusSearch() {
      search.focus();
      search.select();
    },
    clearSearch() {
      search.value = '';
      emit();
      search.focus();
    },
  };
}
