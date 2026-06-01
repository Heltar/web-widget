import {
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  Show,
} from 'solid-js';

import { defaultTheme } from '../constants';
import { loadHistory, markRead, sendMessage, uploadFile } from '../api';
import {
  ensureVisitorId,
  getBubbleOpenState,
  setBubbleOpenState,
} from '../storage';
import { connectWidgetSocket } from '../socket';
import { styles } from '../styles';
import type {
  BubbleProps,
  HistoryResponse,
  WidgetInteractive,
  WidgetMedia,
  WidgetMessage,
} from '../types';

/** A button tap or list-row selection, normalised to what the widget posts. */
type WidgetReply = { kind: 'button' | 'list'; id: string; title: string };

/** Tappable reply options (quick-reply buttons + list rows) for an interactive
 *  message, normalised to {kind,id,title}. Shared by message rendering and the
 *  "already-responded" derivation from history. */
const replyOptions = (it?: WidgetInteractive | null): WidgetReply[] => {
  if (!it) return [];
  if (it.type === 'list') {
    return (it.action?.sections ?? []).flatMap(section =>
      (section.rows ?? []).map(r => ({
        kind: 'list' as const,
        id: r.id,
        title: r.title,
      })),
    );
  }
  return (it.action?.buttons ?? [])
    .filter(b => b.reply)
    .map(b => ({
      kind: 'button' as const,
      id: b.reply!.id,
      title: b.reply!.title,
    }));
};

/** The option id a visitor chose, read from an INBOUND reply message's
 *  interactive payload (`button_reply` / `list_reply`). Undefined for any
 *  message that isn't a reply. */
const replyIdOf = (it?: WidgetInteractive | null): string | undefined =>
  it?.button_reply?.id ?? it?.list_reply?.id;
import { AttachIcon, ChatIcon, CloseIcon, SendIcon } from './icons';
import { buildChatRows, formatBubbleTime } from './dayGrouping';

