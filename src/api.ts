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
}

interface HistoryArgs extends VisitorArgs {
  beforeTimestamp?: string;
  limit?: number;
}

export const loadHistory = async ({
  apiHost,
  businessId,
  visitorId,
  beforeTimestamp,
  limit,
}: HistoryArgs): Promise<HistoryResponse> => {
  const params = new URLSearchParams();
  if (beforeTimestamp) params.set('beforeTimestamp', beforeTimestamp);
  if (limit) params.set('limit', String(limit));
  const url =
    `${apiHost}/v1/webhooks/web/${businessId}/${visitorId}/history` +
    (params.toString() ? `?${params}` : '');
  const res = await fetch(url, { credentials: 'omit' });
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
}

export const sendMessage = async ({
  apiHost,
  businessId,
  visitorId,
  text,
  name,
  media,
  reply,
}: SendArgs): Promise<void> => {
  const body: Record<string, unknown> = { visitorId };
  if (text) body.text = text;
  if (name) body.name = name;
  if (media) body.media = media;
  if (reply) body.reply = reply;
  const res = await fetch(`${apiHost}/v1/webhooks/web/${businessId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'omit',
  });
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
  wamids,
}: MarkReadArgs): Promise<void> => {
  if (wamids.length === 0) return;
  try {
    await fetch(`${apiHost}/v1/webhooks/web/${businessId}/${visitorId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wamids }),
      credentials: 'omit',
    });
  } catch {
    /* best-effort — ignore */
  }
};

interface UploadArgs extends VisitorArgs {
  file: File;
}

export const uploadFile = async ({
  apiHost,
  businessId,
  visitorId,
  file,
}: UploadArgs): Promise<UploadResponse> => {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(
    `${apiHost}/v1/webhooks/web/${businessId}/${visitorId}/upload`,
    {
      method: 'POST',
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
