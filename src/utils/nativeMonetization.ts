/**
 * Google's published sample AdMob ids.
 * https://developers.google.com/admob/android/test-ads
 * Real BoardLog ad units are not created here.
 */
export const GOOGLE_TEST_ADMOB_APP_ID = 'ca-app-pub-3940256099942544~3347511713';
export const GOOGLE_TEST_ADMOB_BANNER_ID = 'ca-app-pub-3940256099942544/6300978111';

/**
 * Google does not publish a sample subscription id the way it publishes AdMob ids.
 * Leaving this null means the shell cannot start a purchase.
 */
export const PLAY_SUBSCRIPTION_PRODUCT_ID = null;

const GOOGLE_SAMPLE_PUBLISHER = 'ca-app-pub-3940256099942544';

export function shouldPrepareNativeFeature(native: boolean, flag: string | undefined): boolean {
  return native && flag === 'true';
}

/**
 * Plugin JS is bundled only when the Android package flag is on and that feature flag is on.
 * The package flag is boardlog.monetization in android/gradle.properties (D-048).
 */
export function shouldBundleMonetizationPlugin(packageEnabled: boolean, featureEnabled: boolean): boolean {
  return packageEnabled && featureEnabled;
}

/** Rejects anything except Google's sample app id or sample ad-unit id. */
export function assertGoogleSampleAdId(id: string): void {
  const sampleApp = id.startsWith(`${GOOGLE_SAMPLE_PUBLISHER}~`);
  const sampleUnit = id.startsWith(`${GOOGLE_SAMPLE_PUBLISHER}/`);
  if (!sampleApp && !sampleUnit) {
    throw new Error('AdMob ids in this repo must be Google sample ids.');
  }
}

/** A product id would be a real Play subscription. This repo does not declare one. */
export function assertNoPlayProduct(productId: string | null): void {
  if (productId !== null) {
    throw new Error('Play product ids are not configured in this repo.');
  }
}
