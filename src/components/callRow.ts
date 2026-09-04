import type { WidgetInteractive } from '../types';

/** m:ss for a finished call, mm:ss (padded) for the live in-call timer. */
export const formatCallDuration = (seconds: number, pad = false): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${pad ? String(m).padStart(2, '0') : m}:${String(s).padStart(2, '0')}`;
};

/** What a call bubble says under "Voice call", WhatsApp-style: ongoing while
 *  the call is live, the length once answered, otherwise who missed it. */
export const describeCall = (
  it: WidgetInteractive,
): { detail: string; missed: boolean } => {
  if (!it.ended) return { detail: 'Ongoing', missed: false };
  if (it.duration && it.duration > 0)
    return { detail: formatCallDuration(it.duration), missed: false };
  return {
    detail: it.direction === 'BUSINESS_INITIATED' ? 'Missed' : 'No answer',
    missed: true,
  };
};
