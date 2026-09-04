// Lazy loader for the voice-call runtime: livekit-client ships as a sibling
// bundle (dist/call.js → /web-widget-call.js) script-injected on the first
// call, which assigns window.__heltarWidgetCall.

/** The surface the call bundle exposes on `window.__heltarWidgetCall`. */
export interface WidgetCallSession {
  mute: (muted: boolean) => Promise<void>;
  /** Hang up and release the mic + remote audio. Idempotent. */
  end: () => Promise<void>;
}

export interface WidgetCallRuntime {
  start: (args: {
    voiceUrl: string;
    token: string;
    /** Fired once when someone picks up — the voice bot joins, or an inbox
     *  agent accepts the ringing call. Until then the call is "ringing". */
    onAnswered: () => void;
    /** Fired exactly once when the call is over — remote hangup, agent left,
     *  network drop, or a local `end()`. */
    onEnded: () => void;
  }) => Promise<WidgetCallSession>;
}

type WindowWithCallRuntime = Window & {
  __heltarWidgetCall?: WidgetCallRuntime;
};

// document.currentScript is only set while web.js itself executes — read it
// at module-eval time (typeof guard: the unit test imports this under node).
const widgetScriptSrc =
  typeof document === 'undefined'
    ? undefined
    : (document.currentScript as HTMLScriptElement | null)?.src || undefined;

/** Sibling call bundle for a widget-bundle URL: web.js → call.js,
 *  web-widget.js → web-widget-call.js (query/fragment carried over so a
 *  versioned main bundle never pairs with a stale cached call bundle);
 *  anything else → same-directory web-widget-call.js. */
export const deriveCallBundleUrl = (src: string | undefined): string => {
  const sibling = src?.replace(
    /\/(web-widget|web)\.js(?=[?#]|$)/,
    (_, name: string) => (name === 'web' ? '/call.js' : '/web-widget-call.js'),
  );
  if (sibling && sibling !== src) return sibling;
  try {
    return new URL('web-widget-call.js', src).toString();
  } catch {
    return '/web-widget-call.js';
  }
};

let runtimePromise: Promise<WidgetCallRuntime> | undefined;

export const loadCallRuntime = (): Promise<WidgetCallRuntime> => {
  const existing = (window as WindowWithCallRuntime).__heltarWidgetCall;
  if (existing) return Promise.resolve(existing);
  if (!runtimePromise) {
    runtimePromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = deriveCallBundleUrl(widgetScriptSrc);
      script.async = true;
      script.onload = () => {
        const runtime = (window as WindowWithCallRuntime).__heltarWidgetCall;
        if (runtime) resolve(runtime);
        else {
          runtimePromise = undefined;
          reject(new Error('call runtime did not register'));
        }
      };
      script.onerror = () => {
        // Reset so a transient network failure can be retried on next tap.
        runtimePromise = undefined;
        reject(new Error('failed to load call runtime'));
      };
      document.head.appendChild(script);
    });
  }
  return runtimePromise;
};
