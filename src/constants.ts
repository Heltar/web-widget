import type { BubbleProps, WidgetTheme } from './types';

/**
 * Defaults for `<heltar-chat-bubble>` props. solid-element merges these
 * with attributes the customer sets, so missing attributes don't throw.
 */
export const defaultTheme: Required<
  Pick<WidgetTheme, 'primaryColor' | 'placement' | 'mode'>
> &
  WidgetTheme = {
  primaryColor: '#008069',
  placement: 'right',
  mode: 'light',
};

export const defaultBubbleProps: BubbleProps = {
  businessId: 0,
  apiHost: '',
  theme: defaultTheme,
  // EVERY prop the component reads must be declared here (even as undefined):
  // solid-element only registers/forwards the keys present in this object, so
  // an omitted prop is never reactive and always reads as undefined in Bubble.
  //  - `visitor` / `autoShowDelay` — passed by the host at init.
  //  - `isOpen` — window.HeltarChat.open()/close() write to it.
  //  - `mode`   — the `mode` attribute / HeltarChat.setMode() write to it, so
  //    the host site can flip light/dark/system live.
  visitor: undefined,
  autoShowDelay: undefined,
  isOpen: undefined,
  mode: undefined,
  dynamicPrompt: undefined,
};

/** localStorage key prefix — all widget state is scoped under here so we
 *  can wipe it cleanly (e.g. on logout). */
export const STORAGE_PREFIX = 'heltar:web-widget';

/** Day-separator format labels. */
export const DAY_LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
} as const;
