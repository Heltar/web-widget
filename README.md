# @heltarchat/web-widget

Embeddable web chat widget for HeltarChat. Customers paste a single `<script>` on their site and visitors get an in-page chat that flows into the same inbox, AI agents and chatbots as WhatsApp / RCS.

## Architecture

- **Solid.js** component rendered inside a **Shadow DOM** Custom Element (`<heltar-chat-bubble>`) — full CSS isolation from the host page.
- **First-party `localStorage`** for visitor identity — a random id generated in the visitor's own browser. ITP / Brave safe: no iframe means no third-party storage.
- **No tokens, no login.** The only server-side gate is the **Origin allowlist** the business configures (see _Prerequisite_). The visitor's localStorage id doubles as their identity and their implicit secret — the same model as Typebot / Intercom-style public widgets.
- **Socket.io** for realtime delivery of agent / AI-agent replies, with the history endpoint as a fallback.

## How customers embed it

Your HeltarChat dashboard's _Web Chat Widget_ settings page generates this snippet **pre-filled** with your real values — copy it from there. The two hosts below are both **served by HeltarChat** (you host neither): `<YOUR_DASHBOARD_HOST>` is the dashboard that serves the script (e.g. `app.heltar.com`); `<YOUR_API_HOST>` is the HeltarChat API the widget calls (e.g. `api.heltar.com`) — usually a different host.

```html
<script src="https://<YOUR_DASHBOARD_HOST>/web-widget.js" defer></script>
<script>
  window.addEventListener('DOMContentLoaded', function () {
    HeltarChat.initBubble({
      businessId: 123,
      apiHost: 'https://<YOUR_API_HOST>',
      theme: {
        primaryColor: '#008069',
        headerTitle: 'Acme Support',
        headerSubtitle: 'We typically reply in 5 minutes',
        welcomeMessage: 'Hi! Ask us anything.',
        placement: 'right',
      },
    });
  });
</script>
```

Or as a declarative Custom Element:

```html
<heltar-chat-bubble
  business-id="123"
  api-host="https://<YOUR_API_HOST>"
></heltar-chat-bubble>
```

Imperative API (after `initBubble`):

```js
HeltarChat.open(); // expand the chat panel
HeltarChat.close(); // collapse
HeltarChat.unmount(); // remove the widget entirely
HeltarChat.setMode('dark'); // 'light' | 'dark' | 'system' — switch live
HeltarChat.setTheme({ primaryColor: '#7c3aed' }); // re-brand live
```

## Light / dark / system — follow your site's theme

The widget ships light, dark and system palettes. Set `mode` and it updates **live** — wire it to your own theme toggle so the chat always matches your page:

```js
// at init
HeltarChat.initBubble({ businessId: 123, mode: 'system' }); // follows the OS

// later, when YOUR theme toggles (manual switch):
HeltarChat.setMode(isDark ? 'dark' : 'light');
```

Declarative element users can flip the reflected attribute instead — the widget re-paints on change:

```js
document.querySelector('heltar-chat-bubble').setAttribute('mode', 'dark');
```

`'system'` follows the visitor's OS `prefers-color-scheme` and updates automatically when they switch. `theme.primaryColor` re-brands the bubble, header, send and reply buttons in either palette.

## Prerequisite

Before the snippet works on a domain, the business owner must add the origin(s) to **Settings → Web Chat Widget** (e.g. `https://acme.com`, `https://*.acme.com`). Requests from non-allowlisted origins are rejected with 403. No keys or tokens to manage — the origin allowlist is the only setup.

## Build from source & self-host

The widget normally loads from your Heltar dashboard at `/web-widget.js`. If you'd rather **vendor the bundle yourself** — serve it from your own static host / CDN, pin a specific build, or bundle it into your app's assets — build it from this repo:

```bash
git clone https://github.com/Heltar/web-widget.git
cd web-widget
npm install
npm run build      # → dist/web.js  (a self-contained IIFE)
```

Then host `dist/web.js` wherever you like and load it on your page:

```html
<script src="https://your-cdn.example/web.js" defer></script>
<script>
  HeltarChat.initBubble({
    businessId: 123,
    apiHost: 'https://<YOUR_API_HOST>', // still points at Heltar's API
    mode: 'system',
  });
</script>
```

Self-hosting only changes **where the script is served from** — it does not change how auth works:

- `apiHost` must still point at the **Heltar API** — that's where the widget's REST + Socket.io calls go (not your CDN).
- The **origin allowlist still applies**: the origin of the _page the widget runs on_ must be added under **Settings → Web Chat Widget**, no matter where you host the bundle from.