const localId = (): string =>
  `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/** Normalise a size theme value to a CSS length: a bare number → px, any
 *  string passes through (`'32rem'`, `'90vw'`). Undefined → undefined so the
 *  caller can omit the CSS var and fall back to the stylesheet default. */
const cssSize = (v?: number | string): string | undefined =>
  v === undefined || v === null
    ? undefined
    : typeof v === 'number'
      ? `${v}px`
      : v;

/** Project a history/poll row into the widget's render shape. One mapper for
 *  both the initial history load and the fallback poll so the projection can't
 *  drift between them. */
const toWidgetMessage = (
  m: HistoryResponse['messages'][number],
): WidgetMessage => ({
  id: m.id,
  timestamp: m.timestamp,
  body: m.body,
  interactive: m.interactive ?? undefined,
  media: m.media,
  direction: m.direction,
  status: m.status,
});

/** Phone breakpoint. MUST mirror the CSS `@media (max-width: 480px)` exactly so
 *  the JS notion of "mobile / full-screen sheet mode" can never drift from the
 *  stylesheet — one source of truth for both layout and behaviour. */
const MOBILE_QUERY = '(max-width: 480px)';

/**
 * The Web Component body — solid-element wraps this in a Shadow DOM root,
 * so the `<style>{styles}</style>` block at the top is scoped to the widget
 * (no global CSS leaks).
 */
export const Bubble = (props: BubbleProps) => {
  const apiHost = createMemo(() => (props.apiHost ?? '').replace(/\/+$/, ''));
  const theme = createMemo(() => ({ ...defaultTheme, ...props.theme }));
  // Effective colour scheme. The top-level `mode` prop (attribute-reflected,
  // so the host site can flip it live) wins over `theme.mode`. Drives the
  // `hcw-theme-{light|dark|system}` class on the root.
  const mode = createMemo(() => props.mode ?? theme().mode);

  // Root inline style: brand colour + any size overrides, fed to the CSS as
  // custom properties. Only set the vars the customer actually provided so
  // the stylesheet defaults apply otherwise.
  const rootStyle = createMemo(() => {
    const t = theme();
    const style: Record<string, string> = {
      '--hcw-primary': t.primaryColor ?? '#008069',
    };
    const w = cssSize(t.width);
    if (w) style['--hcw-panel-width'] = w;
    const h = cssSize(t.height);
    if (h) style['--hcw-panel-height'] = h;
    const l = cssSize(t.launcherSize);
    if (l) style['--hcw-launcher-size'] = l;
    // Positioning: distance from the bottom/side edges + the gap above the
    // bubble where the panel opens (it always opens above the bubble).
    const ob = cssSize(t.offsetBottom);
    if (ob) style['--hcw-offset-bottom'] = ob;
    const os = cssSize(t.offsetSide);
    if (os) style['--hcw-offset-side'] = os;
    const pg = cssSize(t.panelGap);
    if (pg) style['--hcw-panel-gap'] = pg;
    // Per-surface colour overrides → the matching --hcw-* token, set inline on
    // the root only when provided so the palette (incl. dark mode) applies
    // otherwise. Each token is already consumed by the stylesheet.
    if (t.headerColor) style['--hcw-header-bg'] = t.headerColor;
    if (t.headerTextColor) style['--hcw-header-text'] = t.headerTextColor;
    if (t.footerColor) style['--hcw-composer-bg'] = t.footerColor;
    if (t.backgroundColor) style['--hcw-chat-bg'] = t.backgroundColor;
    if (t.incomingColor) style['--hcw-msg-in-bg'] = t.incomingColor;
    if (t.incomingTextColor) style['--hcw-msg-in-text'] = t.incomingTextColor;
    if (t.outgoingColor) style['--hcw-msg-out-bg'] = t.outgoingColor;
    if (t.outgoingTextColor) style['--hcw-msg-out-text'] = t.outgoingTextColor;
    return style;
  });

  const [isOpen, setIsOpen] = createSignal<boolean>(false);
  // True on phone-sized viewports (full-screen sheet mode). Reactive to
  // rotation/resize so the dialog semantics + soft-keyboard handling follow.
  const [isMobile, setIsMobile] = createSignal<boolean>(
    typeof window !== 'undefined' &&
      !!window.matchMedia &&
      window.matchMedia(MOBILE_QUERY).matches,
  );
  const [messages, setMessages] = createSignal<WidgetMessage[]>([]);
  // Header title follows the theme reactively (falls back to 'Chat'), so a
  // live setTheme({ headerTitle }) — including clearing it — is reflected.
  const headerTitle = createMemo(() => theme().headerTitle || 'Chat');
  const [error, setError] = createSignal<string | null>(null);
  const [input, setInput] = createSignal<string>('');
  const [sending, setSending] = createSignal<boolean>(false);
  const [uploading, setUploading] = createSignal<boolean>(false);
  const [bootstrapped, setBootstrapped] = createSignal<boolean>(false);
  // Live-region politeness is held OFF until the initial history snapshot has
  // painted, then armed — so opening the bubble doesn't make a screen reader
  // read the entire (up to 50-row) backlog aloud. Real-time replies that
  // arrive afterwards are still announced.
  const [liveReady, setLiveReady] = createSignal<boolean>(false);
  /** Set of message IDs whose interactive buttons the visitor has already
   *  clicked on — disables the buttons so a click can't be double-fired. */
  const [respondedTo, setRespondedTo] = createSignal<Set<string>>(new Set());
  /** True between the visitor's send and the first inbound bot/agent reply.
   *  Renders the typing-dots indicator at the bottom of the message list. */
  const [awaitingReply, setAwaitingReply] = createSignal<boolean>(false);
  /** A file the visitor picked but hasn't sent yet — held so they can add a
   *  caption first (WhatsApp-style); sent on the next submit. */
  const [stagedFile, setStagedFile] = createSignal<{
    file: File;
    previewUrl: string;
    kind: WidgetMedia['type'];
  } | null>(null);

  let messagesEl: HTMLDivElement | undefined;
  let rootEl: HTMLDivElement | undefined;
  let panelEl: HTMLDivElement | undefined;
  let launcherEl: HTMLButtonElement | undefined;
  let inputEl: HTMLTextAreaElement | undefined;
  let fileInputEl: HTMLInputElement | undefined;
  let disposeSocket: (() => void) | undefined;
  let socketRef: { connected: boolean } | undefined;
  let replyPollHandle: number | undefined;
  let replyTimeoutHandle: number | undefined;
  let errorTimeoutHandle: number | undefined;
  /** Outbound message ids already reported as read, so we don't re-POST. */
  const readSent = new Set<string>();

  /** Resize the composer textarea to fit its content, capped at ~5 lines.
   *  Called on every keystroke + after we clear the input post-send. */
  const autoGrow = (el: HTMLTextAreaElement | undefined): void => {
    if (!el) return;
    el.style.height = 'auto';
    const max = 120; // ~5 lines at 14px/1.3 line-height
    el.style.height = `${Math.min(el.scrollHeight, max)}px`;
  };

  const visitorId = createMemo(() => {
    if (!props.businessId) return '';
    return ensureVisitorId(props.businessId, props.visitor?.id);
  });

  // Host-supplied HMAC signature of the identity. Forwarded on every request;
  // the backend only requires it for non-anonymous ids once the business
  // enables identity verification (anonymous random ids ignore it).
  const visitorHash = createMemo(() => props.visitor?.hash);

  // Report outbound (business → visitor) messages the visitor can actually see
  // as READ — only when the bubble is open AND the tab is focused, so a closed
  // bubble or a backgrounded tab doesn't falsely mark things read. Skips local
  // optimistic rows and ids already reported.
  const markVisibleRead = (): void => {
    if (!isOpen() || document.visibilityState !== 'visible') return;
    const wamids = messages()
      .filter(
        m =>
          m.direction === 'out' &&
          !m.id.startsWith('local-') &&
          !readSent.has(m.id),
      )
      .map(m => m.id);
    if (wamids.length === 0) return;
    wamids.forEach(id => readSent.add(id));
    void markRead({
      apiHost: apiHost(),
      businessId: props.businessId,
      visitorId: visitorId(),
      visitorHash: visitorHash(),
      wamids,
    });
  };

  /** Merge OUTBOUND (business → visitor) history rows into the list by id,
   *  keeping it chronological. Inbound rows are intentionally skipped — the
   *  visitor's own messages are shown from local optimistic state and would
   *  otherwise duplicate (local-… id vs the server's web_in_… id). Used by the
   *  post-join backfill and the poll fallback. Returns true if anything new
   *  was added. */
  const mergeOutboundHistory = (rows: HistoryResponse['messages']): boolean => {
    let added = false;
    setMessages(prev => {
      const existing = new Set(prev.map(m => m.id));
      const adds = rows
        .filter(m => m.direction === 'out' && !existing.has(m.id))
        .map(toWidgetMessage);
      if (adds.length === 0) return prev;
      added = true;
      return [...prev, ...adds].sort((a, b) => {
        const dt =
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        // Stable, deterministic tiebreak for messages sharing a timestamp so
        // two same-instant rows don't flip order between merges.
        return dt !== 0 ? dt : a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
      });
    });
    return added;
  };

  /** Re-pull history once after the socket joins the room, to backfill any
   *  outbound message delivered in the gap between the initial history
   *  snapshot and the room join (or while disconnected, on reconnect). */
  const backfillHistory = async (): Promise<void> => {
    if (!props.businessId || !visitorId()) return;
    try {
      const hist = await loadHistory({
        apiHost: apiHost(),
        businessId: props.businessId,
        visitorId: visitorId(),
        visitorHash: visitorHash(),
        limit: 50,
      });
      if (mergeOutboundHistory(hist.messages)) markVisibleRead();
    } catch {
      /* best-effort — the socket is the primary path */
    }
  };

  const bootstrap = async (): Promise<void> => {
    if (bootstrapped() || !props.businessId || !visitorId()) return;
    setBootstrapped(true);
    try {
      const hist = await loadHistory({
        apiHost: apiHost(),
        businessId: props.businessId,
        visitorId: visitorId(),
        visitorHash: visitorHash(),
        limit: 50,
      });
      setMessages(hist.messages.map(toWidgetMessage));
      // WhatsApp-style: an interactive whose buttons the visitor already
      // answered stays disabled across reloads. Derive it from history — an
      // interactive is "responded" if a LATER inbound reply message carries
      // one of its option ids. Matching on the option id (not the visible
      // title) avoids false-positives when two options share a title or the
      // visitor later types text equal to a button label.
      const responded = new Set<string>();
      hist.messages.forEach((m, i) => {
        const optionIds = new Set(replyOptions(m.interactive).map(o => o.id));
        if (optionIds.size === 0) return;
        const answered = hist.messages.slice(i + 1).some(n => {
          if (n.direction !== 'in') return false;
          const rid = replyIdOf(n.interactive);
          return rid !== undefined && optionIds.has(rid);
        });
        if (answered) responded.add(m.id);
      });
      setRespondedTo(responded);

      // Already-delivered outbound history is now on screen — report it read.
      markVisibleRead();

      // Arm the messages live region only AFTER this history snapshot has
      // painted, so the backlog isn't announced; later socket/poll replies are.
      window.requestAnimationFrame(() => setLiveReady(true));

      const conn = connectWidgetSocket({
        apiHost: apiHost(),
        businessId: props.businessId,
        visitorId: visitorId(),
        visitorHash: visitorHash(),
        // Forwarded on join so the backend can use it as the AI greeting opener.
        dynamicPrompt: props.dynamicPrompt,
        // Server says the bot is typing (e.g. generating the greeting) — show
        // the typing dots via the same path a sent message uses.
        onTyping: () => startWaitingForReply(new Date().toISOString()),
        // Each time the room is (re)joined, backfill anything missed in the
        // history↔join gap (or while the socket was down).
        onJoined: () => void backfillHistory(),
        onMessage: incoming => {
          setMessages(prev => {
            // De-dup by wamid only. Socket events are always OUTBOUND
            // (business → visitor); the visitor's own optimistic rows are
            // inbound and never echoed here, so matching on body would wrongly
            // drop a distinct message that merely shares text (e.g. two
            // captionless media, or a reply echoing the same word). The id
            // guard also covers the same message arriving via socket + the
            // history-poll fallback. Revoke blob: previews on any row we drop.
            const idx = prev.findIndex(m => m.id === incoming.id);
            if (idx === -1) return [...prev, incoming];
            // Re-delivery (socket reconnect, or the same wamid via socket +
            // the history-poll fallback): replace IN PLACE so the message keeps
            // its chronological slot instead of jumping to the bottom. Revoke a
            // blob: preview on the row we're replacing.
            const replaced = prev[idx];
            if (replaced.media?.url?.startsWith('blob:')) {
              URL.revokeObjectURL(replaced.media.url);
            }
            const next = prev.slice();
            next[idx] = incoming;
            return next;
          });
          // Socket only carries outbound events — kill the typing indicator
          // and report the freshly-shown message read.
          if (incoming.direction === 'out') {
            stopWaitingForReply();
            markVisibleRead();
          }
        },
      });
      disposeSocket = conn.dispose;
      socketRef = conn.socket;
    } catch (err) {
      setError((err as Error).message);
    }
  };

  // Imperative control: window.HeltarChat.open()/close() set the `isOpen`
  // property on the custom element, which solid-element forwards here as a
  // reactive prop. Drive the panel from it. `undefined` (the default) means
  // "no imperative command" — leave the in-widget toggle in charge.
  createEffect(() => {
    const want = props.isOpen;
    if (want === undefined) return;
    if (want) void openBubble();
    else closeBubble();
  });

  createEffect(() => {
    if (!props.businessId) return;
    if (getBubbleOpenState(props.businessId)) {
      void openBubble();
    } else if (props.autoShowDelay !== undefined) {
      const t = window.setTimeout(() => {
        void openBubble();
      }, props.autoShowDelay);
      onCleanup(() => window.clearTimeout(t));
    }
  });

  createEffect(() => {
    // Track the message list AND the typing/upload indicators so the view
    // scrolls to the bottom when the dots appear too — otherwise the indicator
    // renders below the fold and stays partially hidden.
    messages();
    awaitingReply();
    uploading();
    if (messagesEl) {
      window.requestAnimationFrame(() => {
        if (messagesEl) messagesEl.scrollTop = messagesEl.scrollHeight;
      });
    }
  });

  // Keep isMobile() in sync with the viewport via matchMedia on the SAME query
  // string the CSS uses, so layout (CSS) and behaviour (JS) can't disagree.
  // addListener fallback covers older Safari. Runs once (no tracked deps).
  createEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const onChange = (e: MediaQueryListEvent): void => {
      setIsMobile(e.matches);
    };
    setIsMobile(mql.matches);
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    onCleanup(() => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    });
  });

  // The panel stays mounted when "closed" (it's scaled/slid away for the exit
  // animation), so without this its textarea + buttons would linger in the tab
  // order and a11y tree. `inert` removes them; CSS visibility:hidden backs it up.
  createEffect(() => {
    if (panelEl) panelEl.inert = !isOpen();
  });

  // Mobile soft-keyboard handling. iOS doesn't reflow a position:fixed element
  // when the keyboard opens, so we size the sheet to window.visualViewport and
  // shift it by the viewport's offsetTop — the composer (the flex column's last
  // child) then rides above the keyboard with no host-scroll hacks. Gated to
  // open + mobile and fully torn down (listeners + the vars) otherwise, so it
  // never touches desktop or mutates anything outside our own root.
  createEffect(() => {
    if (!isOpen() || !isMobile()) return;
    const vv = window.visualViewport;
    if (!vv) return; // absent in some embedded webviews — degrade to 100dvh
    let rafId = 0;
    let wantScroll = false;
    const apply = (): void => {
      rafId = 0;
      if (!rootEl) return;
      rootEl.style.setProperty('--hcw-vvh', `${vv.height}px`);
      rootEl.style.setProperty('--hcw-vv-offset-top', `${vv.offsetTop}px`);
      // Keep the latest message visible when the keyboard shows/resizes, but
      // don't yank the view to the bottom on a mere viewport pan (which would
      // fight a visitor scrolling back through history with the keyboard up).
      if (wantScroll && messagesEl) {
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
      wantScroll = false;
    };
    // Coalesce the resize+scroll bursts the keyboard animation fires into one
    // write per frame (settles in a single paint, no jitter); OR the
    // scroll-to-end intent so a resize sharing a frame with a scroll still
    // pins the latest message above the keyboard.
    const schedule = (scrollToEnd: boolean): void => {
      if (scrollToEnd) wantScroll = true;
      if (!rafId) rafId = window.requestAnimationFrame(apply);
    };
    const onResize = (): void => schedule(true);
    const onScroll = (): void => schedule(false);
    wantScroll = true;
    apply(); // initial: pin --hcw-vvh to the real visual-viewport height now
    vv.addEventListener('resize', onResize, { passive: true });
    vv.addEventListener('scroll', onScroll, { passive: true });
    onCleanup(() => {
      if (rafId) window.cancelAnimationFrame(rafId);
      vv.removeEventListener('resize', onResize);
      vv.removeEventListener('scroll', onScroll);
      rootEl?.style.removeProperty('--hcw-vvh');
      rootEl?.style.removeProperty('--hcw-vv-offset-top');
    });
  });

  onCleanup(() => {
    disposeSocket?.();
    stopWaitingForReply();
    if (errorTimeoutHandle) window.clearTimeout(errorTimeoutHandle);
    // Revoke any blob: URLs that survive — typically failed-upload optimistic
    // rows the dedup logic never replaced.
    for (const m of messages()) {
      if (m.media?.url?.startsWith('blob:')) {
        URL.revokeObjectURL(m.media.url);
      }
    }
  });

  /** Surface an error inline at the bottom of the message list, auto-clear
   *  after 5s so the chat doesn't get permanently disfigured. */
  const showError = (msg: string): void => {
    setError(msg);
    if (errorTimeoutHandle) window.clearTimeout(errorTimeoutHandle);
    errorTimeoutHandle = window.setTimeout(() => setError(null), 5000);
  };

  /** Stop the typing indicator + tear down any polling. Idempotent. */
  const stopWaitingForReply = (): void => {
    if (replyPollHandle !== undefined) {
      window.clearInterval(replyPollHandle);
      replyPollHandle = undefined;
    }
    if (replyTimeoutHandle !== undefined) {
      window.clearTimeout(replyTimeoutHandle);
      replyTimeoutHandle = undefined;
    }
    setAwaitingReply(false);
  };

  /** Show the typing indicator and poll history every 3s as a fallback when
   *  the socket path is slow or broken. Bot replies arrive whichever way
   *  wins; first wire to fire calls `stopWaitingForReply`. After 30s with no
   *  reply we hide the indicator silently (no error — the business may
   *  simply have no chatbot configured, that's not a failure mode). */
  const startWaitingForReply = (afterIso: string): void => {
    stopWaitingForReply();
    setAwaitingReply(true);

    replyPollHandle = window.setInterval(() => {
      // Socket is the primary delivery path — while it's connected, trust it
      // and skip the history fallback fetch entirely. Poll only when the socket
      // is down, so an active visitor still gets replies if realtime drops.
      if (socketRef?.connected) return;
      void (async () => {
        if (!props.businessId || !visitorId()) return;
        try {
          const hist = await loadHistory({
            apiHost: apiHost(),
            businessId: props.businessId,
            visitorId: visitorId(),
            visitorHash: visitorHash(),
            limit: 10,
          });
          const cutoff = new Date(afterIso).getTime();
          // A bot/agent reply after the visitor's send (cutoff) means we can
          // stop the typing indicator. Merge any missing outbound either way.
          const hasFreshReply = hist.messages.some(
            m =>
              m.direction === 'out' && new Date(m.timestamp).getTime() > cutoff,
          );
          mergeOutboundHistory(hist.messages);
          if (hasFreshReply) {
            stopWaitingForReply();
            markVisibleRead();
          }
        } catch {
          /* polling is fire-and-forget — errors here are silent */
        }
      })();
    }, 3000);

    replyTimeoutHandle = window.setTimeout(() => {
      stopWaitingForReply();
    }, 30000);
  };

  const openBubble = async (): Promise<void> => {
    setIsOpen(true);
    setBubbleOpenState(props.businessId, true);
    await bootstrap();
    // Reopening an already-bootstrapped bubble still surfaces unread outbound
    // messages received while it was closed — report them read now.
    markVisibleRead();
    window.requestAnimationFrame(() => inputEl?.focus());
  };

  // Mark messages read when the visitor re-focuses the tab (bubble already open).
  document.addEventListener('visibilitychange', markVisibleRead);
  onCleanup(() =>
    document.removeEventListener('visibilitychange', markVisibleRead),
  );

  const closeBubble = (): void => {
    setIsOpen(false);
    setBubbleOpenState(props.businessId, false);
    // Return focus to the launcher for keyboard users. rAF lets the mobile
    // launcher un-hide (display:none → flex) before we try to focus it.
    window.requestAnimationFrame(() => launcherEl?.focus());
  };

  const toggle = (): void => {
    if (isOpen()) closeBubble();
    else void openBubble();
  };

  /** Append an optimistic outbound row + clear-out via send. Returns the
   *  optimistic id so callers can flag failure on it. */
  const submitText = async (
    text: string,
    reply?: WidgetReply,
  ): Promise<void> => {
    if (!text || sending()) return;
    setSending(true);
    const optimistic: WidgetMessage = {
      id: localId(),
      timestamp: new Date().toISOString(),
      direction: 'in',
      body: text,
      pending: true,
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      await sendMessage({
        apiHost: apiHost(),
        businessId: props.businessId,
        visitorId: visitorId(),
        visitorHash: visitorHash(),
        name: props.visitor?.name,
        dynamicPrompt: props.dynamicPrompt,
        // A tapped button / list row goes up as a WhatsApp-style reply
        // (kind + id + title); a typed message goes up as plain text.
        ...(reply ? { reply } : { text }),
      });
      // POST succeeded → the message reached us. Clear the optimistic
      // "pending" look (the visitor's own message is never echoed back over
      // the socket, so nothing else would). A reload re-fetches it from
      // history as a normal row.
      setMessages(prev =>
        prev.map(m => (m.id === optimistic.id ? { ...m, pending: false } : m)),
      );
      // Wait for a reply: show typing dots, poll history as a fallback for
      // the socket path. Stops on first inbound or 30s timeout.
      startWaitingForReply(optimistic.timestamp);
    } catch (err) {
      showError(`Couldn't send your message. Please try again.`);
      setMessages(prev =>
        prev.map(m =>
          m.id === optimistic.id
            ? { ...m, pending: false, status: 'failed' }
            : m,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
    const staged = stagedFile();
    const text = input().trim();
    // A staged file sends as media (with the input as its caption); otherwise
    // it's a plain text message.
    if (staged) {
      setStagedFile(null);
      setInput('');
      autoGrow(inputEl);
      URL.revokeObjectURL(staged.previewUrl);
      await submitMedia(staged.file, text);
      return;
    }
    if (!text) return;
    setInput('');
    autoGrow(inputEl);
    await submitText(text);
  };

  const handleReply = async (
    msgId: string,
    reply: WidgetReply,
  ): Promise<void> => {
    if (!reply.id || !reply.title) return;
    setRespondedTo(prev => new Set(prev).add(msgId));
    // Send as a button/list reply (id + title) so the bot flow advances exactly
    // like a WhatsApp quick-reply tap or list selection, not a typed message.
    await submitText(reply.title, reply);
  };

  const handleAttach = (): void => {
    if (uploading() || sending()) return;
    fileInputEl?.click();
  };

  const mediaKindOf = (mime: string): WidgetMedia['type'] =>
    mime.startsWith('image/')
      ? 'image'
      : mime.startsWith('video/')
        ? 'video'
        : mime.startsWith('audio/')
          ? 'audio'
          : 'document';

  // Picking a file no longer sends immediately — stage it so the visitor can
  // type a caption first (WhatsApp-style), then send on submit.
  const handleFileChange = (
    e: Event & { currentTarget: HTMLInputElement },
  ): void => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    const prev = stagedFile();
    if (prev) URL.revokeObjectURL(prev.previewUrl);
    setStagedFile({
      file,
      previewUrl: URL.createObjectURL(file),
      kind: mediaKindOf(file.type),
    });
    window.requestAnimationFrame(() => inputEl?.focus());
  };

  const cancelStaged = (): void => {
    const s = stagedFile();
    if (s) URL.revokeObjectURL(s.previewUrl);
    setStagedFile(null);
  };

  /** Upload the staged file + send it with an optional caption. The optimistic
   *  row shows a local preview + the caption until the server echo. */
  const submitMedia = async (file: File, caption: string): Promise<void> => {
    if (uploading()) return;
    setUploading(true);
    const optimistic: WidgetMessage = {
      id: localId(),
      timestamp: new Date().toISOString(),
      direction: 'in',
      body: caption,
      media: {
        type: mediaKindOf(file.type),
        url: URL.createObjectURL(file),
        filename: file.name,
        mimeType: file.type,
      },
      pending: true,
    };
    setMessages(prev => [...prev, optimistic]);
    try {
      const uploaded = await uploadFile({
        apiHost: apiHost(),
        businessId: props.businessId,
        visitorId: visitorId(),
        visitorHash: visitorHash(),
        file,
      });
      await sendMessage({
        apiHost: apiHost(),
        businessId: props.businessId,
        visitorId: visitorId(),
        visitorHash: visitorHash(),
        name: props.visitor?.name,
        dynamicPrompt: props.dynamicPrompt,
        // Caption rides with the media (backend stores it as the media caption).
        text: caption || undefined,
        media: {
          url: uploaded.url,
          mimeType: uploaded.mimeType,
          mediaType: uploaded.mediaType as
            | 'image'
            | 'video'
            | 'audio'
            | 'document',
          filename: uploaded.filename,
        },
      });
      // Upload + send succeeded → drop the optimistic "pending" state (keep the
      // local blob preview until a reload swaps in the S3 url from history).
      setMessages(prev =>
        prev.map(m => (m.id === optimistic.id ? { ...m, pending: false } : m)),
      );
      startWaitingForReply(optimistic.timestamp);
    } catch (err) {
      showError(`Couldn't upload the file. Please try again.`);
      setMessages(prev =>
        prev.map(m =>
          m.id === optimistic.id
            ? { ...m, pending: false, status: 'failed' }
            : m,
        ),
      );
    } finally {
      setUploading(false);
    }
  };

  const rows = createMemo(() => buildChatRows(messages()));
  const showWelcome = createMemo(
    () =>
      messages().length === 0 &&
      bootstrapped() &&
      (props.theme?.welcomeMessage?.trim() ?? '') !== '',
  );

  return (
    <>
      <style>{styles}</style>
      <div
        ref={el => (rootEl = el)}
        class={`hcw-root hcw-${theme().placement} hcw-theme-${mode()} ${
          isOpen() ? 'hcw-open' : ''
        }`}
        style={rootStyle()}
      >
        <div
          ref={el => (panelEl = el)}
          class={`hcw-panel ${isOpen() ? '' : 'hcw-closed'}`}
          role='dialog'
          // Non-modal: the widget never neutralises the host DOM and installs
          // no focus trap (good-citizen constraint), so claiming aria-modal
          // would be a false promise to assistive tech even on the mobile sheet.
          aria-modal='false'
          aria-labelledby='hcw-dialog-title'
          onKeyDown={e => {
            // Esc closes the panel; scoped so it doesn't also trip a host
            // page's own Escape handler.
            if (e.key === 'Escape' && isOpen()) {
              e.stopPropagation();
              closeBubble();
            }
          }}
        >
          <div class='hcw-header'>
            <div class='hcw-header-avatar'>
              <Show
                when={theme().avatarUrl}
                fallback={(headerTitle() ?? 'H').slice(0, 1).toUpperCase()}
              >
                <img src={theme().avatarUrl} alt='' />
              </Show>
            </div>
            <div class='hcw-header-text'>
              <p class='hcw-header-title' id='hcw-dialog-title'>
                {headerTitle()}
              </p>
              <Show when={theme().headerSubtitle}>
                <p class='hcw-header-subtitle'>{theme().headerSubtitle}</p>
              </Show>
            </div>
            <button
              class='hcw-header-close'
              type='button'
              aria-label='Close chat'
              onClick={closeBubble}
            >
              <CloseIcon />
            </button>
          </div>

          <div
            class='hcw-messages'
            ref={el => (messagesEl = el)}
            role='log'
            aria-live={liveReady() ? 'polite' : 'off'}
            aria-relevant='additions'
            aria-atomic='false'
          >
            <Show when={showWelcome()}>
              <p class='hcw-empty'>{theme().welcomeMessage}</p>
            </Show>
            <For each={rows()}>
              {row =>
                row.kind === 'day' ? (
                  <div class='hcw-day-sep'>{row.label}</div>
                ) : (
                  <MessageBubble
                    message={row.message}
                    onReply={reply => void handleReply(row.message.id, reply)}
                    isResponded={respondedTo().has(row.message.id)}
                  />
                )
              }
            </For>
            <Show when={uploading() || awaitingReply()}>
              <div class='hcw-typing'>
                <span class='hcw-dot' />
                <span class='hcw-dot' />
                <span class='hcw-dot' />
              </div>
            </Show>
            <Show when={error()}>
              <div class='hcw-error'>{error()}</div>
            </Show>
          </div>

          <Show when={stagedFile()}>
            {staged => (
              <div class='hcw-staged'>
                {staged().kind === 'image' ? (
                  <img
                    class='hcw-staged-thumb'
                    src={staged().previewUrl}
                    alt=''
                  />
                ) : (
                  <span class='hcw-staged-icon'>📎</span>
                )}
                <span class='hcw-staged-name'>{staged().file.name}</span>
                <button
                  type='button'
                  class='hcw-staged-cancel'
                  aria-label='Remove attachment'
                  onClick={cancelStaged}
                >
                  <CloseIcon />
                </button>
              </div>
            )}
          </Show>
          <div class='hcw-composer'>
            <input
              type='file'
              ref={el => (fileInputEl = el)}
              class='hcw-file-input'
              accept='image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.csv,.txt'
              onChange={e =>
                void handleFileChange(
                  e as Event & { currentTarget: HTMLInputElement },
                )
              }
            />
            <button
              class='hcw-attach'
              type='button'
              aria-label='Attach file'
              onClick={handleAttach}
              disabled={sending() || uploading()}
            >
              <AttachIcon />
            </button>
            <textarea
              ref={el => (inputEl = el)}
              class='hcw-text-input'
              placeholder={stagedFile() ? 'Add a caption…' : 'Type a message…'}
              rows={1}
              value={input()}
              onInput={e => {
                setInput(e.currentTarget.value);
                autoGrow(e.currentTarget);
              }}
              onKeyDown={e => {
                // Enter sends; Shift+Enter inserts a newline.
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit();
                }
              }}
              disabled={sending() || uploading()}
            />
            <button
              class='hcw-send'
              type='button'
              aria-label='Send'
              onClick={() => void handleSubmit()}
              disabled={
                sending() || uploading() || (!input().trim() && !stagedFile())
              }
            >
              <SendIcon />
            </button>
          </div>
        </div>

        <button
          ref={el => (launcherEl = el)}
          classList={{
            'hcw-bubble-btn': true,
            // launcherHtml takes over the whole button — drop the default
            // circle / colour / size / shadow so the custom markup IS the
            // launcher (styled entirely by its own markup + inline <style>).
            'hcw-bubble-custom': !!theme().launcherHtml,
          }}
          type='button'
          aria-haspopup='dialog'
          aria-expanded={isOpen() ? 'true' : 'false'}
          // Stable name + aria-expanded (ARIA disclosure pattern). Avoids two
          // adjacent controls both named "Close chat" when open on desktop —
          // the header's close button is the labelled "Close chat".
          aria-label='Open chat'
          onClick={toggle}
        >
          <Show
            when={theme().launcherHtml}
            fallback={
              <Show
                when={isOpen()}
                fallback={
                  <Show when={theme().launcherIconUrl} fallback={<ChatIcon />}>
                    <img
                      class='hcw-bubble-icon'
                      src={theme().launcherIconUrl}
                      alt=''
                    />
                  </Show>
                }
              >
                <CloseIcon />
              </Show>
            }
          >
            {/* Customer-authored launcher markup (+ optional <style> for CSS),
                their own content on their own site. Rendered in BOTH open and
                closed states so an embedded <style> stays applied while open. */}
            <span class='hcw-bubble-html' innerHTML={theme().launcherHtml} />
          </Show>
        </button>
      </div>
    </>
  );
};

