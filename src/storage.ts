import { STORAGE_PREFIX } from './constants';

/**
 * First-party localStorage helpers for the widget. Keys are scoped by
 * businessId so a single browser visiting two different HeltarChat-using
 * sites keeps separate identities (clean tenant boundary).
 *
 * All access is wrapped in try/catch because Safari Private mode, embedded
 * webviews and CSP-restricted contexts throw on localStorage access. The
 * widget degrades gracefully — visitorId becomes ephemeral, history won't
 * persist across reloads, but the chat still works for the current session.
 */

const visitorKey = (businessId: number): string =>
  `${STORAGE_PREFIX}:${businessId}:visitorId`;

const openStateKey = (businessId: number): string =>
  `${STORAGE_PREFIX}:${businessId}:open`;

const getVisitorId = (businessId: number): string | undefined => {
  try {
    return localStorage.getItem(visitorKey(businessId)) ?? undefined;
  } catch {
    return undefined;
  }
};

const setVisitorId = (businessId: number, id: string): void => {
  try {
    localStorage.setItem(visitorKey(businessId), id);
  } catch {
    /* private-mode etc. — ephemeral session only */
  }
};

export const getBubbleOpenState = (businessId: number): boolean => {
  try {
    return localStorage.getItem(openStateKey(businessId)) === '1';
  } catch {
    return false;
  }
};

export const setBubbleOpenState = (businessId: number, open: boolean): void => {
  try {
    if (open) localStorage.setItem(openStateKey(businessId), '1');
    else localStorage.removeItem(openStateKey(businessId));
  } catch {
    /* ignore */
  }
};

/**
 * Resolve the visitorId for this business — in priority order:
 *
 *  1. `override` (customer-provided identity via `props.visitor.id`) wins
 *     for THIS page-load. It is NOT persisted to localStorage: if the
 *     customer's snippet stops passing it on a future page-load, that
 *     visitor goes back to the device-local random id (correct security
 *     posture — the override is the customer's authoritative identity,
 *     so it must come from the customer every time).
 *  2. Persisted random id in localStorage → same device repeat visit
 *     resolves to the same conversation.
 *  3. Fresh 16-digit random id → first-time visitor; persisted for
 *     subsequent loads.
 */
export const ensureVisitorId = (
  businessId: number,
  override?: string,
): string => {
  if (override) return override;
  const existing = getVisitorId(businessId);
  if (existing) return existing;
  const fresh = generateAnonVisitorId();
  setVisitorId(businessId, fresh);
  return fresh;
};

/**
 * Anonymous visitor id: a reserved `wv_` prefix + 16 random digits. The prefix
 * marks the id as widget-generated (anonymous), so identity verification can
 * exempt it from the HMAC-signature requirement while still requiring a
 * signature for EVERY host-supplied id — a host can't accidentally land in this
 * reserved namespace (see /docs/integrations/web-widget). Unguessable:
 * ~53 bits of entropy ⇒ ~10^16 search space.
 *
 * Prefers `crypto.getRandomValues` (cryptographic PRNG). Falls back to
 * `Math.random()` only on legacy environments where Web Crypto is
 * unavailable — Safari 15.4+, all modern Chrome / Firefox / Edge have it.
 */
const generateAnonVisitorId = (): string => {
  let digits: string;
  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    let n = 0n;
    for (const b of bytes) n = (n << 8n) | BigInt(b);
    digits = n.toString().padStart(16, '0').slice(-16);
  } else {
    let s = '';
    for (let i = 0; i < 16; i++) {
      s += Math.floor(Math.random() * 10).toString();
    }
    digits = s;
  }
  return `wv_${digits}`;
};
