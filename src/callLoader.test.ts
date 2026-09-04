import { describe, it } from 'node:test';
import assert from 'node:assert';

import { deriveCallBundleUrl } from './callLoader';

describe('deriveCallBundleUrl', () => {
  it('falls back to a root-relative call bundle when the script src is unknown', () => {
    assert.strictEqual(deriveCallBundleUrl(undefined), '/web-widget-call.js');
  });

  it('maps the dashboard-served bundle name and keeps its cache-busting query', () => {
    assert.strictEqual(
      deriveCallBundleUrl('https://app.heltar.com/web-widget.js'),
      'https://app.heltar.com/web-widget-call.js',
    );
    assert.strictEqual(
      deriveCallBundleUrl('https://app.heltar.com/web-widget.js?t=1725000000'),
      'https://app.heltar.com/web-widget-call.js?t=1725000000',
    );
  });

  it('maps the dist bundle name, carrying a query or fragment over', () => {
    assert.strictEqual(
      deriveCallBundleUrl('https://cdn.acme.com/widget/web.js'),
      'https://cdn.acme.com/widget/call.js',
    );
    assert.strictEqual(
      deriveCallBundleUrl('https://cdn.acme.com/widget/web.js#v3'),
      'https://cdn.acme.com/widget/call.js#v3',
    );
  });

  it('falls back to a same-directory sibling for any other filename', () => {
    assert.strictEqual(
      deriveCallBundleUrl('https://cdn.acme.com/vendor/myweb.js'),
      'https://cdn.acme.com/vendor/web-widget-call.js',
    );
    assert.strictEqual(
      deriveCallBundleUrl('https://cdn.acme.com/assets/heltar-chat.js?v=9'),
      'https://cdn.acme.com/assets/web-widget-call.js',
    );
  });
});
