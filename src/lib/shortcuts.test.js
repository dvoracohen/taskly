import { describe, expect, it } from 'vitest';
import { matchShortcut } from './shortcuts.js';

const body = { tagName: 'BODY' };
const press = (key, extra = {}) => matchShortcut({ key, target: body, ...extra });

describe('matchShortcut', () => {
  it('n / מ focus the new-task field', () => {
    expect(press('n')).toBe('new');
    expect(press('N', { shiftKey: true })).toBe('new');
    expect(press('מ')).toBe('new');
  });

  it('/ and . (Hebrew layout) focus search', () => {
    expect(press('/')).toBe('search');
    expect(press('.')).toBe('search');
  });

  it('Ctrl/Cmd+Z undoes, including on a Hebrew layout', () => {
    expect(press('z', { ctrlKey: true })).toBe('undo');
    expect(press('z', { metaKey: true })).toBe('undo');
    expect(press('ז', { ctrlKey: true })).toBe('undo');
    expect(press('z', { ctrlKey: true, altKey: true })).toBeNull();
  });

  it('ignores other keys and modified shortcut keys', () => {
    expect(press('x')).toBeNull();
    expect(press('z')).toBeNull();
    expect(press('n', { ctrlKey: true })).toBeNull();
    expect(press('/', { altKey: true })).toBeNull();
  });

  it('does nothing while typing in a field', () => {
    for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) {
      expect(matchShortcut({ key: 'n', target: { tagName } })).toBeNull();
      expect(matchShortcut({ key: 'z', ctrlKey: true, target: { tagName } })).toBeNull();
    }
    expect(
      matchShortcut({ key: '/', target: { tagName: 'DIV', isContentEditable: true } }),
    ).toBeNull();
  });
});