There's nothing to publish or version — `dist/web.js` is the whole product. Re-run `npm run build` to pick up a new release of this repo.

## Development

```bash
npm install
npm run build       # one-shot → dist/web.js
npm run dev         # watch mode (rebuilds on change)
npm run type-check

# then open demo/index.html in a browser to try it locally
```

`dist/web.js` is a self-contained IIFE that auto-attaches to `window.HeltarChat`. Inside the Heltar dashboard monorepo it's copied to the frontend's `public/web-widget.js` and served from the dashboard origin. The widget ships only as this script bundle — it is not published to npm.

## Public API

### `BubbleProps`

| Prop                      | Type                            | Required | Notes                                                                                                                                                                                 |
| ------------------------- | ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `businessId`              | `number`                        | ✅       | The integer shown in widget settings                                                                                                                                                  |
| `apiHost`                 | `string`                        | optional | Base URL of HeltarChat API. Omit when widget is served from the same origin                                                                                                           |
| `mode`                    | `'light' \| 'dark' \| 'system'` | optional | Colour scheme — reflected attribute, settable live via `setMode`. `system` follows the OS. Default `'light'`                                                                          |
| `autoShowDelay`           | `number (ms)`                   | optional | Auto-open the bubble N ms after page-load                                                                                                                                             |
| `dynamicPrompt`           | `string`                        | optional | Per-visitor context appended to your chatbot's system prompt on every AI reply. Set from your app; framed as background info, not overriding instructions                             |
| `visitor.id`              | `string`                        | optional | Identify the visitor from your own auth (phone, user id) — same conversation across their devices                                                                                     |
| `visitor.name`            | `string`                        | optional | Display name shown to agents in the inbox                                                                                                                                             |
| `theme.primaryColor`      | `string`                        | optional | Brand colour (bubble, header, send + reply buttons). Default `#008069`                                                                                                                |
| `theme.headerTitle`       | `string`                        | optional | Chat header title. Default: `Chat`                                                                                                                                                    |
| `theme.headerSubtitle`    | `string`                        | optional |                                                                                                                                                                                       |
| `theme.avatarUrl`         | `string`                        | optional | Square ~40px image                                                                                                                                                                    |
| `theme.welcomeMessage`    | `string`                        | optional | Shown when there's no prior history                                                                                                                                                   |
| `theme.placement`         | `'left' \| 'right'`             | optional | Default `'right'`                                                                                                                                                                     |
| `theme.width`             | `number \| string`              | optional | Chat panel width — number → px, or any CSS length. Default `380px`                                                                                                                    |
| `theme.height`            | `number \| string`              | optional | Chat panel height — number → px, or any CSS length. Default `620px`                                                                                                                   |
| `theme.launcherSize`      | `number \| string`              | optional | Floating bubble button size. Default `56px`                                                                                                                                           |
| `theme.launcherIconUrl`   | `string`                        | optional | Custom image on the launcher button (replaces the default chat icon)                                                                                                                  |
| `theme.launcherHtml`      | `string`                        | optional | Your launcher's HTML **and** CSS in one field — markup + an optional `<style>` tag (restyle the bubble, `:hover`, the panel, any `--hcw-*` var / `.hcw-*` rule; scoped to the widget) |
| `theme.headerColor`       | `string`                        | optional | Chat header background. Defaults to `primaryColor`                                                                                                                                    |
| `theme.headerTextColor`   | `string`                        | optional | Header title / subtitle / close-icon colour. Default white                                                                                                                            |
| `theme.footerColor`       | `string`                        | optional | Composer (footer) bar background                                                                                                                                                      |
| `theme.backgroundColor`   | `string`                        | optional | Chat message-area background                                                                                                                                                          |
| `theme.incomingColor`     | `string`                        | optional | Visitor's own (right-side) bubble colour                                                                                                                                              |
| `theme.incomingTextColor` | `string`                        | optional | Text colour in the visitor's (right) bubbles                                                                                                                                          |
| `theme.outgoingColor`     | `string`                        | optional | Your / the bot's (left-side) bubble colour                                                                                                                                            |
| `theme.outgoingTextColor` | `string`                        | optional | Text colour in the bot's (left) bubbles                                                                                                                                               |

On phones the panel opens as a full-screen sheet sized to the visible viewport (keyboard-aware); `width`/`height` apply on tablets and up. `launcherHtml` is a single field holding the bubble's HTML **and** CSS — your markup plus an optional `<style>` tag that, being inside the widget's Shadow DOM, can restyle the bubble shell, hover states, the panel, or any `--hcw-*` var — things inline styles can't do.
