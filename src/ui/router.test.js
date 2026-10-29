import { describe, expect, it } from 'vitest';
import { parseHash, routeHash } from './router.js';

describe('parseHash', () => {
  it('parses the fixed views', () => {
    expect(parseHash('#/today')).toEqual({ view: 'today' });
    expect(parseHash('#/all')).toEqual({ view: 'all' });
    expect(parseHash('#/done')).toEqual({ view: 'done' });
  });

  it('parses category routes, with none meaning uncategorized', () => {
    const id = '5b7d4edb-2b48-4b7a-93fe-5bb305783d42';
    expect(parseHash(`#/category/${id}`)).toEqual({ view: 'category', categoryId: id });
    expect(parseHash('#/category/none')).toEqual({ view: 'category', categoryId: null });
  });

  it('rejects empty and unknown hashes', () => {
    for (const hash of ['', '#', '#/', '#/bogus', '#/category/', '#/category/a/b']) {
      expect(parseHash(hash)).toBeNull();
    }
  });

  it('round-trips with routeHash', () => {
    for (const hash of ['#/today', '#/done', '#/category/none', '#/category/abc-123']) {
      expect(routeHash(parseHash(hash))).toBe(hash);
    }
  });
});