/** A single message bubble — handles text, media (image/video/audio/doc),
 *  and interactive replies (quick-reply buttons + list rows). */
const MessageBubble = (props: {
  message: WidgetMessage;
  isResponded: boolean;
  onReply: (reply: WidgetReply) => void;
}) => {
  const m = () => props.message;
  const isOut = () => m().direction === 'out';
  // Quick-reply buttons and list rows both render as clickable chips so the
  // visitor just taps (list row → list_reply, button → button_reply upstream).
  const options = (): WidgetReply[] => replyOptions(m().interactive);

  return (
    <div
      class={`hcw-msg-row ${isOut() ? 'hcw-msg-row-out' : 'hcw-msg-row-in'}`}
    >
      <div
        class={`hcw-msg ${isOut() ? 'hcw-msg-out' : 'hcw-msg-in'} ${
          m().pending ? 'hcw-msg-pending' : ''
        }`}
      >
        <Show when={m().media}>
          <MediaBlock media={m().media!} />
        </Show>
        <Show when={m().body}>
          <div class='hcw-msg-text'>{m().body}</div>
        </Show>
        <span class='hcw-msg-time'>{formatBubbleTime(m().timestamp)}</span>
      </div>

      <Show when={options().length > 0}>
        <div class='hcw-btn-group'>
          <For each={options()}>
            {opt => (
              <button
                type='button'
                class='hcw-reply-btn'
                onClick={() => props.onReply(opt)}
                disabled={props.isResponded}
              >
                {opt.title}
              </button>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

/** Renders the inline image / video / audio / document bubble content. */
const MediaBlock = (props: { media: WidgetMedia }) => {
  const m = () => props.media;
  if (m().type === 'image') {
    return (
      <a
        href={m().url}
        target='_blank'
        rel='noopener noreferrer'
        class='hcw-media-link'
      >
        <img
          src={m().url}
          alt={m().filename ?? 'image'}
          class='hcw-media-img'
        />
      </a>
    );
  }
  if (m().type === 'video') {
    return (
      <video controls preload='metadata' class='hcw-media-video'>
        <source src={m().url} type={m().mimeType} />
      </video>
    );
  }
  if (m().type === 'audio') {
    return (
      <audio controls preload='metadata' class='hcw-media-audio'>
        <source src={m().url} type={m().mimeType} />
      </audio>
    );
  }
  // Document / sticker / unknown — link with filename.
  return (
    <a
      href={m().url}
      target='_blank'
      rel='noopener noreferrer'
      download={m().filename}
      class='hcw-media-doc'
    >
      <span class='hcw-media-doc-icon'>📄</span>
      <span class='hcw-media-doc-name'>{m().filename ?? 'Download'}</span>
    </a>
  );
};
