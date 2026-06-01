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
 * touching this file. Brand-derived shades (hover/active/gradient/soft tints)
 * use `color-mix(in srgb, var(--hcw-primary) …)` so they follow that inline
 * colour for free; each one is preceded by a flat fallback declaration so a
 * browser without `color-mix` degrades to the solid brand colour.
 *
 * Responsiveness: desktop/tablet keep the floating card; phones
 * (`@media (max-width: 480px)`) get a full-screen sheet sized with `100dvh`
 * and corrected for the on-screen keyboard via the `--hcw-vvh` /
 * `--hcw-vv-offset-top` vars that Bubble.tsx writes from `window.visualViewport`.
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
  --hcw-shadow: 0 16px 48px rgba(0, 0, 0, 0.55), 0 4px 14px rgba(0, 0, 0, 0.4);
  --hcw-error-bg: #3a1f1f;
  --hcw-error-text: #ff8a80;
  --hcw-error-border: #5a2a2a;
  /* elevation + brand-derived (dark halves of the token scale) */
  --hcw-shadow-1: 0 1px 2px rgba(0, 0, 0, 0.4);
  --hcw-launcher-shadow: 0 6px 16px rgba(0, 0, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.4);
  --hcw-launcher-shadow-hover: 0 10px 28px rgba(0, 0, 0, 0.6), 0 3px 8px rgba(0, 0, 0, 0.45);
  --hcw-header-grad-to: color-mix(in srgb, var(--hcw-header-bg, var(--hcw-primary)) 78%, #000 22%);
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
  --hcw-shadow: 0 12px 32px rgba(11, 20, 26, 0.16), 0 4px 12px rgba(11, 20, 26, 0.1);
  --hcw-error-bg: #fff0f0;
  --hcw-error-text: #b00020;
  --hcw-error-border: #ffd0d0;

  /* ---- shared token scale (light values; dark overrides above) ---- */
  /* radii */
  --hcw-radius-sm: 8px;
  --hcw-radius-md: 12px;
  --hcw-radius-lg: 18px;
  --hcw-radius-pill: 999px;
  /* elevation (light) */
  --hcw-shadow-1: 0 1px 2px rgba(11, 20, 26, 0.1);
  --hcw-launcher-shadow: 0 6px 16px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(0, 0, 0, 0.12);
  --hcw-launcher-shadow-hover: 0 10px 28px rgba(0, 0, 0, 0.22), 0 3px 8px rgba(0, 0, 0, 0.14);
  /* brand-derived (light; dark half overridden in darkTokens). Hover/active/
     soft tints are NOT tokens: a color-mix stored in a custom property and
     read via var() turns into the INITIAL value (transparent) on a browser
     without color-mix — instead of falling back — so those are written inline
     at the point of use after a flat fallback declaration (see .hcw-send,
     .hcw-empty). --hcw-header-grad-to is safe as a token because it feeds
     background-IMAGE, a different property from the flat background-color. */
  --hcw-on-primary: #ffffff;
  --hcw-header-grad-to: color-mix(in srgb, var(--hcw-header-bg, var(--hcw-primary)) 86%, #000 14%);
  /* motion */
  --hcw-ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --hcw-ease-spring: cubic-bezier(0.34, 1.4, 0.64, 1);
  /* keyboard-corrected sheet vars, written by the visualViewport JS on mobile
     while open. --hcw-vv-offset-top defaults to 0px; --hcw-vvh is intentionally
     NOT defaulted here so its consumer falls back to 100vh (upgraded to 100dvh
     under @supports) until JS sets a concrete px value. */
  --hcw-vv-offset-top: 0px;

  position: fixed;
  bottom: var(--hcw-offset-bottom, 20px);
  z-index: 2147483640;
  color: var(--hcw-text);

  /* Lightweight host-bleed protection — guards against a host page that resets
     box-sizing / line-height:0 / dir=rtl reaching into the shadow tree. Kept a
     minimal subset (NOT all:initial on :host, which would wipe the inherited
     font + the .hcw-root colour contract). */
  box-sizing: border-box;
  line-height: normal;
  direction: ltr;
  text-align: left;
}
/* Forced dark mode */
.hcw-root.hcw-theme-dark {${darkTokens}}
/* System mode — follow the visitor's OS / browser preference */
@media (prefers-color-scheme: dark) {
  .hcw-root.hcw-theme-system {${darkTokens}}
}

.hcw-root.hcw-right { right: var(--hcw-offset-side, 20px); }
.hcw-root.hcw-left { left: var(--hcw-offset-side, 20px); }

.hcw-bubble-btn {
  position: relative;
  width: var(--hcw-launcher-size, 56px);
  height: var(--hcw-launcher-size, 56px);
  border-radius: var(--hcw-radius-lg);
  background: var(--hcw-primary);
  background-image: linear-gradient(180deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0) 45%);
  color: var(--hcw-on-primary);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--hcw-launcher-shadow);
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 220ms var(--hcw-ease-spring),
    box-shadow 220ms var(--hcw-ease-out),
    opacity 200ms var(--hcw-ease-out);
}
.hcw-bubble-btn:hover {
  transform: translateY(-2px) scale(1.04);
  box-shadow: var(--hcw-launcher-shadow-hover);
}
.hcw-bubble-btn:active { transform: translateY(0) scale(0.94); }
.hcw-bubble-btn:focus-visible {
  outline: none;
  box-shadow:
    var(--hcw-launcher-shadow-hover),
    0 0 0 3px color-mix(in srgb, var(--hcw-primary) 35%, transparent);
}
.hcw-bubble-btn svg {
  width: 28px;
  height: 28px;
  transition: transform 220ms var(--hcw-ease-out);
}
.hcw-root.hcw-open .hcw-bubble-btn svg { transform: rotate(90deg); }
/* Custom launcher icon (theme.launcherIconUrl) — sized to the SVG glyph. */
.hcw-bubble-icon {
  width: 60%;
  height: 60%;
  object-fit: contain;
  border-radius: 6px;
}
/* Custom launcher markup (theme.launcherHtml) — fills + centers within the
   button; include a <style> tag inside launcherHtml to restyle freely. */
