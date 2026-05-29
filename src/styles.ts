/**
 * Inline CSS for the widget. solid-element wraps everything in a Shadow
 * DOM, so these selectors are NOT global — they don't leak into the host
 * page, and nothing the host page declares can override them.
 *
 * Kept as a JS string (no PostCSS / Tailwind toolchain) so the bundle has
 * no build-time CSS dependency.
 *
 * Theming: every colour is a `--hcw-*` CSS custom property defined on
 * `.hcw-root`. The LIGHT palette is the default; the DARK palette overrides
 * the same tokens under `.hcw-root.hcw-theme-dark` (forced) and, for
 * `.hcw-theme-system`, under `prefers-color-scheme: dark`. `--hcw-primary` is
 * set inline from `theme.primaryColor`, so a business can re-brand without
 * touching this file.
 *
 * Direction-naming reminder: from the VISITOR's point of view, their own
 * messages (direction='in' on the server, "inbound" to the business) sit
 * on the right in green; business replies (direction='out' on the server,
 * "outbound" from the business) sit on the left in white. The CSS swaps
 * accordingly.
 */

/** Dark-palette token overrides — shared by the forced (`hcw-theme-dark`) and
 *  the OS-driven (`hcw-theme-system` + prefers-color-scheme) selectors, so the
 *  values live in exactly one place. */
const darkTokens = `
  --hcw-surface: #111b21;
  --hcw-surface-2: #1d282f;
  --hcw-chat-bg: #0b141a;
  --hcw-text: #e9edef;
  --hcw-text-muted: #8696a0;
  --hcw-border: rgba(255, 255, 255, 0.12);
  --hcw-overlay: rgba(255, 255, 255, 0.08);
  --hcw-overlay-strong: rgba(255, 255, 255, 0.14);
  --hcw-msg-in-bg: #005c4b;
  --hcw-msg-in-text: #e9edef;
  --hcw-msg-out-bg: #202c33;
  --hcw-msg-out-text: #e9edef;
  --hcw-input-bg: #2a3942;
  --hcw-input-disabled-bg: #182229;
  --hcw-reply-btn-bg: #202c33;
  --hcw-reply-btn-hover: #2a3942;
  --hcw-day-sep-bg: rgba(32, 44, 51, 0.92);
  --hcw-scroll-thumb: rgba(255, 255, 255, 0.18);
  --hcw-shadow: 0 16px 48px rgba(0, 0, 0, 0.5);
  --hcw-error-bg: #3a1f1f;
  --hcw-error-text: #ff8a80;
  --hcw-error-border: #5a2a2a;
`;

