import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { sendMessage } from './api';

const args = {
  apiHost: 'https://api.test',
  businessId: 1,
  visitorId: 'v1',
  visitorHash: undefined,
  text: 'hi',
};
const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('sendMessage', () => {
  it('retries once after a 429 so a per-second cap never surfaces to the visitor', async () => {
    const statuses = [429, 200];
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(null, { status: statuses.shift() });
    }) as typeof fetch;
    await sendMessage({ ...args, retryDelayMs: 0 });
    assert.strictEqual(calls, 2);
  });

  it('gives up after the retry so a real flood still fails loudly', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(null, { status: 429 });
    }) as typeof fetch;
    await assert.rejects(sendMessage({ ...args, retryDelayMs: 0 }), /429/);
    assert.strictEqual(calls, 2);
  });

  it('does not retry other failures', async () => {
    let calls = 0;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(null, { status: 500 });
    }) as typeof fetch;
    await assert.rejects(sendMessage({ ...args, retryDelayMs: 0 }), /500/);
    assert.strictEqual(calls, 1);
  });
});
