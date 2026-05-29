/**
 * Browser entry — bundled to `dist/web.js`, served from the dashboard origin
 * as `/web-widget.js` and loaded via:
 *
 *   <script src="https://<YOUR_DASHBOARD_HOST>/web-widget.js" defer></script>
 *   <script>HeltarChat.initBubble({ businessId: 123, apiHost: 'https://app.heltar.com' });</script>
 */
import { registerWebComponents } from './register';
import { injectHeltarChatInWindow, parseHeltarChat } from './window';

registerWebComponents();

const api = parseHeltarChat();
injectHeltarChatInWindow(api);

export default api;
