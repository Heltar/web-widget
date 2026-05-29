/**
 * Public surface of `window.HeltarChat`. Customers consume this; keep it
 * documented and stable.
 */

export interface BubbleProps {
  /** Business ID — the integer shown in the widget settings page. Required. */
  businessId: number;
  /**
   * Base URL of the HeltarChat API, e.g. `https://app.heltar.com`. The widget
   * appends `/v1/webhooks/web/...`. Omit for self-hosted deploys where the
   * widget is served from the same origin as the API.
   */
  apiHost?: string;
  /**
   * Override the visitor's identity from your own auth system. When set,
   * this id is used as both the visitor identifier and the implicit
   * secret — bypassing the widget's localStorage random id.
   *
   * Use this when your site already knows who the visitor is (logged-in
   * user, known phone, etc.) so agents can find the same conversation
   * across the visitor's devices and channels.
   *
   * SECURITY: pass this ONLY for visitors you've authenticated server-
   * side. Anyone who knows the value can read that visitor's chat. The
   * widget does NOT verify the id — you do.
   *
   * Override is per page-load (not persisted) — if you stop passing it,
   * the visitor falls back to the random id stored in their localStorage.
   */
  visitor?: {
    /** Your identifier for the visitor — phone number, user id,
     *  email-hash, etc. 4-128 chars from `[A-Za-z0-9_-]`. Stored as
     *  `<id>@web` in our DB; appears alongside WhatsApp/RCS threads in
     *  the inbox. */
    id?: string;
    /** Display name shown in the agent inbox. */
    name?: string;
  };
  /** Optional theme overrides (colours, header text, welcome message). */
  theme?: WidgetTheme;
  /**
   * Colour scheme — the easiest way to bind the widget to YOUR site's theme.
   *  - `'light'` (default) / `'dark'` — force a palette.
   *  - `'system'` — follow the visitor's OS `prefers-color-scheme` (live).
   *
   * This is a top-level, reactive prop so it can be driven straight from your
   * app's theme and flipped LIVE — no re-init needed:
   *  - declarative:  `<heltar-chat-bubble mode="dark">` then
   *    `el.setAttribute('mode', 'light')` when your theme toggles;
   *  - imperative:   `HeltarChat.setMode('dark')`.
   *
   * Takes precedence over `theme.mode` when both are set.
   */
  mode?: 'light' | 'dark' | 'system';
  /** Auto-open the bubble N ms after page-load. Skip for "click to open". */
  autoShowDelay?: number;
  /**
   * Imperative open/close control, set by `window.HeltarChat.open()` /
   * `.close()`. Leave unset (`undefined`) to let the in-widget bubble button
   * drive the panel; set `true`/`false` to force it open/closed.
   */
  isOpen?: boolean;
}

export interface WidgetTheme {
  /** Brand colour for the bubble button, header, send button and reply
   *  buttons. Any CSS colour. Defaults to HeltarChat green (`#008069`). */
  primaryColor?: string;
  /**
   * Colour scheme (alternative to the top-level `mode` prop, for when you
   * configure everything through `theme`). The top-level `mode` wins if both
   * are set.
   *  - `'light'` (default) — always the light palette.
   *  - `'dark'` — always the dark palette.
   *  - `'system'` — follow the visitor's OS / browser `prefers-color-scheme`.
   */
  mode?: 'light' | 'dark' | 'system';
  /** Window title shown in the chat header. Defaults to `Chat`. */
  headerTitle?: string;
  /** Subtitle below the header title (e.g. "We typically reply in 2 minutes"). */
  headerSubtitle?: string;
  /** Bot icon URL (square, ~40px). Optional. */
  avatarUrl?: string;
  /** Welcome message rendered when the visitor opens the bubble with no
   *  prior history. Plain text — no markdown for MVP. */
  welcomeMessage?: string;
  /** Placement: bottom-right (default) or bottom-left. */
  placement?: 'left' | 'right';
  /** Chat panel width. Number → px (e.g. `420`), or any CSS length
   *  (e.g. `'32rem'`, `'90vw'`). Default `380px`. Capped to the viewport on
   *  small screens. */
  width?: number | string;
  /** Chat panel height. Number → px, or any CSS length. Default `620px`.
   *  Capped to the viewport on small screens. */
  height?: number | string;
  /** Launcher (floating bubble button) size. Number → px, or any CSS length.
   *  Default `56px`. */
  launcherSize?: number | string;
  /** Custom launcher icon: image URL shown on the bubble button instead of
   *  the default chat glyph (when the panel is closed). Square works best. */
  launcherIconUrl?: string;
}

