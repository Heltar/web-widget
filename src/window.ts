import type { BubbleProps, WidgetTheme } from './types';

/**
 * Imperative API exposed on `window.HeltarChat`. Mirrors the Custom-Element
 * surface so customers can pick whichever ergonomics suit their stack:
 *
 *   // declarative
 *   <heltar-chat-bubble business-id="1" api-host="..."></heltar-chat-bubble>
 *
 *   // imperative
 *   window.HeltarChat.initBubble({ businessId: 1, apiHost: '...' });
 *
 * Both end up rendering the same Solid component inside a Shadow DOM.
 */

const ELEMENT_TAG = 'heltar-chat-bubble';

export const initBubble = (props: BubbleProps): HTMLElement => {
  const existing = document.querySelector(ELEMENT_TAG) as HTMLElement | null;
  const el = existing ?? document.createElement(ELEMENT_TAG);
  Object.assign(el, props);
  if (!existing) document.body.appendChild(el);
  return el;
};

const findElement = (): HTMLElement | null =>
  document.querySelector(ELEMENT_TAG);

// Reset to the `undefined` "no command" sentinel before each set so the
// command always re-fires the widget's effect — even when the visitor has
// since toggled the panel by hand (which leaves the last prop value stale and
// would otherwise make a repeated open()/close() a no-op).
export const open = (): void => {
  const el = findElement() as (HTMLElement & { isOpen?: boolean }) | null;
  if (!el) return;
  el.isOpen = undefined;
  el.isOpen = true;
};

export const close = (): void => {
  const el = findElement() as (HTMLElement & { isOpen?: boolean }) | null;
  if (!el) return;
  el.isOpen = undefined;
  el.isOpen = false;
};

export const unmount = (): void => {
  findElement()?.remove();
};

/**
 * Switch the colour scheme live. Bind this to your site's theme toggle so the
 * widget follows your app — e.g. `HeltarChat.setMode(isDark ? 'dark' : 'light')`.
 * `'system'` follows the visitor's OS preference. Reactive: the widget
 * re-paints immediately, no re-init.
 */
export const setMode = (mode: 'light' | 'dark' | 'system'): void => {
  const el = findElement() as (HTMLElement & { mode?: string }) | null;
  if (el) el.mode = mode;
};

/**
 * Merge theme overrides (colours, header text, mode, …) into the running
 * widget. Reassigns a fresh object so the Custom Element's reactive prop
 * fires. `HeltarChat.setTheme({ primaryColor: '#7c3aed' })`.
 */
export const setTheme = (theme: Partial<WidgetTheme>): void => {
  const el = findElement() as (HTMLElement & { theme?: WidgetTheme }) | null;
  if (el) el.theme = { ...el.theme, ...theme };
};

export const parseHeltarChat = () => ({
  initBubble,
  open,
  close,
  unmount,
  setMode,
  setTheme,
});

type HeltarChat = ReturnType<typeof parseHeltarChat>;

declare global {
  interface Window {
    HeltarChat?: HeltarChat;
  }
}

export const injectHeltarChatInWindow = (api: HeltarChat): void => {
  if (typeof window === 'undefined') return;
  window.HeltarChat = { ...api };
};
