#!/usr/bin/env node
/**
 * Postinstall fix: react-native-css-interop bundles its own nested lightningcss@1.27.0,
 * but the lightningcss-darwin-arm64 binary it ships is corrupt (truncated).
 * This script downloads the correct binary from npm and replaces the broken one.
 *
 * Root cause: npm deduplication failure — the nested binary was written partially.
 */

const path = require('path');
const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

const TARGET = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native-css-interop',
  'node_modules',
  'lightningcss-darwin-arm64',
  'lightningcss.darwin-arm64.node'
);

// Only run on darwin arm64
if (process.platform !== 'darwin' || process.arch !== 'arm64') {
  process.exit(0);
}

if (!fs.existsSync(TARGET)) {
  console.log('[fix-lightningcss] Nested lightningcss-darwin-arm64 not present, skipping.');
  process.exit(0);
}

// Check if binary is corrupt by trying to load it
try {
  require(TARGET);
  console.log('[fix-lightningcss] Binary OK, no fix needed.');
  process.exit(0);
} catch (e) {
  if (!e.message.includes('segment') && !e.message.includes('dlopen')) {
    console.log('[fix-lightningcss] Binary load error (not corruption):', e.message.slice(0, 80));
    process.exit(0);
  }
  console.log('[fix-lightningcss] Corrupt binary detected. Downloading fix...');
}

// Get the version of the nested lightningcss
let version = '1.27.0';
try {
  const pkgPath = path.join(
    __dirname, '..', 'node_modules', 'react-native-css-interop',
    'node_modules', 'lightningcss-darwin-arm64', 'package.json'
  );
  version = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || version;
} catch (_) {}

const tarUrl = `https://registry.npmjs.org/lightningcss-darwin-arm64/-/lightningcss-darwin-arm64-${version}.tgz`;
const tmpTar = path.join(require('os').tmpdir(), `lc-arm64-${version}.tgz`);

try {
  execSync(`curl -sL "${tarUrl}" -o "${tmpTar}"`, { stdio: 'inherit' });
  execSync(`tar -xzf "${tmpTar}" -C "${require('os').tmpdir()}" package/lightningcss.darwin-arm64.node`);
  const extracted = path.join(require('os').tmpdir(), 'package', 'lightningcss.darwin-arm64.node');
  fs.copyFileSync(extracted, TARGET);
  console.log(`[fix-lightningcss] ✅ Replaced corrupt binary with v${version} from npm.`);
} catch (e) {
  console.error('[fix-lightningcss] ❌ Failed to auto-fix:', e.message);
  process.exit(1);
}
