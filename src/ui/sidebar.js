import { VIEWS } from '../lib/views.js';
import { colorDot, el, srOnly } from './dom.js';
import { routeHash } from './router.js';

const isActive = (route, target) =>
  route.view === target.view &&
  (target.view !== 'category' || route.categoryId === target.categoryId);

function navLink(target, label, { color, count, current }) {
  return el(
    'a',
    {
      class: 'side-link',
      href: routeHash(target),
      'aria-current': isActive(current, target) ? 'page' : null,
      dataset: { focusKey: `nav-${routeHash(target)}` },
    },
    color !== undefined ? colorDot(color) : null,
    el('span', { class: 'side-link__label', text: label }),
    count
      ? el('span', { class: 'side-link__count' }, srOnly('משימות פתוחות: '), String(count))
      : null,
  );
}

/**
 * Sidebar: views, categories (dot, name, open count, edit button), uncategorized, new category.
 * Call update({ route, categories, openCounts }) on every render.
 */
export function createSidebar({ onNewCategory, onEditCategory }) {
  const viewsList = el('ul', { class: 'side-list' });
  const categoryList = el('ul', { class: 'side-list' });

  const element = el(
    'aside',
    { class: 'sidebar' },
    el('nav', { 'aria-label': 'תצוגות' }, viewsList),
    el(
      'nav',
      { class: 'sidebar__categories', 'aria-labelledby': 'categories-heading' },
      el('h2', { class: 'sidebar__heading', id: 'categories-heading', text: 'קטגוריות' }),
      categoryList,
      el('button', {
        class: 'button button--ghost sidebar__new',
        type: 'button',
        text: '+ קטגוריה חדשה',
        onClick: onNewCategory,
      }),
    ),
  );

  function update({ route, categories, openCounts }) {
    viewsList.replaceChildren(
      ...Object.entries(VIEWS).map(([view, { title }]) =>
        el('li', {}, navLink({ view }, title, { current: route })),
      ),
    );

    categoryList.replaceChildren(
      ...categories.map((category) =>
        el(
          'li',
          { class: category.pending ? 'side-item side-item--pending' : 'side-item' },
          navLink({ view: 'category', categoryId: category.id }, category.name, {
            color: category.color,
            count: openCounts.get(category.id),
            current: route,
          }),
          el('button', {
            class: 'button button--ghost side-item__edit',
            type: 'button',
            text: '✎',
            disabled: category.pending,
            'aria-label': `עריכת קטגוריה ${category.name}`,
            dataset: { focusKey: `edit-category-${category.id}` },
            onClick: () => onEditCategory(category.id),
          }),
        ),
      ),
      el(
        'li',
        { class: 'side-item' },
        navLink({ view: 'category', categoryId: null }, 'ללא קטגוריה', {
          color: 'transparent',
          count: openCounts.get(null),
          current: route,
        }),
      ),
    );
  }

  return { element, update };
}
