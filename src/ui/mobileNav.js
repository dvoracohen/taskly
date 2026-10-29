// Below 1024px the sidebar is an off-canvas panel behind a menu button. While it is open the
// rest of the page is inert; Esc, the backdrop, navigating, or widening the window closes it,
// and focus returns to the button.
import { el } from './dom.js';

const desktop = window.matchMedia('(min-width: 1024px)');

/**
 * `sidebar` is the sidebar element; `background` lists the elements to make inert;
 * `content` (focusable) receives focus after a link in the menu is chosen.
 */
export function createMobileNav({ sidebar, background, content }) {
  sidebar.id = 'sidebar';

  const button = el(
    'button',
    {
      class: 'icon-button menu-button',
      type: 'button',
      'aria-label': 'תפריט',
      'aria-controls': 'sidebar',
      'aria-expanded': 'false',
      onClick: () => (isOpen() ? close() : open()),
    },
    el('span', { class: 'icon-button__glyph', 'aria-hidden': 'true', text: '☰' }),
  );
  const backdrop = el('div', { class: 'sidebar-backdrop', hidden: true, onClick: () => close() });

  const isOpen = () => sidebar.classList.contains('sidebar--open');

  function open() {
    sidebar.classList.add('sidebar--open');
    backdrop.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    for (const node of background) node.inert = true;
    document.body.style.overflow = 'hidden';
    sidebar.querySelector('a, button')?.focus();
  }

  function close({ restoreFocus = true } = {}) {
    if (!isOpen()) return;
    sidebar.classList.remove('sidebar--open');
    backdrop.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    for (const node of background) node.inert = false;
    document.body.style.overflow = '';
    if (restoreFocus && !desktop.matches) button.focus();
  }

  sidebar.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) {
      event.preventDefault();
      close();
    }
  });
  // Choosing a view or category closes the menu — also when it is the view already shown,
  // which fires no hashchange. Focus then goes to the content.
  sidebar.addEventListener('click', (event) => {
    if (!event.target.closest('a') || !isOpen()) return;
    close({ restoreFocus: false });
    content.focus();
  });
  window.addEventListener('hashchange', () => close({ restoreFocus: false }));
  desktop.addEventListener('change', () => close({ restoreFocus: false }));

  return { button, backdrop, close };
}
