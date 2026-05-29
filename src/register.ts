import { customElement } from 'solid-element';

import { Bubble } from './components/Bubble';
import { defaultBubbleProps } from './constants';

/**
 * Register `<heltar-chat-bubble>` as a Custom Element. Once registered,
 * customers can use it declaratively (`<heltar-chat-bubble business-id="1" />`)
 * or imperatively via `window.HeltarChat.initBubble({...})`.
 *
 * solid-element handles:
 *   - Shadow DOM creation (CSS isolation)
 *   - Property ↔ attribute mapping (kebab-cased)
 *   - Reactive prop forwarding to the Solid component
 */
export const registerWebComponents = (): void => {
  if (typeof window === 'undefined') return;
  if (window.customElements.get('heltar-chat-bubble')) return; // idempotent
  customElement('heltar-chat-bubble', defaultBubbleProps, Bubble);
};
