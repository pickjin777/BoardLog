// The Play package name and the app name are declared once in src/config/appIdentity.ts.
// This fails when capacitor.config.ts or the Android project disagree, when the WebView
// is pointed at a remote server, or when an AdMob id other than Google's sample is committed.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';

function listAdIds(text) {
  return [...text.matchAll(/ca-app-pub-\d+[~/]\d+/g)].map((match) => match[0]);
}

const GOOGLE_SAMPLE_PUBLISHER = 'ca-app-pub-3940256099942544';
const BRAND = [0x48, 0x34, 0xd4];
const FORBIDDEN_CALLS = [
  '.purchaseProduct(',
  '.showBanner(',
  '.restorePurchases(',
  '.getProducts(',
  '.manageSubscriptions('
];

function paeth(left, up, upLeft) {
  const estimate = left + up - upLeft;
  const leftDelta = Math.abs(estimate - left);
  const upDelta = Math.abs(estimate - up);
  const upLeftDelta = Math.abs(estimate - upLeft);
  if (leftDelta <= upDelta && leftDelta <= upLeftDelta) return left;
  if (upDelta <= upLeftDelta) return up;
  return upLeft;
}

/** Four corner pixels of an 8-bit RGB or RGBA PNG. Splash and launcher art must be opaque brand purple. */
function pngCorners(path) {
  const data = readFileSync(path);
  if (data.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error(`${path} is not a png`);
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let color = 0;
  const idat = [];
  while (offset + 8 <= data.length) {
    const length = data.readUInt32BE(offset);
    const type = data.subarray(offset + 4, offset + 8).toString('ascii');
    const chunk = data.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      const bit = chunk[8];
      color = chunk[9];
      const interlace = chunk[12];
      if (bit !== 8 || interlace !== 0 || (color !== 2 && color !== 6)) {
        throw new Error(`${path} is not a non-interlaced 8-bit rgb png`);
      }
    } else if (type === 'IDAT') {
      idat.push(chunk);
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const channels = color === 6 ? 4 : 3;
  const stride = width * channels + 1;
  let prev = Buffer.alloc(width * channels);
  const rows = [];
  for (let y = 0; y < height; y += 1) {
    const filter = raw[y * stride];
    const row = Buffer.from(raw.subarray(y * stride + 1, (y + 1) * stride));
    if (filter !== 0 && filter !== 1 && filter !== 2 && filter !== 3 && filter !== 4) {
      throw new Error(`${path} has an unknown png filter`);
    }
    for (let x = 0; x < row.length; x += 1) {
      const left = x >= channels ? row[x - channels] : 0;
      const up = prev[x];
      const upLeft = x >= channels ? prev[x - channels] : 0;
      if (filter === 1) row[x] = (row[x] + left) & 255;
      else if (filter === 2) row[x] = (row[x] + up) & 255;
      else if (filter === 3) row[x] = (row[x] + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) row[x] = (row[x] + paeth(left, up, upLeft)) & 255;
    }
    prev = row;
    rows.push(row);
  }
  const pixel = (x, y) => {
    const start = x * channels;
    return [rows[y][start], rows[y][start + 1], rows[y][start + 2], channels === 4 ? rows[y][start + 3] : 255];
  };
  return [pixel(0, 0), pixel(width - 1, 0), pixel(0, height - 1), pixel(width - 1, height - 1)];
}

function isBrandPurple(pixel) {
  return pixel[0] === BRAND[0] && pixel[1] === BRAND[1] && pixel[2] === BRAND[2] && pixel[3] === 255;
}

function collectShellPngs(dir, found) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      collectShellPngs(path, found);
      continue;
    }
    if (entry === 'splash.png' || entry === 'ic_launcher.png' || entry === 'ic_launcher_background.png') {
      found.push(path);
    }
  }
}

function read(path) {
  return readFileSync(path, 'utf8');
}

