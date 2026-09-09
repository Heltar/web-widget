import type { HistoryResponse, UploadResponse } from './types';

/**
 * Tiny HTTP client for the widget — no bundled fetch/ky dep, no bearer
 * tokens. The widget is a public Typebot-style embed; the only server-side
 * gate is the business's Origin allowlist. The visitor's random id (in their
 * own browser's localStorage) acts as both their identity and the implicit
 * secret.
 */

interface BaseArgs {
  apiHost: string;
  businessId: number;
}

interface VisitorArgs extends BaseArgs {
  visitorId: string;
  /** HMAC signature of `visitorId`, supplied by the host site when identity
   *  verification is enabled. Sent as the `X-Heltar-Widget-Hash` header (kept
   *  out of access logs); the backend only requires it for host-supplied
   *  (non-anonymous) ids. */
  visitorHash?: string;
}

interface HistoryArgs extends VisitorArgs {
  beforeTimestamp?: string;
  limit?: number;
}

export const loadHistory = async ({
  apiHost,
  businessId,
  visitorId,
  visitorHash,
  beforeTimestamp,
  limit,
}: HistoryArgs): Promise<HistoryResponse> => {
  const params = new URLSearchParams();
  if (beforeTimestamp) params.set('beforeTimestamp', beforeTimestamp);
  if (limit) params.set('limit', String(limit));
  const url =
    `${apiHost}/v1/webhooks/web/${businessId}/${visitorId}/history` +
    (params.toString() ? `?${params}` : '');
  const res = await fetch(url, {
    credentials: 'omit',
    headers: visitorHash ? { 'X-Heltar-Widget-Hash': visitorHash } : undefined,
  });
  if (!res.ok) {
    throw new Error(`history failed: ${res.status}`);
  }
  const json = (await res.json()) as { data: HistoryResponse };
  return json.data;
};

interface SendArgs extends VisitorArgs {
  text?: string;
  name?: string;
  media?: {
    url: string;
    mimeType: string;
    mediaType: 'image' | 'video' | 'audio' | 'document';
    filename?: string;
  };
  /** A tapped quick-reply button or selected list row — sent as a WhatsApp-
   *  style reply (kind + id + title) so chatbot flows that branch on the
   *  payload id fire exactly as they do on WhatsApp. */
  reply?: { kind: 'button' | 'list'; id: string; title: string };
  /** Per-visitor context the embedder set; forwarded so the backend can append
   *  it to the chatbot's system prompt on this reply. */
  dynamicPrompt?: string;
  /** Wait before the single retry of a 429 (the backend's per-second cap). */
  retryDelayMs?: number;
}

export const sendMessage = async ({
  apiHost,
  businessId,
  visitorId,
  visitorHash,
  text,
  name,
  media,
  reply,
  dynamicPrompt,
  retryDelayMs = 1100,
}: SendArgs): Promise<void> => {
  const body: Record<string, unknown> = { visitorId };
  if (text) body.text = text;
  if (name) body.name = name;
  if (media) body.media = media;
  if (reply) body.reply = reply;
  if (dynamicPrompt) body.dynamicPrompt = dynamicPrompt;
  const post = () =>
    fetch(`${apiHost}/v1/webhooks/web/${businessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(visitorHash && { 'X-Heltar-Widget-Hash': visitorHash }),
      },
      body: JSON.stringify(body),
      credentials: 'omit',
    });
  let res = await post();
  // The per-business cap is a one-second window, so a 429 clears by itself;
  // one retry keeps a burst from ever surfacing as a failed message.
  if (res.status === 429) {
    await new Promise(r => setTimeout(r, retryDelayMs));
    res = await post();
  }
  if (!res.ok) {
    throw new Error(`send failed: ${res.status}`);
  }
};

interface MarkReadArgs extends VisitorArgs {
  wamids: string[];
}

/** Tell the backend the visitor has actually seen these outbound messages so
 *  it flips them DELIVERED → READ and the agent's inbox shows the read
 *  receipt. Best-effort: read receipts must never disrupt the chat. */
export const markRead = async ({
  apiHost,
  businessId,
  visitorId,
  visitorHash,
  wamids,
}: MarkReadArgs): Promise<void> => {
  if (wamids.length === 0) return;
  try {
    await fetch(`${apiHost}/v1/webhooks/web/${businessId}/${visitorId}/read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(visitorHash && { 'X-Heltar-Widget-Hash': visitorHash }),
      },
      body: JSON.stringify({ wamids }),
      credentials: 'omit',
    });
  } catch {
    /* best-effort — ignore */
  }
};

/** The server's own visitor-facing refusal (rate caps…) — shown as-is. */
export class WidgetCallError extends Error {}

/** Create the room server-side; returns the join token. */
export const startWidgetCall = async ({
  apiHost,
  businessId,
  visitorId,
  visitorHash,
}: VisitorArgs): Promise<{
  roomName: string;
  token: string;
  voiceUrl: string;
}> => {
  const res = await fetch(
    `${apiHost}/v1/webhooks/web/${businessId}/${visitorId}/call`,
    {
      method: 'POST',
      headers: visitorHash
        ? { 'X-Heltar-Widget-Hash': visitorHash }
        : undefined,
      credentials: 'omit',
    },
  );
  if (!res.ok) {
    // Error body is { errorType, errorMessage }.
    const body = (await res.json().catch(() => null)) as {
      errorMessage?: string;
    } | null;
    throw body?.errorMessage
      ? new WidgetCallError(body.errorMessage)
      : new Error(`call start failed: ${res.status}`);
  }
  const json = (await res.json()) as {
    data: { roomName: string; token: string; voiceUrl: string };
  };
  return json.data;
};

interface UploadArgs extends VisitorArgs {
  file: File;
}

export const uploadFile = async ({
  apiHost,
  businessId,
  visitorId,
  visitorHash,
  file,
}: UploadArgs): Promise<UploadResponse> => {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(
    `${apiHost}/v1/webhooks/web/${businessId}/${visitorId}/upload`,
    {
      method: 'POST',
      headers: visitorHash
        ? { 'X-Heltar-Widget-Hash': visitorHash }
        : undefined,
      body: form,
      credentials: 'omit',
    },
  );
  if (!res.ok) {
    throw new Error(`upload failed: ${res.status}`);
  }
  const json = (await res.json()) as { data: UploadResponse };
  return json.data;
};
