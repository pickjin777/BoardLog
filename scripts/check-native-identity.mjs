// The Play package name and the app name are declared once in src/config/appIdentity.ts.
// This fails when capacitor.config.ts or the Android project disagree, when the WebView
// is pointed at a remote server, or when an AdMob id other than Google's sample is committed.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function listAdIds(text) {
  return [...text.matchAll(/ca-app-pub-\d+[~/]\d+/g)].map((match) => match[0]);
}

const GOOGLE_SAMPLE_PUBLISHER = 'ca-app-pub-3940256099942544';

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

const config = read('capacitor.config.ts');
if (!/import\s*\{[^}]*\bAPP_ID\b[^}]*\bAPP_NAME\b[^}]*\}\s*from\s*'\.\/src\/config\/appIdentity'/.test(config)) {
  problems.push('capacitor.config.ts must import APP_ID and APP_NAME from src/config/appIdentity.ts');
}
if (!/appId:\s*APP_ID/.test(config) || !/appName:\s*APP_NAME/.test(config)) {
  problems.push('capacitor.config.ts must set appId and appName from the identity constants');
}
if (!/webDir:\s*'dist'/.test(config)) problems.push("webDir must be 'dist'");
if (/^\s*url\s*:/m.test(config)) problems.push('server url must not be set; the app bundles dist');

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

const foreignAds = [];
for (const dir of ['src', 'android', 'scripts', 'api']) walk(dir, foreignAds);
walkFile('capacitor.config.ts', foreignAds);
problems.push(...foreignAds);

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
