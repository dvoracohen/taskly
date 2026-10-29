import './styles/main.css';
import { listTasks } from './api/tasks.js';

const app = document.querySelector('#app');

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function renderMessage(container, className, text) {
  container.replaceChildren(el('p', className, text));
}

async function render() {
  const heading = el('h1', 'app-title', 'Taskly');
  const content = el('section', 'task-section');
  content.setAttribute('aria-live', 'polite');
  app.replaceChildren(heading, content);

  renderMessage(content, 'status', 'טוען משימות…');

  try {
    const tasks = await listTasks();

    if (tasks.length === 0) {
      renderMessage(content, 'status', 'אין משימות עדיין');
      return;
    }

    const list = el('ul', 'task-list');
    for (const task of tasks) {
      list.append(el('li', 'task-item', task.title));
    }
    content.replaceChildren(list);
  } catch (err) {
    console.error('Failed to load tasks:', err);
    renderMessage(content, 'status status--error', 'אירעה שגיאה בטעינת המשימות. נסו לרענן את הדף.');
  }
}

render();
