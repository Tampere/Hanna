import { expect, test } from 'vitest';

import { arrayChunks } from './utils';

test('arrayChunks with empty array', () => {
  const result = arrayChunks([], 2);
  expect(result).toEqual([]);
});

test('arrayChunks with array length less than chunk size', () => {
  const result = arrayChunks([1, 2], 3);
  expect(result).toEqual([[1, 2]]);
});

test('arrayChunks with array length equal to chunk size', () => {
  const result = arrayChunks([1, 2, 3], 3);
  expect(result).toEqual([[1, 2, 3]]);
});

test('arrayChunks with array length greater than chunk size', () => {
  const result = arrayChunks([1, 2, 3, 4, 5], 2);
  expect(result).toEqual([[1, 2], [3, 4], [5]]);
});

test('arrayChunks with array length not divisible by chunk size', () => {
  const result = arrayChunks([1, 2, 3, 4, 5, 6], 4);
  expect(result).toEqual([
    [1, 2, 3, 4],
    [5, 6],
  ]);
});

test('arrayChunks with chunk size of 1', () => {
  const result = arrayChunks([1, 2, 3], 1);
  expect(result).toEqual([[1], [2], [3]]);
});

test('arrayChunks with chunk size of 0', () => {
  expect(() => arrayChunks([1, 2, 3], 0)).toThrow();
});
