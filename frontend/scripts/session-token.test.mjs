import test from 'node:test';
import assert from 'node:assert/strict';
import { encode } from 'next-auth/jwt';
import { readSessionToken } from '../src/lib/session-token.mjs';
const secret = 'regression-test-secret-not-for-deployment';
for (const secure of [false, true]) {
  for (const chunked of [false, true]) {
    test(`reads ${secure ? 'HTTPS' : 'HTTP'} session, chunked=${chunked}`, async () => {
      const name = `${secure ? '__Secure-' : ''}authjs.session-token`;
      const token = await encode({ secret, salt: name, token: { accessToken: 'backend-token' } });
      const cookie = chunked ? `${name}.0=${token.slice(0, 60)}; ${name}.1=${token.slice(60)}` : `${name}=${token}`;
      const decoded = await readSessionToken(new Request('https://example.com', { headers: { cookie } }), secret);
      assert.equal(decoded.accessToken, 'backend-token');
    });
  }
}
test('missing and tampered cookies are rejected', async () => {
  assert.equal(await readSessionToken(new Request('https://example.com'), secret), null);
  assert.equal(await readSessionToken(new Request('https://example.com', { headers: { cookie: '__Secure-authjs.session-token=invalid' } }), secret), null);
});