.hcw-bubble-html {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

/* When the embedder supplies theme.launcherHtml, the button shell steps aside
   completely — no default circle, colour, size, shadow, hover or icon sizing —
   so the author's markup IS the launcher (styled fully by its own markup +
   inline <style>). Mutually exclusive with launcherIconUrl / launcherSize /
   the bubble colour, which only dress the default shell. */
.hcw-bubble-btn.hcw-bubble-custom {
  width: auto;
  height: auto;
  min-width: 0;
  min-height: 0;
  padding: 0;
  background: none;
  background-image: none;
  border-radius: 0;
  box-shadow: none;
  color: inherit;
}
.hcw-bubble-btn.hcw-bubble-custom:hover,
.hcw-bubble-btn.hcw-bubble-custom:active {
  transform: none;
  box-shadow: none;
}
.hcw-bubble-btn.hcw-bubble-custom:focus-visible {
  outline: 2px solid var(--hcw-primary);
  outline-offset: 3px;
  box-shadow: none;
}
.hcw-bubble-custom .hcw-bubble-html { width: auto; height: auto; }
/* Don't force the default 28px glyph size / open-rotate onto authored SVGs. */
.hcw-bubble-custom svg { width: auto; height: auto; transition: none; }
.hcw-root.hcw-open .hcw-bubble-custom svg { transform: none; }

.hcw-panel {
  position: absolute;
  bottom: calc(var(--hcw-launcher-size, 56px) + var(--hcw-panel-gap, 4px));
  width: var(--hcw-panel-width, 380px);
  height: var(--hcw-panel-height, 620px);
  max-width: calc(100vw - 40px);
  max-height: min(var(--hcw-panel-height, 620px), calc(100vh - 100px));
  border-radius: var(--hcw-radius-lg);
  background: var(--hcw-surface);
  box-shadow: var(--hcw-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overscroll-behavior: contain;
  transform-origin: bottom right;
  transition:
    transform 260ms var(--hcw-ease-out),
    opacity 200ms var(--hcw-ease-out),
    visibility 0s;
}
.hcw-root.hcw-left .hcw-panel {
  transform-origin: bottom left;
  left: 0;
}
.hcw-root.hcw-right .hcw-panel { right: 0; }
.hcw-panel.hcw-closed {
  transform: translate3d(0, 8px, 0) scale(0.96);
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition:
    transform 200ms var(--hcw-ease-out),
    opacity 150ms var(--hcw-ease-out),
    visibility 0s 200ms;
}

.hcw-header {
  background: var(--hcw-header-bg, var(--hcw-primary));
  background-image: linear-gradient(135deg, var(--hcw-header-bg, var(--hcw-primary)), var(--hcw-header-grad-to));
  color: var(--hcw-header-text, var(--hcw-on-primary));
  padding: 13px 14px 13px 16px;
  display: flex;
  align-items: center;
  gap: 11px;
  position: relative;
  z-index: 1;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.08);
}
.hcw-header-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
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
  background: none;
  border: none;
  color: var(--hcw-header-text, var(--hcw-on-primary));
  cursor: pointer;
  width: 34px;
  height: 34px;
  padding: 0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.9;
  transition: background 140ms var(--hcw-ease-out), opacity 140ms var(--hcw-ease-out);
}
.hcw-header-close:hover { opacity: 1; background: rgba(255, 255, 255, 0.16); }
.hcw-header-close:active { background: rgba(255, 255, 255, 0.24); }
.hcw-header-close svg { width: 20px; height: 20px; }

