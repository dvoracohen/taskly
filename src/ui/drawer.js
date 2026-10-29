import { el } from './dom.js';

const STATUS_OPTIONS = [
  ['todo', 'לביצוע'],
  ['in_progress', 'בתהליך'],
  ['done', 'הושלמה'],
];
const PRIORITY_OPTIONS = [
  ['low', 'נמוכה'],
  ['medium', 'בינונית'],
  ['high', 'גבוהה'],
];

const options = (pairs) => pairs.map(([value, label]) => el('option', { value, text: label }));

function field(label, control) {
  return el(
    'label',
    { class: 'field' },
    el('span', { class: 'field__label', text: label }),
    control,
  );
}

/**
 * Edit drawer built on <dialog> (Esc closes, focus is trapped).
 * onSave(id, patch) receives only the changed fields; onDelete(id) runs after confirmation;
 * onClose(id) runs whenever the drawer closes, so the caller can restore focus.
 */
export function createDrawer({ onSave, onDelete, onClose }) {
  let task = null;

  const title = el('input', { type: 'text', name: 'title', maxlength: 200 });
  const titleError = el('p', { class: 'field__error', text: 'יש להזין כותרת', hidden: true });
  const description = el('textarea', { name: 'description', maxlength: 2000, rows: 5 });
  const dueDate = el('input', { type: 'date', name: 'due_date' });
  const clearDate = el('button', {
    class: 'button button--ghost',
    type: 'button',
    text: 'ניקוי',
    'aria-label': 'ניקוי תאריך יעד',
    onClick: () => {
      dueDate.value = '';
      dueDate.focus();
    },
  });
  const priority = el('select', { name: 'priority' }, options(PRIORITY_OPTIONS));
  const status = el('select', { name: 'status' }, options(STATUS_OPTIONS));

  const dialog = el('dialog', { class: 'drawer', 'aria-labelledby': 'drawer-title' });

  const form = el(
    'form',
    { class: 'drawer__form', novalidate: true, onSubmit: save },
    el(
      'header',
      { class: 'drawer__header' },
      el('h2', { id: 'drawer-title', text: 'עריכת משימה' }),
      el('button', {
        class: 'button button--ghost drawer__close',
        type: 'button',
        text: '✕',
        'aria-label': 'סגירה',
        onClick: () => dialog.close(),
      }),
    ),
    field('כותרת', title),
    titleError,
    field('תיאור', description),
    el(
      'div',
      { class: 'field' },
      el('label', { class: 'field__label', for: 'drawer-due', text: 'תאריך יעד' }),
      el('div', { class: 'field__row' }, dueDate, clearDate),
    ),
    el('div', { class: 'field-pair' }, field('עדיפות', priority), field('סטטוס', status)),
    el(
      'footer',
      { class: 'drawer__footer' },
      el('button', { class: 'button button--primary', type: 'submit', text: 'שמירה' }),
      el('button', {
        class: 'button',
        type: 'button',
        text: 'ביטול',
        onClick: () => dialog.close(),
      }),
      el('button', {
        class: 'button button--danger',
        type: 'button',
        text: 'מחיקה',
        onClick: remove,
      }),
    ),
  );
  dueDate.id = 'drawer-due';
  dialog.append(form);

  title.addEventListener('input', () => {
    titleError.hidden = true;
    title.removeAttribute('aria-invalid');
  });
  dialog.addEventListener('close', () => {
    const id = task?.id;
    task = null;
    onClose?.(id);
  });
  // Clicking the backdrop (outside the panel) closes the drawer.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  function save(event) {
    event.preventDefault();
    const newTitle = title.value.trim();
    if (!newTitle) {
      titleError.hidden = false;
      title.setAttribute('aria-invalid', 'true');
      title.focus();
      return;
    }

    const next = {
      title: newTitle,
      description: description.value.trim() || null,
      due_date: dueDate.value || null,
      priority: priority.value,
      status: status.value,
    };
    const patch = Object.fromEntries(
      Object.entries(next).filter(([key, value]) => value !== (task[key] ?? null)),
    );

    const id = task.id;
    dialog.close();
    if (Object.keys(patch).length > 0) onSave(id, patch);
  }

  function remove() {
    if (!confirm('למחוק את המשימה?')) return;
    const id = task.id;
    dialog.close();
    onDelete(id);
  }

  function open(target) {
    task = target;
    title.value = target.title;
    description.value = target.description ?? '';
    dueDate.value = target.due_date ?? '';
    priority.value = target.priority;
    status.value = target.status;
    titleError.hidden = true;
    title.removeAttribute('aria-invalid');
    dialog.showModal();
    title.focus();
  }

  return { element: dialog, open };
}