function literal(source, name) {
  const match = source.match(new RegExp(`export const ${name} = '([^']*)';`));
  if (!match) {
    console.error(`check-native-identity: ${name} is not a single-quoted literal`);
    process.exit(1);
  }
  return match[1];
}

function stringValue(xml, name) {
  const match = xml.match(new RegExp(`<string name="${name}">([^<]*)</string>`));
  if (!match) {
    console.error(`check-native-identity: strings.xml is missing ${name}`);
    process.exit(1);
  }
  return match[1];
}

const identity = read('src/config/appIdentity.ts');
const appId = literal(identity, 'APP_ID');
const appName = literal(identity, 'APP_NAME');
const origin = literal(identity, 'PRODUCTION_ORIGIN');
const monetization = read('src/utils/nativeMonetization.ts');
const admobAppId = literal(monetization, 'GOOGLE_TEST_ADMOB_APP_ID');
const admobBannerId = literal(monetization, 'GOOGLE_TEST_ADMOB_BANNER_ID');

const problems = [];

if (appId !== 'com.pickjin.boardlog') problems.push(`APP_ID is ${appId}`);
if (!origin.startsWith('https://') || origin.endsWith('/')) problems.push(`PRODUCTION_ORIGIN is ${origin}`);
if (!admobAppId.startsWith(`${GOOGLE_SAMPLE_PUBLISHER}~`)) problems.push('AdMob app id is not a Google sample');
if (!admobBannerId.startsWith(`${GOOGLE_SAMPLE_PUBLISHER}/`)) problems.push('AdMob banner id is not a Google sample');
if (!/export const PLAY_SUBSCRIPTION_PRODUCT_ID = null;/.test(monetization)) {
  problems.push('PLAY_SUBSCRIPTION_PRODUCT_ID must stay null');
}

const config = read('capacitor.config.ts');
if (!/import\s*\{[^}]*\bAPP_ID\b[^}]*\bAPP_NAME\b[^}]*\}\s*from\s*'\.\/src\/config\/appIdentity'/.test(config)) {
  problems.push('capacitor.config.ts must import APP_ID and APP_NAME from src/config/appIdentity.ts');
}
if (!/appId:\s*APP_ID/.test(config) || !/appName:\s*APP_NAME/.test(config)) {
  problems.push('capacitor.config.ts must set appId and appName from the identity constants');
}
if (!/webDir:\s*'dist'/.test(config)) problems.push("webDir must be 'dist'");
if (/^\s*url\s*:/m.test(config)) problems.push('server url must not be set; the app bundles dist');
if (!/backgroundColor:\s*'#4834D4'/.test(config)) problems.push('splash backgroundColor must be #4834D4');
if (!/insetsHandling:\s*'css'/.test(config)) problems.push("SystemBars insetsHandling must be 'css'");
if (!/initialViewportFitValueHint:\s*'cover'/.test(config)) {
  problems.push("SystemBars initialViewportFitValueHint must be 'cover'");
}

const gradlePath = 'android/app/build.gradle';
const stringsPath = 'android/app/src/main/res/values/strings.xml';
const manifestPath = 'android/app/src/main/AndroidManifest.xml';
for (const path of [gradlePath, stringsPath, manifestPath]) {
  if (!existsSync(path)) problems.push(`missing ${path}`);
}

if (existsSync(gradlePath)) {
  const gradle = read(gradlePath);
  const ids = [...gradle.matchAll(/applicationId\s+"([^"]+)"/g)].map((match) => match[1]);
  if (ids.length !== 1 || ids[0] !== appId) problems.push(`applicationId ${ids.join(', ') || '(missing)'} != ${appId}`);
}

if (existsSync(stringsPath)) {
  const xml = read(stringsPath);
  for (const name of ['app_name', 'title_activity_main']) {
    if (stringValue(xml, name) !== appName) problems.push(`${name} != ${appName}`);
  }
  for (const name of ['package_name', 'custom_url_scheme']) {
    if (stringValue(xml, name) !== appId) problems.push(`${name} != ${appId}`);
  }
  if (stringValue(xml, 'admob_app_id') !== admobAppId) problems.push('admob_app_id != GOOGLE_TEST_ADMOB_APP_ID');
}

