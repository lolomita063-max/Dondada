import { describe, it, expect } from 'vitest';
import { getPaginationParams, buildPaginationMeta } from '../src/utils/pagination.js';

describe('getPaginationParams', () => {
  it('returns default values when no params given', () => {
    const result = getPaginationParams(undefined, undefined);
    expect(result).toEqual({ page: 1, limit: 20 });
  });

  it('uses provided page and limit', () => {
    const result = getPaginationParams(3, 10);
    expect(result).toEqual({ page: 3, limit: 10 });
  });

  it('ensures page is at least 1', () => {
    const result = getPaginationParams(0, 20);
    expect(result.page).toBe(1);
  });

  it('ensures limit is at least 1', () => {
    const result = getPaginationParams(1, 0);
    expect(result.limit).toBe(1);
  });

  it('caps limit at 100', () => {
    const result = getPaginationParams(1, 500);
    expect(result.limit).toBe(100);
  });

  it('parses string numbers', () => {
    const result = getPaginationParams('2', '15');
    expect(result).toEqual({ page: 2, limit: 15 });
  });

  it('handles NaN gracefully', () => {
    const result = getPaginationParams('abc', 'xyz');
    expect(result).toEqual({ page: 1, limit: 20 });
  });
});

describe('buildPaginationMeta', () => {
  it('builds correct metadata', () => {
    const params = { page: 2, limit: 10 };
    const meta = buildPaginationMeta(50, params);
    expect(meta).toEqual({
      page: 2,
      limit: 10,
      total: 50,
      totalPages: 5,
    });
  });

  it('handles partial last page', () => {
    const params = { page: 2, limit: 10 };
    const meta = buildPaginationMeta(25, params);
    expect(meta.totalPages).toBe(3);
  });

  it('handles empty results', () => {
    const params = { page: 1, limit: 20 };
    const meta = buildPaginationMeta(0, params);
    expect(meta.totalPages).toBe(0);
  });

  it('handles single page', () => {
    const params = { page: 1, limit: 20 };
    const meta = buildPaginationMeta(15, params);
    expect(meta.totalPages).toBe(1);
  });
});