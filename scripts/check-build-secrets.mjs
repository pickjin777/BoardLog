// Fails when a build output contains anything that looks like a server secret (D-037).
// VITE_* variables are inlined into dist at build time, so a misplaced key ends up here.
// The Android project is scanned too: a key must not land in the manifest, gradle, or assets.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOTS = process.argv.slice(2);
const SCAN_ROOTS = ROOTS.length > 0 ? ROOTS : ['dist', 'android'];

const PATTERNS = [
  { name: 'Supabase service_role marker', re: /service_role/ },
  // "service_role" inside a base64url-encoded JWT payload
  { name: 'service_role JWT payload', re: /c2VydmljZV9yb2xl/ },
  { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{35}/ },
  { name: 'Private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: 'Server env var name', re: /SUPABASE_SERVICE_ROLE_KEY|GEMINI_API_KEY/ }
];

// A default bundle must not contain an ad request or a purchase call. Rebuild with the
// matching flag set to the string true before those plugin modules are allowed in dist.
const ADMOB_ON = process.env.VITE_ADMOB_ENABLED === 'true';
const BILLING_ON = process.env.VITE_PLAY_BILLING_ENABLED === 'true';

const TEXT_FILE = /\.(js|mjs|css|html|json|map|webmanifest|txt|xml|gradle|properties|java|kt|kts|pro|pem)$/;
const SKIP_DIRS = new Set(['node_modules', 'build', '.gradle', '.git']);

function listFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    if (SKIP_DIRS.has(entry)) return [];
    const path = join(dir, entry);
    if (entry.endsWith('.jks') || entry.endsWith('.keystore')) {
      return [path];
    }
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

const hits = [];
let scanned = 0;

for (const root of SCAN_ROOTS) {
  if (!existsSync(root)) {
    console.error(`check-build-secrets: "${root}" not found. Run the build first.`);
    process.exit(1);
  }
  const files = listFiles(root);
  for (const file of files) {
    scanned += 1;
    const base = file.split(/[/\\]/).pop() ?? '';
    if (base === '.env' || base.startsWith('.env.') || base === 'google-services.json') {
      hits.push(`${file}: ${base} is not allowed in the client build`);
      continue;
    }
    if (file.endsWith('.jks') || file.endsWith('.keystore') || file.endsWith('.p8') || file.endsWith('.pem')) {
      hits.push(`${file}: signing or private key file`);
      continue;
    }
    if (!TEXT_FILE.test(file)) continue;
    const text = readFileSync(file, 'utf8');
    for (const { name, re } of PATTERNS) {
      if (re.test(text)) hits.push(`${file}: ${name}`);
    }
    const distJs = file.endsWith('.js') && (file.startsWith('dist/') || file.startsWith('dist\\'));
    if (!distJs) continue;
    if (!ADMOB_ON && /showBanner\s*\(/.test(text)) hits.push(`${file}: AdMob banner request in the default bundle`);
    if (!ADMOB_ON && /ca-app-pub-/.test(text)) hits.push(`${file}: AdMob id in the default bundle`);
    if (!BILLING_ON && /purchaseProduct\s*\(|restorePurchases\s*\(|manageSubscriptions\s*\(/.test(text)) {
      hits.push(`${file}: Play purchase call in the default bundle`);
    }
  }
}

if (hits.length > 0) {
  console.error('check-build-secrets: possible secrets in the client build:');
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log(`check-build-secrets: ${scanned} files scanned in ${SCAN_ROOTS.join(', ')}, no secrets found.`);
