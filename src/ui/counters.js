import { countCompletedToday, countOpen, countOverdue } from '../lib/counters.js';
import { el } from './dom.js';

/** Header counters: open · overdue · completed today. */
export function createCounters() {
  const open = el('strong');
  const overdue = el('strong');
  const completed = el('strong');

  const element = el(
    'dl',
    { class: 'counters', 'aria-label': 'סיכום משימות' },
    el('div', { class: 'counter' }, el('dt', { text: 'פתוחות' }), el('dd', {}, open)),
    el(
      'div',
      { class: 'counter counter--overdue' },
      el('dt', { text: 'באיחור' }),
      el('dd', {}, overdue),
    ),
    el('div', { class: 'counter' }, el('dt', { text: 'הושלמו היום' }), el('dd', {}, completed)),
  );

  function update(tasks, today) {
    open.textContent = countOpen(tasks);
    const late = countOverdue(tasks, today);
    overdue.textContent = late;
    element.classList.toggle('counters--has-overdue', late > 0);
    completed.textContent = countCompletedToday(tasks, today);
  }

  return { element, update };
}
