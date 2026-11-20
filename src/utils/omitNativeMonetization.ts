/**
 * Shipping package switch (D-048). `boardlog.monetization=true` in android/gradle.properties
 * is the only value that puts AdMob and Play Billing back into the Android project.
 * The manifest's tools:node="remove" must be deleted in the same change, or the
 * merged manifest still drops AD_ID and BILLING.
 */
const MONETIZATION_GRADLE_PROJECTS = new Set(['capacitor-community-admob', 'capgo-native-purchases']);

const MONETIZATION_PACKAGES = new Set(['@capacitor-community/admob', '@capgo/native-purchases']);

export function nativePackageEnabled(gradleProperties: string): boolean {
  const matches = [...gradleProperties.matchAll(/^[ \t]*boardlog\.monetization[ \t]*=[ \t]*(.*)$/gm)];
  if (matches.length === 0) return false;
  return matches[matches.length - 1][1].trim() === 'true';
}

function gradleProjectOnLine(line: string): string | null {
  const include = /^include ':([^']+)'$/.exec(line.trim());
  if (include) return include[1];
  const project = /^project\(':([^']+)'\)/.exec(line.trim());
  if (project) return project[1];
  return null;
}

/** Drops AdMob and Play Billing from the generated Capacitor settings file. Splash stays. */
export function stripCapacitorSettingsGradle(source: string): string {
  return source
    .split('\n')
    .filter((line) => {
      const name = gradleProjectOnLine(line);
      return name === null || !MONETIZATION_GRADLE_PROJECTS.has(name);
    })
    .join('\n');
}

/** Drops AdMob and Play Billing implementation lines from capacitor.build.gradle. */
export function stripCapacitorBuildGradle(source: string): string {
  return source
    .split('\n')
    .filter((line) => {
      const match = /^implementation project\(':([^']+)'\)$/.exec(line.trim());
      return match === null || !MONETIZATION_GRADLE_PROJECTS.has(match[1]);
    })
    .join('\n');
}

export function withoutMonetizationPlugins<T extends { pkg: string }>(entries: T[]): T[] {
  return entries.filter((entry) => !MONETIZATION_PACKAGES.has(entry.pkg));
}

/** True when the manifest element for this android:name carries tools:node="remove". */
export function manifestNodeRemoves(xml: string, androidName: string): boolean {
  const at = xml.indexOf(`android:name="${androidName}"`);
  if (at < 0) return false;
  const start = xml.lastIndexOf('<', at);
  const end = xml.indexOf('>', at);
  if (start < 0 || end < 0) return false;
  return xml.slice(start, end + 1).includes('tools:node="remove"');
}