export const styles = `
:host {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  font-size: 14px;
}

.hcw-root {
  /* ---- LIGHT palette (default) ---- */
  --hcw-primary: #008069;
  --hcw-surface: #ffffff;
  --hcw-surface-2: #f0f2f5;
  --hcw-chat-bg: #efeae2;
  --hcw-text: #111b21;
  --hcw-text-muted: #667781;
  --hcw-border: rgba(0, 0, 0, 0.1);
  --hcw-overlay: rgba(0, 0, 0, 0.06);
  --hcw-overlay-strong: rgba(0, 0, 0, 0.1);
  --hcw-msg-in-bg: #d9fdd3;
  --hcw-msg-in-text: #111b21;
  --hcw-msg-out-bg: #ffffff;
  --hcw-msg-out-text: #111b21;
  --hcw-input-bg: #ffffff;
  --hcw-input-disabled-bg: #f5f5f5;
  --hcw-reply-btn-bg: #ffffff;
  --hcw-reply-btn-hover: #f3fbf2;
  --hcw-day-sep-bg: rgba(255, 255, 255, 0.92);
  --hcw-scroll-thumb: rgba(0, 0, 0, 0.15);
  --hcw-shadow: 0 16px 48px rgba(0, 0, 0, 0.22);
  --hcw-error-bg: #fff0f0;
  --hcw-error-text: #b00020;
  --hcw-error-border: #ffd0d0;

  position: fixed;
  bottom: 20px;
  z-index: 2147483640;
  color: var(--hcw-text);
}
/* Forced dark mode */
.hcw-root.hcw-theme-dark {${darkTokens}}
/* System mode — follow the visitor's OS / browser preference */
@media (prefers-color-scheme: dark) {
  .hcw-root.hcw-theme-system {${darkTokens}}
}

.hcw-root.hcw-right { right: 20px; }
.hcw-root.hcw-left { left: 20px; }

.hcw-bubble-btn {
  width: var(--hcw-launcher-size, 56px);
  height: var(--hcw-launcher-size, 56px);
  border-radius: 16px;
  background: var(--hcw-primary);
  color: #fff;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.18);
  transition: transform 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
.hcw-bubble-btn:hover { transform: scale(1.08); }
.hcw-bubble-btn:active { transform: scale(0.95); }
.hcw-bubble-btn svg { width: 28px; height: 28px; }
/* Custom launcher icon (theme.launcherIconUrl) — sized to the SVG glyph. */
.hcw-bubble-icon {
  width: 60%;
  height: 60%;
  object-fit: contain;
  border-radius: 6px;
}

.hcw-panel {
  position: absolute;
  bottom: calc(var(--hcw-launcher-size, 56px) + 16px);
  width: var(--hcw-panel-width, 380px);
  height: var(--hcw-panel-height, 620px);
  max-width: calc(100vw - 40px);
  max-height: min(var(--hcw-panel-height, 620px), calc(100vh - 100px));
  border-radius: 14px;
  background: var(--hcw-surface);
  box-shadow: var(--hcw-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
  transition:
    transform 200ms cubic-bezier(0, 1.2, 1, 1),
    opacity 150ms ease-out;
}
.hcw-root.hcw-left .hcw-panel {
  transform-origin: bottom left;
  left: 0;
}
.hcw-root.hcw-right .hcw-panel { right: 0; }
.hcw-panel.hcw-closed {
  transform: scale3d(0, 0, 1);
  opacity: 0;
  pointer-events: none;
}

.hcw-header {
  background: var(--hcw-primary);
  color: #fff;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.hcw-header-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}
.hcw-header-avatar img {
  width: 100%; height: 100%; border-radius: 50%; object-fit: cover;
}
.hcw-header-text { flex: 1; min-width: 0; }
.hcw-header-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hcw-header-subtitle {
  font-size: 12px;
  opacity: 0.85;
  margin: 2px 0 0 0;
}
.hcw-header-close {
  background: none; border: none; color: #fff; cursor: pointer;
  padding: 4px; opacity: 0.85; border-radius: 4px;
}
.hcw-header-close:hover { opacity: 1; background: rgba(255,255,255,0.1); }
.hcw-header-close svg { width: 20px; height: 20px; }

.hcw-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  background: var(--hcw-chat-bg);
  display: flex;
  flex-direction: column;
  gap: 4px;
  scrollbar-width: thin;
}
.hcw-messages::-webkit-scrollbar { width: 6px; }
.hcw-messages::-webkit-scrollbar-track { background: transparent; }
.hcw-messages::-webkit-scrollbar-thumb {
  background: var(--hcw-scroll-thumb);
  border-radius: 4px;
}

.hcw-day-sep {
  align-self: center;
  background: var(--hcw-day-sep-bg);
  color: var(--hcw-text-muted);
  font-size: 11.5px;
  padding: 4px 12px;
  border-radius: 12px;
  margin: 8px 0;
  box-shadow: 0 1px 0.5px rgba(0,0,0,0.08);
}

/* Wrapper row controls alignment of the bubble + any attached buttons */
.hcw-msg-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 4px;
  animation: hcw-fade-in 180ms ease-out;
}
.hcw-msg-row-in { align-items: flex-end; }
.hcw-msg-row-out { align-items: flex-start; }

@keyframes hcw-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hcw-msg {
  max-width: 82%;
  padding: 7px 10px 6px 10px;
  border-radius: 8px;
  word-wrap: break-word;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.38;
  position: relative;
  box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
}
/* Visitor's own message (direction === 'in' server-side) — right, green */
.hcw-msg-in {
  background: var(--hcw-msg-in-bg);
  color: var(--hcw-msg-in-text);
}
/* Business reply (direction === 'out' server-side) — left, white */
.hcw-msg-out {
  background: var(--hcw-msg-out-bg);
  color: var(--hcw-msg-out-text);
}
.hcw-msg-text {
  margin: 0;
}
.hcw-msg-time {
  display: block;
  font-size: 10.5px;
  color: var(--hcw-text-muted);
  text-align: right;
  margin-top: 2px;
  user-select: none;
}
.hcw-msg-pending { opacity: 0.6; }

/* Quick-reply buttons attached under an interactive message */
.hcw-btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 82%;
}
.hcw-reply-btn {
  flex: 0 1 auto;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--hcw-reply-btn-bg);
  color: var(--hcw-primary);
  border: 1px solid var(--hcw-border);
  border-radius: 8px;
  padding: 8px 12px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms ease, transform 120ms ease;
  box-shadow: 0 1px 0.5px rgba(0,0,0,0.08);
}
.hcw-reply-btn:hover:not(:disabled) {
  background: var(--hcw-reply-btn-hover);
  transform: translateY(-1px);
}
.hcw-reply-btn:active:not(:disabled) {
  transform: translateY(0);
}
.hcw-reply-btn:disabled {
  cursor: default;
  opacity: 0.45;
}

/* Media bubble content */
.hcw-media-link { display: block; line-height: 0; }
.hcw-media-img {
  max-width: 100%;
  max-height: 280px;
  border-radius: 6px;
  display: block;
  object-fit: cover;
}
.hcw-media-video {
  width: 100%;
  max-height: 280px;
  border-radius: 6px;
  background: #000;
}
.hcw-media-audio { width: 100%; }
.hcw-media-doc {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--hcw-overlay);
  border-radius: 6px;
  text-decoration: none;
  color: inherit;
}
.hcw-media-doc:hover { background: var(--hcw-overlay-strong); }
.hcw-media-doc-icon { font-size: 22px; }
.hcw-media-doc-name {
  font-size: 13px;
  word-break: break-all;
}

/* Typing dots (used while a file is uploading) */
.hcw-typing {
  align-self: flex-start;
  background: var(--hcw-msg-out-bg);
  padding: 10px 14px;
  border-radius: 8px;
  display: inline-flex;
  gap: 4px;
  box-shadow: 0 1px 0.5px rgba(0,0,0,0.13);
}
.hcw-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--hcw-text-muted);
  opacity: 0.5;
  animation: hcw-bounce 1s infinite ease-in-out;
}
.hcw-dot:nth-child(2) { animation-delay: 0.15s; }
.hcw-dot:nth-child(3) { animation-delay: 0.3s; }
@keyframes hcw-bounce {
  0%, 100% { transform: translateY(0); opacity: 0.5; }
  50%      { transform: translateY(-3px); opacity: 1; }
}

.hcw-empty {
  align-self: center;
  margin: auto 0;
  text-align: center;
  color: var(--hcw-text-muted);
  font-size: 13px;
  max-width: 80%;
  line-height: 1.4;
}
.hcw-error {
  align-self: center;
  margin: 6px auto;
  padding: 8px 14px;
  background: var(--hcw-error-bg);
  color: var(--hcw-error-text);
  border: 1px solid var(--hcw-error-border);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.35;
  max-width: 90%;
  text-align: center;
  box-shadow: 0 1px 1px rgba(0,0,0,0.04);
}

.hcw-composer {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: var(--hcw-surface-2);
  border-top: 1px solid var(--hcw-border);
}
/* Staged attachment preview (above the composer, before sending). */
.hcw-staged {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--hcw-surface-2);
  border-top: 1px solid var(--hcw-border);
}
.hcw-staged-thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  object-fit: cover;
  flex: 0 0 auto;
}
.hcw-staged-icon {
  font-size: 22px;
  flex: 0 0 auto;
}
.hcw-staged-name {
  flex: 1 1 auto;
  font-size: 13px;
  color: var(--hcw-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hcw-staged-cancel {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--hcw-text-muted);
  cursor: pointer;
  border-radius: 50%;
}
.hcw-staged-cancel:hover { background: var(--hcw-overlay); }
.hcw-staged-cancel svg { width: 18px; height: 18px; }
.hcw-text-input {
  flex: 1 1 auto;
  /* Flex children with intrinsic minimum widths (forms!) don't shrink without
     this — textarea can overflow the panel otherwise. */
  min-width: 0;
  box-sizing: border-box;
  min-height: 38px;
  max-height: 120px;
  resize: none;
  background: var(--hcw-input-bg);
  border: 1px solid var(--hcw-border);
  border-radius: 19px;
  padding: 8px 14px;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.4;
  outline: none;
  overflow-y: auto;
  display: block;
  /* Form controls don't inherit color from the host by default in most
     browsers — explicit values are needed for the typed text + caret to
     be visible inside the Shadow DOM. */
  color: var(--hcw-text);
  caret-color: var(--hcw-primary);
  -webkit-text-fill-color: var(--hcw-text);
  transition: border-color 120ms ease;
}
.hcw-text-input:focus {
  border-color: var(--hcw-primary);
}
.hcw-text-input::placeholder {
  color: var(--hcw-text-muted);
  opacity: 1;
}
.hcw-text-input:disabled {
  background: var(--hcw-input-disabled-bg);
  color: var(--hcw-text-muted);
  -webkit-text-fill-color: var(--hcw-text-muted);
}
.hcw-text-input::-webkit-scrollbar { width: 6px; }
.hcw-text-input::-webkit-scrollbar-thumb {
  background: var(--hcw-scroll-thumb);
  border-radius: 4px;
}
.hcw-file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}
.hcw-attach,
.hcw-send {
  border: none;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.hcw-attach {
  background: transparent;
  color: var(--hcw-text-muted);
}
.hcw-attach:hover:not(:disabled) { background: var(--hcw-overlay); }
.hcw-attach svg { width: 22px; height: 22px; }
.hcw-send {
  background: var(--hcw-primary);
  color: #fff;
}
.hcw-send:disabled,
.hcw-attach:disabled {
  opacity: 0.5;
  cursor: default;
}
.hcw-send svg { width: 18px; height: 18px; }

@media (max-width: 480px) {
  .hcw-panel {
    width: calc(100vw - 24px);
    height: calc(100vh - 100px);
    max-height: calc(100vh - 100px);
  }
}
`;
