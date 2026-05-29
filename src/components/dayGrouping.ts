import { DAY_LABELS } from '../constants';
import type { WidgetMessage } from '../types';

/**
 * Group an ASC-ordered list of messages into day buckets and render-ready
 * row entries (either `'day'` separators or `'msg'`). Computed once per
 * messages change in the parent (signal memo) so the render loop is
 * dumb / cheap.
 */
export type ChatRow =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'msg'; key: string; message: WidgetMessage };

export const buildChatRows = (
  messages: WidgetMessage[],
  now: Date = new Date(),
): ChatRow[] => {
  const rows: ChatRow[] = [];
  let lastDayKey: string | null = null;
  for (const m of messages) {
    const d = new Date(m.timestamp);
    if (Number.isNaN(d.getTime())) continue;
    const dayKey = dayKeyOf(d);
    if (dayKey !== lastDayKey) {
      rows.push({
        kind: 'day',
        key: `day-${dayKey}`,
        label: formatDayLabel(d, now),
      });
      lastDayKey = dayKey;
    }
    rows.push({ kind: 'msg', key: m.id, message: m });
  }
  return rows;
};

const dayKeyOf = (d: Date): string =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

const formatDayLabel = (d: Date, now: Date): string => {
  if (sameDay(d, now)) return DAY_LABELS.today;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return DAY_LABELS.yesterday;
  // For older messages, render `15 Mar 2026` style. Using toLocaleDateString
  // would honour the user's locale but make tests flaky and look inconsistent
  // across the inbox UI, which uses a fixed format — keep this matching.
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const sameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** `09:42` 24-hour timestamp shown on every bubble. */
export const formatBubbleTime = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};
