import test from 'node:test';
import assert from 'node:assert/strict';
import { backendBaseUrl, backendRequest } from '../src/lib/backend-http.mjs';

test('normalizes origins and permits local development', () => {
  assert.equal(backendBaseUrl({ BACKEND_URL: ' https://api.example.com/// ' }), 'https://api.example.com');
  assert.equal(backendBaseUrl({ BACKEND_URL: 'http://127.0.0.1:8001' }), 'http://127.0.0.1:8001');
});
test('rejects missing and malformed API configuration', () => {
  for (const BACKEND_URL of [undefined, '', 'api.example.com', 'ftp://api.example.com',
    'https://api.example.com/api', 'https://user:secret@api.example.com', 'https://api.example.com?x=1']) {
    assert.throws(() => backendBaseUrl({ BACKEND_URL }), /BACKEND_URL/);
  }
});
test('hosted deployments cannot silently target their own localhost', () => {
  for (const host of ['localhost', '127.0.0.1', '[::1]', '0.0.0.0']) {
    for (const platform of [{ VERCEL: '1' }, { RENDER: 'true' }]) {
      assert.throws(() => backendBaseUrl({ ...platform, BACKEND_URL: `http://${host}:8001` }), /localhost/);
    }
  }
});
test('requests preserve POST body, avoid caching, and never retry mutations', async (t) => {
  const previous = process.env.BACKEND_URL;
  process.env.BACKEND_URL = 'https://api.example.com/';
  t.after(() => { if (previous === undefined) delete process.env.BACKEND_URL; else process.env.BACKEND_URL = previous; });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (...args) => {
    calls.push(args);
    throw new Error('connection lost after submission');
  });
  const controller = new AbortController();
  await assert.rejects(backendRequest('/api/auth/register', {
    method: 'POST', body: '{"email":"test@example.com"}', signal: controller.signal,
  }), /connection lost/);
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://api.example.com/api/auth/register');
  assert.equal(calls[0][1].method, 'POST');
  assert.equal(calls[0][1].body, '{"email":"test@example.com"}');
  assert.equal(calls[0][1].cache, 'no-store');
  controller.abort();
  assert.equal(calls[0][1].signal.aborted, true);
});

test('hosted backend traffic must use HTTPS', () => {
  assert.throws(() => backendBaseUrl({ VERCEL: '1', BACKEND_URL: 'http://api.example.com' }), /HTTPS/);
  assert.equal(backendBaseUrl({ VERCEL: '1', BACKEND_URL: 'https://sitesignal-lyl1.onrender.com' }), 'https://sitesignal-lyl1.onrender.com');
});
