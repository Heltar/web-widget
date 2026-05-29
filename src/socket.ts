import { io, type Socket } from 'socket.io-client';

import type { WidgetMedia, WidgetMessage } from './types';

interface ConnectArgs {
  apiHost: string;
  businessId: number;
  visitorId: string;
  /** Called every time the server emits a message to this visitor's room. */
  onMessage: (msg: WidgetMessage) => void;
  /** Called after the room is successfully (re)joined, so the caller can
   *  backfill anything missed between its history snapshot and the join. */
  onJoined?: () => void;
}

/**
 * Open a Socket.io connection to the HeltarChat backend and join the
 * per-visitor room. Returns a disposer; the widget calls it on unmount.
 *
 * Auth: the backend verifies the connecting page's `Origin` against the
 * business's allowlist before the visitor's room is joined. The visitorId
 * (a random id from localStorage) scopes that room — same model as the REST
 * endpoints.
 */
export const connectWidgetSocket = ({
  apiHost,
  businessId,
  visitorId,
  onMessage,
  onJoined,
}: ConnectArgs): { socket: Socket; dispose: () => void } => {
  const socket = io(apiHost || undefined, {
    transports: ['websocket', 'polling'],
    withCredentials: false,
    // Public widget — no JWT. The backend socket middleware admits the
    // connection on `web: true` and gates it by the page Origin against this
    // business's allow-list (same domain check as the REST web routes).
    auth: { web: true, businessId },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // Force a dedicated connection. Without this, socket.io-client multiplexes
    // onto an existing connection to the same host — so when the widget is
    // tested INSIDE the dashboard (same apiHost), it reuses the dashboard's
    // already-connected socket and the widget's own `connect` event never
    // fires → `join_web` is never sent → the visitor room is never joined.
    forceNew: true,
  });

  let joinRetry: ReturnType<typeof setTimeout> | undefined;
  const join = (): void => {
    // Use the ack so a failed join (e.g. origin not allow-listed, or a
    // transient error) is visible and retried — otherwise the widget silently
    // never joins the room and falls back to history polling forever.
    socket.emit(
      'join_web',
      { businessId, visitorId },
      (ack?: { ok: boolean; error?: string }) => {
        // Clear any pending retry on every ack so a late success can't leave a
        // stray re-join queued (rapid reconnects would otherwise pile them up).
        if (joinRetry) {
          clearTimeout(joinRetry);
          joinRetry = undefined;
        }
        if (ack && ack.ok === false) {
          joinRetry = setTimeout(join, 3000);
        } else if (ack && ack.ok) {
          onJoined?.();
        }
      },
    );
  };

  const onConnect = (): void => {
    console.log(`Web widget connected with id: ${socket.id}`);
    join();
  };
  const onReconnect = (): void => {
    // Socket.io rooms are connection-scoped — re-join on reconnect.
    join();
  };

  socket.on('connect', onConnect);
  // Safety: if the socket was already connected before this listener attached,
  // the `connect` event won't re-fire — join immediately so we never miss it.
  if (socket.connected) onConnect();
  // On reconnect, re-join the room — Socket.io rooms are connection-scoped.
  socket.io.on('reconnect', onReconnect);

  socket.on('receiveMsg', (payload: unknown) => {
    const adapted = adaptInboxPayloadToWidgetMessage(payload);
    if (adapted) onMessage(adapted);
  });

  return {
    socket,
    dispose: () => {
      if (joinRetry) clearTimeout(joinRetry);
      socket.off('connect', onConnect);
      socket.io.off('reconnect', onReconnect);
      socket.disconnect();
    },
  };
};

/**
 * The inbox `receiveMsg` event reuses the shape `{ client, message,
 * isNewClient }` (see backend/src/controllers/messages/utils/sendMessage.ts).
 * For widget rendering we only need the message, projected into the lean
 * `WidgetMessage` shape that the components consume.
 */
const adaptInboxPayloadToWidgetMessage = (
  payload: unknown,
): WidgetMessage | null => {
  if (!payload || typeof payload !== 'object') return null;
  const p = payload as {
    message?: {
      wamid?: string;
      timestamp?: string | Date;
      body?: string;
      phoneNumberId?: string;
      status?: string;
      type?: string;
      interactive?: unknown;
      awsLink?: string;
      caption?: string;
      filename?: string;
      name?: string;
      mimeType?: string;
    };
  };
  const m = p.message;
  if (!m || !m.wamid) return null;
  const ts =
    typeof m.timestamp === 'string'
      ? m.timestamp
      : m.timestamp instanceof Date
        ? m.timestamp.toISOString()
        : new Date().toISOString();
  return {
    id: m.wamid,
    timestamp: ts,
    // Every event delivered on this visitor's room is OUTBOUND (us → visitor).
    // The visitor's own POST is broadcast only to the per-business room (inbox
    // UI), never echoed back to the widget — so `direction` is always 'out'
    // here. The widget renders the visitor's own messages from its local
    // optimistic state, not from this socket.
    direction: 'out',
    body: m.body ?? '',
    interactive:
      m.type === 'interactive'
        ? ((m.interactive as WidgetMessage['interactive']) ?? null)
        : undefined,
    media: extractMedia(m),
    status: m.status,
  };
};

/** Specific media kind from the mime type — MediaMsg stores the STI
 *  discriminator `type: 'media'`, not the image/video/… kind. */
const mediaKindFromMime = (mime?: string): WidgetMedia['type'] => {
  if (!mime) return 'document';
  if (mime.startsWith('image')) return 'image';
  if (mime.startsWith('audio')) return 'audio';
  if (mime.startsWith('video')) return 'video';
  return 'document';
};

const extractMedia = (m: {
  type?: string;
  awsLink?: string;
  caption?: string;
  filename?: string;
  name?: string;
  mimeType?: string;
}): WidgetMessage['media'] => {
  if (!m.awsLink || m.type !== 'media') return undefined;
  return {
    type: mediaKindFromMime(m.mimeType),
    url: m.awsLink,
    caption: m.caption,
    filename: m.filename ?? m.name,
    mimeType: m.mimeType,
  };
};