if (existsSync(manifestPath)) {
  const manifest = read(manifestPath);
  if (!manifest.includes('@string/admob_app_id')) problems.push('manifest must reference @string/admob_app_id');
  if (!manifest.includes('com.google.android.gms.ads.APPLICATION_ID')) {
    problems.push('manifest is missing the AdMob application id meta-data');
  }
  if (!manifest.includes('com.android.vending.BILLING'))
    problems.push('manifest is missing the Play Billing permission');
}

const SKIP_DIRS = new Set(['node_modules', 'dist', 'dist-ga', 'coverage', 'build', '.gradle', '.git', 'test-results']);

function walk(dir, found) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walk(path, found);
      continue;
    }
    if (!/\.(ts|tsx|js|mjs|xml|gradle|properties|json|html|txt|kt|java|kts)$/.test(path)) continue;
    const text = read(path);
    for (const id of listAdIds(text)) {
      if (!id.startsWith(GOOGLE_SAMPLE_PUBLISHER)) found.push(`${path}: ${id}`);
    }
  }
}

const shellPngs = [
  'public/favicon-32.png',
  'public/apple-touch-icon.png',
  'public/icon-192.png',
  'public/icon-512.png',
  'public/icon-maskable-512.png'
];
collectShellPngs('android/app/src/main/res', shellPngs);
for (const path of shellPngs) {
  if (!existsSync(path)) {
    problems.push(`missing ${path}`);
    continue;
  }
  try {
    const corners = pngCorners(path);
    if (corners.some((pixel) => !isBrandPurple(pixel))) problems.push(`${path} corners are not #4834D4`);
  } catch (err) {
    problems.push(`${path}: ${err instanceof Error ? err.message : 'png read failed'}`);
  }
}

const colorsXml = existsSync('android/app/src/main/res/values/colors.xml')
  ? read('android/app/src/main/res/values/colors.xml')
  : '';
if (!/name="splashBackground">#4834D4</i.test(colorsXml)) problems.push('splashBackground must be #4834D4');

const indexHtml = read('index.html');
if (!indexHtml.includes('viewport-fit=cover')) problems.push('index.html must set viewport-fit=cover');
if (!/name="theme-color" content="#4834D4"/i.test(indexHtml)) problems.push('theme-color must be #4834D4');
if (!/"theme_color": "#4834D4"/.test(read('public/manifest.webmanifest'))) {
  problems.push('manifest theme_color must be #4834D4');
}
const shellCss = read('src/index.css');
if (!shellCss.includes('--safe-area-inset-top') || !shellCss.includes('env(safe-area-inset-top')) {
  problems.push('the shell must pad with the safe-area inset');
}

const foreignAds = [];
for (const dir of ['src', 'android', 'scripts', 'api']) walk(dir, foreignAds);
walkFile('capacitor.config.ts', foreignAds);
problems.push(...foreignAds);

function walkCalls(dir, found) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      walkCalls(path, found);
      continue;
    }
    if (!/\.(ts|tsx)$/.test(path)) continue;
    const text = read(path);
    for (const call of FORBIDDEN_CALLS) {
      if (text.includes(call)) found.push(`${path}: ${call}`);
    }
  }
}

const purchaseCalls = [];
walkCalls('src', purchaseCalls);
problems.push(...purchaseCalls);

function walkFile(path, found) {
  if (!existsSync(path)) return;
  const text = read(path);
  for (const id of listAdIds(text)) {
    if (!id.startsWith(GOOGLE_SAMPLE_PUBLISHER)) found.push(`${path}: ${id}`);
  }
}

if (problems.length > 0) {
  console.error('check-native-identity: the Android shell does not match the single app identity:');
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(`check-native-identity: ${appId} (${appName}) matches, sample AdMob ids only.`);
