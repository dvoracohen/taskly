import { el } from './dom.js';

/** Quick-add form: type a title, press Enter. Empty titles are blocked with a hint. */
export function createQuickAdd({ onAdd }) {
  const hint = el('p', {
    class: 'quick-add__hint',
    id: 'quick-add-hint',
    text: 'יש להזין כותרת',
    hidden: true,
  });
  const input = el('input', {
    class: 'quick-add__input',
    type: 'text',
    maxlength: 200,
    placeholder: 'משימה חדשה… (Enter לשמירה)',
    'aria-label': 'משימה חדשה',
    'aria-describedby': 'quick-add-hint',
    autocomplete: 'off',
    onInput: () => {
      hint.hidden = true;
      input.removeAttribute('aria-invalid');
    },
  });

  const element = el(
    'form',
    {
      class: 'quick-add',
      onSubmit: (event) => {
        event.preventDefault();
        const title = input.value.trim();
        if (!title) {
          hint.hidden = false;
          input.setAttribute('aria-invalid', 'true');
          input.focus();
          return;
        }
        onAdd(title);
        input.value = '';
      },
    },
    input,
    el('button', { class: 'button button--primary', type: 'submit', text: 'הוספה' }),
    hint,
  );

  return { element, focus: () => input.focus() };
}
