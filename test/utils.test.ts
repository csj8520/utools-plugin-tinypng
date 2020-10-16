/// <reference path="../node_modules/@types/jest/index.d.ts" />

import { random, bytesToSize, delay } from '../src/preload/utils';

test('random', () => {
  expect(typeof random(0, 5)).toBe('number');
  expect(typeof random([1, 2, 3])).toBe('number');
  expect(random([1, 2, 3], 1)).toHaveLength(1);
  expect(random([1, 2, 3], 2)).toHaveLength(2);
  expect(random('abcdef')).toHaveLength(1);
  expect(random('abcdef', 1)).toHaveLength(1);
  expect(random('abcdef', 2)).toHaveLength(2);
});

test('bytesToSize', () => {
  expect(bytesToSize(100)).toBe('100.00B');
  expect(bytesToSize(1024 + 1024 * 0.22)).toBe('1.22KB');
  expect(bytesToSize(123 * 1024)).toBe('123.00KB');
  expect(bytesToSize(123 * 1024 * 1024)).toBe('123.00MB');
  expect(bytesToSize(123 * 1024 * 1024 * 1024)).toBe('123.00GB');
  expect(bytesToSize(123 * 1024 * 1024 * 1024 * 1024)).toBe('123.00TB');
  expect(bytesToSize(123 * 1024 * 1024 * 1024 * 1024 * 1024)).toBe('123.00PB');
  expect(bytesToSize(123 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024)).toBe('123.00EB');
  expect(bytesToSize(123 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024)).toBe('123.00ZB');
  expect(bytesToSize(123 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024 * 1024)).toBe('123.00YB');
});

test('delay', () => {
  expect(delay(1) instanceof Promise).toBeTruthy();
});