/** WhatsApp-shaped interactive button. The widget only renders `reply`-type
 *  buttons; `url` / `call` etc. would need different handlers and aren't
 *  supported on the web channel yet. */
export interface WidgetInteractiveButton {
  type: 'reply' | string;
  reply?: { id: string; title: string };
}

/** A single selectable row inside a `list` interactive (WhatsApp's pattern
 *  for offering more than three options). */
export interface WidgetListRow {
  id: string;
  title: string;
  description?: string;
}

export interface WidgetListSection {
  title?: string;
  rows: WidgetListRow[];
}

/** Interactive payload shipped to the widget. Mirrors the shape stored in
 *  `interactive_msg.interactive` server-side. We only render the `button`
 *  variant; other shapes (list, carousel, cta_url) are rejected upstream
 *  before they reach the visitor. */
export interface WidgetInteractive {
  type: 'button' | 'list' | 'button_reply' | 'list_reply' | string;
  body?: { text: string };
  footer?: { text: string };
  action?: {
    /** `button` interactive: up to 3 quick-reply buttons. */
    buttons?: WidgetInteractiveButton[];
    /** `list` interactive: the menu trigger label + grouped, selectable rows. */
    button?: string;
    sections?: WidgetListSection[];
  };
  /** Present on INBOUND reply messages (the visitor tapped a quick-reply
   *  button or picked a list row). Carries the chosen option's id + title —
   *  used to mark the originating interactive as answered across reloads. */
  button_reply?: { id: string; title: string };
  list_reply?: { id: string; title: string };
}

/** Media attached to a message — image / video / audio / document. Mirrors
 *  the columns on MediaMsg (`awsLink`, `caption`, `filename`, `mimeType`). */
export interface WidgetMedia {
  type: 'image' | 'video' | 'audio' | 'document' | 'sticker' | string;
  url: string;
  caption?: string;
  filename?: string;
  mimeType?: string;
}

/** Single message as the widget renders it. */
export interface WidgetMessage {
  id: string;
  /** Server timestamp (ISO string). */
  timestamp: string;
  /** 'in' = visitor sent it, 'out' = business / AI agent sent it. */
  direction: 'in' | 'out';
  /** Plain-text body. For interactive messages this is the prompt body;
   *  for media messages this is the caption (or empty). */
  body: string;
  /** Interactive payload — present when the message asks the visitor to
   *  pick a button. Click bubbles back as a regular inbound text. */
  interactive?: WidgetInteractive | null;
  /** Media payload — present when the message is an image / video / audio
   *  / document. The widget renders an inline preview / link. */
  media?: WidgetMedia;
  /** Delivery status, mirrors the WhatsApp send pipeline. */
  status?: string;
  /** Local optimistic messages are flagged so we can swap the wamid when
   *  the server confirms. */
  pending?: boolean;
}

/** Response shape of GET /v1/webhooks/web/:bizId/:visitorId/history. */
export interface HistoryResponse {
  messages: Array<{
    id: string;
    timestamp: string;
    type: string;
    body: string;
    interactive?: WidgetInteractive | null;
    media?: WidgetMedia;
    direction: 'in' | 'out';
    status?: string;
  }>;
  hasMore: boolean;
}

/** Response shape of POST /v1/webhooks/web/:bizId/:visitorId/upload. */
export interface UploadResponse {
  url: string;
  mimeType: string;
  mediaType: WidgetMedia['type'];
  filename: string;
}
