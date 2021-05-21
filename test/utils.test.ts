/// <reference path="../node_modules/@types/jest/index.d.ts" />

import path from 'path';
import { random, bytesToSize, delay, find } from '../src/preload/utils';

test('random', () => {
  expect([0, 1, 2, 3, 4, 5].includes(random(0, 5))).toBeTruthy();
  expect([1, 2, 3].includes(random([1, 2, 3]))).toBeTruthy();
  expect(random([1, 2, 3], 1)).toHaveLength(1);
  expect(random([1, 2, 3], 2)).toHaveLength(2);
  expect('abcdef'.includes(random('abcdef'))).toBeTruthy();
  expect('abcdef'.includes(random('abcdef', 1))).toBeTruthy();
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

test('find', async () => {
  expect(await find(path.join(process.cwd(), 'src'), /\.ts$/)).toHaveLength(4);
  expect(await find(path.join(process.cwd(), 'src'), /\.vue$/)).toHaveLength(2);
  expect(await find(path.join(process.cwd(), 'src'), /\.stylus$/)).toHaveLength(2);
  expect(await find(path.join(process.cwd(), 'src'), /\.(ts|vue)$/, /app.vue$/)).toHaveLength(5);
  expect(await find(path.join(process.cwd(), 'src/main.ts'), /\.(ts|vue)$/, /app.vue$/)).toHaveLength(1);
  expect(await find(path.join(process.cwd(), 'src/xxxmain.ts'), /\.(ts|vue)$/, /app.vue$/)).toHaveLength(0);
});
