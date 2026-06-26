/* eslint-disable */
const esbuild = require('esbuild');
const { solidPlugin } = require('esbuild-plugin-solid');
const fs = require('fs');
const path = require('path');
const { version } = require('./package.json');

const watch = process.argv.includes('--watch');
const banner = { js: `/* @heltarchat/web-widget v${version} */` };

// In watch (dev) mode, mirror the freshly built bundle into the dashboard's
// public dir after every rebuild so `pnpm dev` always serves a current
// /web-widget.js. The production build copies it via the frontend
// `widget:bundle` script instead, so this only runs while watching.
const mirror = (distFile, publicName) => ({
  name: `mirror-${publicName}`,
  setup(build) {
    build.onEnd(result => {
      if (result.errors.length) return;
      try {
        fs.copyFileSync(
          path.resolve(__dirname, distFile),
          path.resolve(__dirname, '../../frontend/public', publicName),
        );
        console.log(`[web-widget] → frontend/public/${publicName}`);
      } catch (err) {
        console.error(`[web-widget] mirror ${publicName} failed:`, err.message);
      }
    });
  },
});

/**
 * A self-contained IIFE served from the dashboard origin and loaded via
 * <script src="…/web-widget.js"> — the visitor chat bubble (Solid). Not
 * published to npm. (The agent embed loader lives in the sibling
 * `public/embed-chat` package.)
 */

const browserBuild = {
  bundle: true,
  minify: !watch,
  sourcemap: watch ? 'inline' : 'linked',
  target: ['es2020'],
  platform: 'browser',
  logLevel: 'info',
  banner,
  entryPoints: { web: 'src/web.ts' },
  outdir: 'dist',
  format: 'iife',
  globalName: '__heltarchatWidget',
  loader: { '.svg': 'text' },
  plugins: watch
    ? [solidPlugin(), mirror('dist/web.js', 'web-widget.js')]
    : [solidPlugin()],
};

async function run() {
  if (watch) {
    const webCtx = await esbuild.context(browserBuild);
    await webCtx.watch();
    console.log('[web-widget] watching for changes…');
    return;
  }
  await esbuild.build(browserBuild);
  console.log('[web-widget] build complete → dist/web.js');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
