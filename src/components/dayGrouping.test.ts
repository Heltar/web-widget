import { describe, it } from 'node:test';
import assert from 'node:assert';

import { buildChatRows, formatBubbleTime } from './dayGrouping';
import type { WidgetMessage } from '../types';

const mkMsg = (id: string, iso: string, body = 'x'): WidgetMessage => ({
  id,
  timestamp: iso,
  direction: 'in',
  body,
});

describe('buildChatRows', () => {
  it('emits one day separator per distinct calendar day', () => {
    const now = new Date('2026-05-15T12:00:00Z');
    const messages = [
      mkMsg('a', '2026-05-13T09:00:00Z'),
      mkMsg('b', '2026-05-13T09:30:00Z'),
      mkMsg('c', '2026-05-14T08:00:00Z'),
      mkMsg('d', '2026-05-15T10:00:00Z'),
    ];
    const rows = buildChatRows(messages, now);
    const days = rows.filter(r => r.kind === 'day');
    assert.strictEqual(days.length, 3);
  });

  it('labels today / yesterday correctly', () => {
    const now = new Date('2026-05-15T12:00:00Z');
    const messages = [
      mkMsg('a', '2026-05-13T09:00:00Z'),
      mkMsg('b', '2026-05-14T08:00:00Z'),
      mkMsg('c', '2026-05-15T10:00:00Z'),
    ];
    const rows = buildChatRows(messages, now);
    const days = rows.filter(r => r.kind === 'day') as Array<{
      kind: 'day';
      label: string;
    }>;
    assert.strictEqual(days[0].label, '13 May 2026');
    assert.strictEqual(days[1].label, 'Yesterday');
    assert.strictEqual(days[2].label, 'Today');
  });

  it('skips invalid timestamps without crashing', () => {
    const now = new Date('2026-05-15T12:00:00Z');
    const messages = [
      mkMsg('a', 'not-a-date'),
      mkMsg('b', '2026-05-15T10:00:00Z'),
    ];
    const rows = buildChatRows(messages, now);
    // 1 day separator + 1 message row
    assert.strictEqual(rows.length, 2);
    assert.strictEqual(rows[0].kind, 'day');
    assert.strictEqual(rows[1].kind, 'msg');
  });

  it('returns empty array on empty input', () => {
    assert.deepStrictEqual(buildChatRows([]), []);
  });
});

describe('formatBubbleTime', () => {
  it('formats hh:mm in 24-hour', () => {
    // Use a UTC midnight + offset that's the same in every TZ where this
    // test could realistically run. We can't control TZ without env mucking,
    // so just assert the shape.
    const out = formatBubbleTime('2026-05-15T14:23:00Z');
    assert.match(out, /^\d{2}:\d{2}$/);
  });

  it('returns empty string for an invalid timestamp', () => {
    assert.strictEqual(formatBubbleTime('garbage'), '');
  });
});
