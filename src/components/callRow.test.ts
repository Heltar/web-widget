import { describe, it } from 'node:test';
import assert from 'node:assert';

import { describeCall, formatCallDuration } from './callRow';

describe('describeCall', () => {
  it('reads Ongoing until the call terminates', () => {
    assert.deepStrictEqual(
      describeCall({ type: 'call', direction: 'USER_INITIATED', ended: false }),
      { detail: 'Ongoing', missed: false },
    );
  });

  it('shows the length of an answered call as m:ss', () => {
    assert.deepStrictEqual(
      describeCall({
        type: 'call',
        direction: 'USER_INITIATED',
        ended: true,
        duration: 75,
      }),
      { detail: '1:15', missed: false },
    );
    assert.strictEqual(formatCallDuration(5), '0:05');
  });

  it("an unanswered visitor call is 'No answer', a business one 'Missed'", () => {
    assert.deepStrictEqual(
      describeCall({
        type: 'call',
        direction: 'USER_INITIATED',
        ended: true,
        duration: null,
      }),
      { detail: 'No answer', missed: true },
    );
    assert.deepStrictEqual(
      describeCall({
        type: 'call',
        direction: 'BUSINESS_INITIATED',
        ended: true,
        duration: 0,
      }),
      { detail: 'Missed', missed: true },
    );
  });
});

describe('formatCallDuration', () => {
  it('pads the minutes only for the live in-call timer', () => {
    assert.strictEqual(formatCallDuration(65), '1:05');
    assert.strictEqual(formatCallDuration(65, true), '01:05');
    assert.strictEqual(formatCallDuration(0, true), '00:00');
    assert.strictEqual(formatCallDuration(3605, true), '60:05');
  });
});