.hcw-messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px 14px 16px;
  background: var(--hcw-chat-bg);
  display: flex;
  flex-direction: column;
  gap: 2px;
  scrollbar-width: thin;
  scroll-behavior: smooth;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
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
  margin-bottom: 6px;
  animation: hcw-fade-in 200ms var(--hcw-ease-out);
}
.hcw-msg-row-in { align-items: flex-end; }
.hcw-msg-row-out { align-items: flex-start; }

@keyframes hcw-fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hcw-msg {
  max-width: 82%;
  padding: 7px 11px 6px 11px;
  border-radius: var(--hcw-radius-md);
  word-wrap: break-word;
  white-space: pre-wrap;
  font-size: 14.5px;
  line-height: 1.4;
  position: relative;
  box-shadow: var(--hcw-shadow-1);
}
/* Visitor's own message (direction === 'in' server-side) — right, green.
   Squared bottom-right corner = the WhatsApp tail silhouette, no SVG tail. */
.hcw-msg-in {
  background: var(--hcw-msg-in-bg);
  color: var(--hcw-msg-in-text);
  border-bottom-right-radius: 4px;
}
/* Business reply (direction === 'out' server-side) — left, white */
.hcw-msg-out {
  background: var(--hcw-msg-out-bg);
  color: var(--hcw-msg-out-text);
  border-bottom-left-radius: 4px;
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
  border-color: color-mix(in srgb, var(--hcw-primary) 35%, var(--hcw-border));
  border-radius: var(--hcw-radius-pill);
  padding: 9px 14px;
  font-family: inherit;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: var(--hcw-shadow-1);
  transition:
    background 140ms var(--hcw-ease-out),
    transform 140ms var(--hcw-ease-spring),
    border-color 140ms var(--hcw-ease-out);
}
.hcw-reply-btn:hover:not(:disabled) {
  background: var(--hcw-reply-btn-hover);
  border-color: var(--hcw-primary);
  transform: translateY(-1px);
}
.hcw-reply-btn:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
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
  border-radius: var(--hcw-radius-sm);
  display: block;
  object-fit: cover;
}
.hcw-media-video {
  width: 100%;
  max-height: 280px;
  border-radius: var(--hcw-radius-sm);
  background: #000;
}
.hcw-media-audio { width: 100%; }
.hcw-media-doc {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--hcw-overlay);
  border-radius: var(--hcw-radius-sm);
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
  border-radius: var(--hcw-radius-md);
  border-bottom-left-radius: 4px;
  display: inline-flex;
  gap: 4px;
  box-shadow: var(--hcw-shadow-1);
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
  color: var(--hcw-text);
  font-size: 13.5px;
  max-width: 85%;
  line-height: 1.5;
  padding: 14px 18px;
  /* Flat fallback first, then the brand tint inline (mixed over the surface so
     it's theme-correct in both palettes). A no-color-mix browser drops the
     second line at parse time and keeps the solid surface. */
  background: var(--hcw-surface-2);
  background: color-mix(in srgb, var(--hcw-primary) 14%, var(--hcw-surface));
  border-radius: var(--hcw-radius-md);
  box-shadow: var(--hcw-shadow-1);
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
  align-items: flex-end;
  gap: 6px;
  padding: 9px 10px;
  background: var(--hcw-composer-bg, var(--hcw-surface-2));
  border-top: 1px solid var(--hcw-border);
}
/* Staged attachment preview (above the composer, before sending). */
.hcw-staged {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--hcw-composer-bg, var(--hcw-surface-2));
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
  min-height: 40px;
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
  transition: border-color 120ms ease, box-shadow 140ms var(--hcw-ease-out);
}
.hcw-text-input:focus {
  border-color: var(--hcw-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--hcw-primary) 14%, transparent);
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
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  transition:
    transform 160ms var(--hcw-ease-spring),
    background 140ms var(--hcw-ease-out),
    opacity 140ms var(--hcw-ease-out);
}
.hcw-attach {
  background: transparent;
  color: var(--hcw-text-muted);
}
.hcw-attach:hover:not(:disabled) { background: var(--hcw-overlay); }
.hcw-attach:active:not(:disabled) { transform: scale(0.9); }
.hcw-attach svg { width: 22px; height: 22px; }
.hcw-send {
  background: var(--hcw-primary);
  color: var(--hcw-on-primary);
  box-shadow: 0 2px 6px color-mix(in srgb, var(--hcw-primary) 35%, transparent);
}
.hcw-send:hover:not(:disabled) {
  background: var(--hcw-primary);
  background: color-mix(in srgb, var(--hcw-primary) 88%, #000);
  transform: translateY(-1px) scale(1.05);
  box-shadow: 0 4px 12px color-mix(in srgb, var(--hcw-primary) 42%, transparent);
}
.hcw-send:active:not(:disabled) {
  transform: scale(0.92);
  background: var(--hcw-primary);
  background: color-mix(in srgb, var(--hcw-primary) 80%, #000);
}
.hcw-send:disabled {
  background: var(--hcw-overlay-strong);
  color: var(--hcw-text-muted);
  box-shadow: none;
}
.hcw-send:disabled,
.hcw-attach:disabled {
  opacity: 0.5;
  cursor: default;
}
.hcw-send svg { width: 18px; height: 18px; }

/* Touch devices — floor interactive controls at the 44px WCAG/HIG target.
   Keyed off the input device (pointer:coarse) not the viewport, so mouse
   desktops stay compact and touch laptops benefit. */
@media (pointer: coarse) {
  .hcw-attach, .hcw-send { width: 44px; height: 44px; }
  .hcw-header-close { width: 44px; height: 44px; }
  .hcw-staged-cancel { width: 44px; height: 44px; }
}

/* ---- Phones: full-screen sheet ----
   The floating card (calc(100vw-24px)/100vh) breaks under the soft keyboard;
   a true full-screen sheet sized to the visual viewport is the only layout
   that survives it.

   The sheet is anchored to .hcw-root (already position:fixed and, crucially,
   free of any transform/filter/contain) — NOT re-fixed on the panel itself.
   A position:fixed element resolves against the nearest ancestor that
   establishes a containing block, and the Shadow DOM does NOT shield against a
   transformed/contained LIGHT-DOM ancestor of the host element (a very common
   "#app { transform }" GPU wrapper) — so a fixed panel could be clipped/offset
   off-viewport on real host pages. Keeping the panel position:absolute inside
   the untransformed fixed root inherits the root's viewport anchoring and is
   immune to that. The root is made the full-screen surface (sized by the same
   --hcw-vvh/--hcw-vv-offset-top the keyboard JS writes) and pointer-events:none
   so the host page stays click-through everywhere the widget isn't actually
   drawing UI; the launcher + panel re-enable pointer-events. */
@media (max-width: 480px) {
  .hcw-root {
    inset: var(--hcw-vv-offset-top, 0px) 0 auto 0;
    width: auto;
    /* visualViewport height when JS sets --hcw-vvh (px; also corrects for the
       keyboard); else 100vh — a UNIVERSALLY-valid fallback so a browser without
       dvh doesn't hit invalid-at-computed-value-time (a var() whose fallback
       is an unknown unit collapses to height:auto, it does NOT roll back to a
       prior declaration). The closed/idle state is upgraded to the address-bar-
       correct 100dvh via the @supports block just below the @media. */
    height: var(--hcw-vvh, 100vh);
    pointer-events: none;
  }
  /* Beat the desktop .hcw-right/.hcw-left { right/left: 20px } (higher
     specificity) so the surface is edge-to-edge. */
  .hcw-root.hcw-left,
  .hcw-root.hcw-right { left: 0; right: 0; }

  /* Launcher stays in its corner within the now-full-screen root. */
  .hcw-bubble-btn {
    position: absolute;
    bottom: var(--hcw-offset-bottom, 20px);
    pointer-events: auto;
  }
  .hcw-root.hcw-right .hcw-bubble-btn {
    right: var(--hcw-offset-side, 20px);
    left: auto;
  }
  .hcw-root.hcw-left .hcw-bubble-btn {
    left: var(--hcw-offset-side, 20px);
    right: auto;
  }

  /* Panel fills the root. absolute (not fixed) → inherits the root's
     viewport-relative anchoring; insets size it so a classic scrollbar gutter
     can't cause a 100vw horizontal bleed. */
  .hcw-panel {
    position: absolute;
    inset: 0;
    width: auto;
    height: auto;
    max-width: none;
    max-height: none;
    border-radius: 0;
    pointer-events: auto;
  }
  .hcw-root.hcw-left .hcw-panel,
  .hcw-root.hcw-right .hcw-panel { left: 0; right: 0; }

  /* Slide up/down instead of corner-scale (origin-independent translate). */
  .hcw-panel.hcw-closed { transform: translate3d(0, 100%, 0); opacity: 1; }

  /* Safe-area insets — resolve to 0 on host pages without viewport-fit=cover
     (which the widget can't set), so non-notched / non-cover pages are
     identical to before. */
  .hcw-header   { padding-top: calc(13px + env(safe-area-inset-top, 0px)); }
  .hcw-composer { padding-bottom: calc(9px + env(safe-area-inset-bottom, 0px)); }
  .hcw-messages {
    padding-left: calc(14px + env(safe-area-inset-left, 0px));
    padding-right: calc(14px + env(safe-area-inset-right, 0px));
    /* The keyboard-open handler snaps scrollTop=scrollHeight; smooth would
       animate (lag) that on iOS. Instant snap is the mobile-chat norm. */
    scroll-behavior: auto;
  }

  /* iOS won't auto-zoom an input at >=16px on focus. */
  .hcw-text-input { font-size: 16px; }

  /* A floating launcher over a full-screen sheet is clutter — hide while open. */
  .hcw-root.hcw-open .hcw-bubble-btn { display: none; }

  .hcw-msg { max-width: 86%; }
}

/* Upgrade the phone sheet's idle (closed / pre-JS) height from 100vh to the
   address-bar-correct 100dvh where supported. Kept in its own @supports so a
   browser WITHOUT dvh never parses 100dvh inside a var() fallback (which
   would be invalid-at-computed-value-time → height:auto, collapsing the root).
   When open, the JS-set --hcw-vvh (px) wins in both branches. */
@supports (height: 100dvh) {
  @media (max-width: 480px) {
    .hcw-root { height: var(--hcw-vvh, 100dvh); }
  }
}

/* Respect a visitor's reduced-motion preference — kill animation AND
   transition (not just animation) so the scale/slide tweens don't play, while
   keeping open/close functional via opacity + visibility + the inert attr. */
@media (prefers-reduced-motion: reduce) {
  .hcw-bubble-btn, .hcw-bubble-btn svg, .hcw-panel, .hcw-msg-row,
  .hcw-typing, .hcw-reply-btn, .hcw-send, .hcw-attach, .hcw-text-input {
    animation: none !important;
    transition-duration: 0.01ms !important;
  }
  .hcw-dot { animation: none !important; opacity: 0.6 !important; }
  .hcw-messages { scroll-behavior: auto !important; }
  .hcw-panel { transition: opacity 0.01ms !important; }
  .hcw-panel.hcw-closed { transform: none !important; opacity: 0; visibility: hidden; }
}

/* Forced-colors / Windows High Contrast: box-shadow is not rendered, so the
   launcher + textarea (which set outline:none and rely on a box-shadow ring)
   would have NO visible focus indicator. Restore a real outline for keyboard
   users; the system palette overrides the colour. */
@media (forced-colors: active) {
  .hcw-bubble-btn:focus-visible,
  .hcw-text-input:focus-visible,
  .hcw-header-close:focus-visible,
  .hcw-send:focus-visible,
  .hcw-attach:focus-visible,
  .hcw-reply-btn:focus-visible {
    outline: 2px solid CanvasText;
    outline-offset: 2px;
  }
}
`;
