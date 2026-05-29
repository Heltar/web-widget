/* eslint-disable */
const esbuild = require('esbuild');
const { solidPlugin } = require('esbuild-plugin-solid');
const fs = require('fs');
const path = require('path');
const { version } = require('./package.json');

const watch = process.argv.includes('--watch');
const banner = { js: `/* @heltarchat/web-widget v${version} */` };

// In watch (dev) mode, mirror the freshly built IIFE into the dashboard's
// public dir after every rebuild so `pnpm dev` always serves a current
// /web-widget.js. The production build copies it via the frontend
// `widget:bundle` script instead, so this only runs while watching.
const FRONTEND_PUBLIC = path.resolve(
  __dirname,
  '../../frontend/public/web-widget.js',
);
const mirrorToFrontend = {
  name: 'mirror-to-frontend-public',
  setup(build) {
    build.onEnd(result => {
      if (result.errors.length) return;
      try {
        fs.copyFileSync(
          path.resolve(__dirname, 'dist/web.js'),
          FRONTEND_PUBLIC,
        );
        console.log('[web-widget] → frontend/public/web-widget.js');
      } catch (err) {
        console.error('[web-widget] mirror failed:', err.message);
      }
    });
  },
};

/**
 * Single output: `dist/web.js` — a self-contained IIFE that injects
 * `window.HeltarChat` and registers `<heltar-chat-bubble>`. It's copied to the
 * dashboard's `public/web-widget.js` and loaded via
 * `<script src="…/web-widget.js">`. The widget is consumed only this way
 * (script tag / custom element) — it is NOT published to npm.
 */

const common = {
  bundle: true,
  minify: !watch,
  sourcemap: watch ? 'inline' : 'linked',
  target: ['es2020'],
  platform: 'browser',
  banner,
  plugins: [solidPlugin()],
  // Inline CSS lives in src/styles.ts as a JS string — no external CSS
  // bundling needed, so postcss / tailwind toolchains are skipped.
  loader: {
    '.svg': 'text',
  },
  logLevel: 'info',
};

const browserBuild = {
  ...common,
  entryPoints: { web: 'src/web.ts' },
  outdir: 'dist',
  format: 'iife',
  globalName: '__heltarchatWidget',
  // Footer pops the registered module onto window for the script-tag use case
  // (Typebot does the same via injectTypebotInWindow but inside the bundle).
  plugins: watch ? [...common.plugins, mirrorToFrontend] : common.plugins,
};

async function run() {
  if (watch) {
    const ctx = await esbuild.context(browserBuild);
    await ctx.watch();
    console.log('[web-widget] watching for changes…');
    return;
  }
  await esbuild.build(browserBuild);
  console.log('[web-widget] build complete →', 'dist/web.js');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
