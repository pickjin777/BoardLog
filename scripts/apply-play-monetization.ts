// cap sync puts AdMob and Play Billing back into the generated Android files.
// When boardlog.monetization is not the string true, strip them again (D-048).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import {
  manifestNodeRemoves,
  nativePackageEnabled,
  stripCapacitorBuildGradle,
  stripCapacitorSettingsGradle,
  withoutMonetizationPlugins
} from '../src/utils/omitNativeMonetization.ts';

const PROPERTIES = 'android/gradle.properties';
const SETTINGS = 'android/capacitor.settings.gradle';
const BUILD = 'android/app/capacitor.build.gradle';
const PLUGINS = 'android/app/src/main/assets/capacitor.plugins.json';
const MANIFEST = 'android/app/src/main/AndroidManifest.xml';

const REMOVED_NODES = [
  'com.google.android.gms.permission.AD_ID',
  'com.android.vending.BILLING',
  'com.google.android.gms.ads.APPLICATION_ID'
];

const properties = existsSync(PROPERTIES) ? readFileSync(PROPERTIES, 'utf8') : '';
const enabled = nativePackageEnabled(properties);

if (enabled) {
  const manifest = existsSync(MANIFEST) ? readFileSync(MANIFEST, 'utf8') : '';
  const stillRemoved = REMOVED_NODES.filter((name) => manifestNodeRemoves(manifest, name));
  if (stillRemoved.length > 0) {
    console.error(
      `apply-play-monetization: boardlog.monetization=true but the manifest still removes ${stillRemoved.join(', ')}. Delete tools:node="remove" on those nodes.`
    );
    process.exit(1);
  }
  console.log('apply-play-monetization: native AdMob and Play Billing stay in the Android project.');
  process.exit(0);
}

if (existsSync(SETTINGS)) {
  writeFileSync(SETTINGS, stripCapacitorSettingsGradle(readFileSync(SETTINGS, 'utf8')));
}
if (existsSync(BUILD)) {
  writeFileSync(BUILD, stripCapacitorBuildGradle(readFileSync(BUILD, 'utf8')));
}
if (existsSync(PLUGINS)) {
  const parsed: unknown = JSON.parse(readFileSync(PLUGINS, 'utf8'));
  if (!Array.isArray(parsed)) {
    console.error('apply-play-monetization: capacitor.plugins.json is not an array');
    process.exit(1);
  }
  const entries = parsed.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null || !('pkg' in entry) || typeof entry.pkg !== 'string') {
      return [];
    }
    const classpath = 'classpath' in entry && typeof entry.classpath === 'string' ? entry.classpath : '';
    return [{ pkg: entry.pkg, classpath }];
  });
  writeFileSync(PLUGINS, `${JSON.stringify(withoutMonetizationPlugins(entries), null, '\t')}\n`);
}

console.log('apply-play-monetization: removed AdMob and Play Billing from the Android project.');
