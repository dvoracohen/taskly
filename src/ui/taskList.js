import { formatDueDate, isOverdue } from '../lib/dates.js';
import { el, srOnly } from './dom.js';

const PRIORITY_LABEL = { high: 'עדיפות גבוהה', medium: 'עדיפות בינונית', low: 'עדיפות נמוכה' };

const EMPTY = {
  today: { text: 'אין משימות להיום. אפשר לנוח, או להוסיף משימה חדשה.', action: 'הוסף משימה' },
  all: { text: 'עדיין אין משימות.', action: 'הוסף משימה ראשונה' },
  done: { text: 'עוד לא הושלמו משימות.' },
};

function taskRow(task, today, { onToggle, onOpen }) {
  const done = task.status === 'done';
  const overdue = isOverdue(task, today);
  const classes = [
    'task',
    done && 'task--done',
    overdue && 'task--overdue',
    task.pending && 'task--pending',
  ];

  const due = task.due_date
    ? el(
        'span',
        { class: 'task__due' },
        overdue ? 'באיחור · ' : '',
        formatDueDate(task.due_date, today),
      )
    : null;

  return el(
    'li',
    { class: classes.filter(Boolean).join(' ') },
    el('input', {
      class: 'task__check',
      type: 'checkbox',
      checked: done,
      disabled: task.pending,
      'aria-label': `סמן כהושלמה: ${task.title}`,
      dataset: { focusKey: `check-${task.id}` },
      onChange: () => onToggle(task),
    }),
    el(
      'button',
      {
        class: 'task__main',
        type: 'button',
        disabled: task.pending,
        dataset: { focusKey: `open-${task.id}` },
        onClick: () => onOpen(task.id),
      },
      el('span', { class: 'task__title', text: task.title }),
      el(
        'span',
        { class: 'task__meta' },
        el('span', {
          class: `priority priority--${task.priority}`,
          title: PRIORITY_LABEL[task.priority],
          'aria-hidden': 'true',
        }),
        srOnly(PRIORITY_LABEL[task.priority] ?? ''),
        task.status === 'in_progress' ? el('span', { class: 'chip', text: 'בתהליך' }) : null,
        due,
      ),
    ),
  );
}

function skeleton() {
  return el(
    'div',
    {},
    srOnly('טוען משימות…'),
    el(
      'ul',
      { class: 'task-list', 'aria-hidden': 'true' },
      [1, 2, 3].map(() => el('li', { class: 'skeleton' })),
    ),
  );
}

/** Builds the list area for a view: skeleton, load error, empty state or task rows. */
export function renderTaskList({ view, tasks, loading, loadError, today }, handlers) {
  if (loading) return skeleton();

  if (loadError) {
    return el(
      'div',
      { class: 'state state--error' },
      el('p', { text: 'אירעה שגיאה בטעינת המשימות.' }),
      el('button', { class: 'button', type: 'button', text: 'נסה שוב', onClick: handlers.onRetry }),
    );
  }

  if (tasks.length === 0) {
    const empty = EMPTY[view];
    return el(
      'div',
      { class: 'state' },
      el('p', { text: empty.text }),
      empty.action
        ? el('button', {
            class: 'button',
            type: 'button',
            text: empty.action,
            onClick: handlers.onFocusAdd,
          })
        : null,
    );
  }

  return el(
    'ul',
    { class: 'task-list' },
    tasks.map((task) => taskRow(task, today, handlers)),
  );
}
