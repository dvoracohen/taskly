import { colorDot, el } from './dom.js';

export const DEFAULT_COLOR = '#6B7280';

const PRESETS = [
  ['#6B7280', 'אפור'],
  ['#EF4444', 'אדום'],
  ['#F97316', 'כתום'],
  ['#EAB308', 'צהוב'],
  ['#22C55E', 'ירוק'],
  ['#3B82F6', 'כחול'],
  ['#8B5CF6', 'סגול'],
  ['#EC4899', 'ורוד'],
];

const sameColor = (a, b) => (a ?? '').toLowerCase() === (b ?? '').toLowerCase();

/**
 * Modal for creating / editing a category: name, color (picker + presets), delete.
 * - getCategories() is used for an instant duplicate-name check.
 * - onCreate(name, color), onUpdate(id, patch), onDelete(id).
 */
export function createCategoryDialog({ getCategories, onCreate, onUpdate, onDelete }) {
  let editing = null; // category being edited, or null when creating
  let returnFocus = null;

  const heading = el('h2', { id: 'category-dialog-title' });
  const name = el('input', { type: 'text', name: 'name', maxlength: 50, autocomplete: 'off' });
  const nameError = el('p', { class: 'field__error', hidden: true });
  const color = el('input', { type: 'color', name: 'color', 'aria-label': 'בחירת צבע חופשית' });
  const swatches = PRESETS.map(([value, label]) =>
    el(
      'label',
      { class: 'swatch', title: label },
      el('input', {
        type: 'radio',
        name: 'preset',
        value,
        'aria-label': label,
        onChange: () => (color.value = value.toLowerCase()),
      }),
      colorDot(value, 'swatch__chip'),
    ),
  );
  const deleteButton = el('button', {
    class: 'button button--danger',
    type: 'button',
    text: 'מחיקה',
    onClick: remove,
  });

  const dialog = el('dialog', { class: 'modal', 'aria-labelledby': 'category-dialog-title' });
  dialog.append(
    el(
      'form',
      { class: 'modal__form', novalidate: true, onSubmit: save },
      heading,
      el('label', { class: 'field' }, el('span', { class: 'field__label', text: 'שם' }), name),
      nameError,
      el(
        'fieldset',
        { class: 'field colors' },
        el('legend', { class: 'field__label', text: 'צבע' }),
        el('div', { class: 'colors__row' }, swatches, color),
      ),
      el(
        'footer',
        { class: 'modal__footer' },
        el('button', { class: 'button button--primary', type: 'submit', text: 'שמירה' }),
        el('button', {
          class: 'button',
          type: 'button',
          text: 'ביטול',
          onClick: () => dialog.close(),
        }),
        deleteButton,
      ),
    ),
  );

  // Keep the preset radios in sync with the free color picker.
  color.addEventListener('input', syncPresets);
  name.addEventListener('input', () => showError(null));
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => {
    editing = null;
    // The opener may have been re-rendered meanwhile; find its replacement by focus key.
    const key = returnFocus?.dataset?.focusKey;
    const target = returnFocus?.isConnected
      ? returnFocus
      : key && document.querySelector(`[data-focus-key="${CSS.escape(key)}"]`);
    target?.focus();
  });

  function syncPresets() {
    for (const swatch of swatches) {
      const radio = swatch.querySelector('input');
      radio.checked = sameColor(radio.value, color.value);
    }
  }

  function showError(message) {
    nameError.hidden = !message;
    nameError.textContent = message ?? '';
    if (message) name.setAttribute('aria-invalid', 'true');
    else name.removeAttribute('aria-invalid');
  }

  function save(event) {
    event.preventDefault();
    const newName = name.value.trim();
    if (!newName) {
      showError('יש להזין שם');
      name.focus();
      return;
    }
    const duplicate = getCategories().some(
      (c) => c.id !== editing?.id && c.name.toLocaleLowerCase() === newName.toLocaleLowerCase(),
    );
    if (duplicate) {
      showError('כבר קיימת קטגוריה בשם הזה');
      name.focus();
      return;
    }

    const newColor = color.value.toUpperCase();
    if (!editing) {
      dialog.close();
      onCreate(newName, newColor);
      return;
    }

    const patch = {};
    if (newName !== editing.name) patch.name = newName;
    if (!sameColor(newColor, editing.color)) patch.color = newColor;
    const id = editing.id;
    dialog.close();
    if (Object.keys(patch).length > 0) onUpdate(id, patch);
  }

  function remove() {
    if (!confirm("למחוק את הקטגוריה? המשימות שלה יישארו ויעברו ל'ללא קטגוריה'.")) return;
    const id = editing.id;
    dialog.close();
    onDelete(id);
  }

  /** Opens for a new category (no argument) or to edit `category`. */
  function open(category = null) {
    editing = category;
    returnFocus = document.activeElement;
    heading.textContent = category ? 'עריכת קטגוריה' : 'קטגוריה חדשה';
    name.value = category?.name ?? '';
    color.value = (category?.color ?? DEFAULT_COLOR).toLowerCase();
    deleteButton.hidden = !category;
    showError(null);
    syncPresets();
    dialog.showModal();
    name.focus();
  }

  return { element: dialog, open };
}
