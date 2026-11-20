import {
  assertGoogleSampleAdId,
  assertNoPlayProduct,
  GOOGLE_TEST_ADMOB_APP_ID,
  GOOGLE_TEST_ADMOB_BANNER_ID,
  PLAY_SUBSCRIPTION_PRODUCT_ID,
  shouldPrepareNativeFeature
} from '../utils/nativeMonetization';
import { isNativeShell } from '../utils/nativeShell';

const admobEnabled = __BOARDLOG_MONETIZATION_PACKAGE__ && import.meta.env.VITE_ADMOB_ENABLED === 'true';
const billingEnabled = __BOARDLOG_MONETIZATION_PACKAGE__ && import.meta.env.VITE_PLAY_BILLING_ENABLED === 'true';

/**
 * Skeleton only. The flag compares are constants so a default build drops both plugins.
 * No banner is requested. The subscription id stays null, so nothing is purchased.
 */
export async function prepareNativeMonetization(): Promise<void> {
  if (!isNativeShell()) return;
  try {
    if (admobEnabled && shouldPrepareNativeFeature(true, import.meta.env.VITE_ADMOB_ENABLED)) {
      assertGoogleSampleAdId(GOOGLE_TEST_ADMOB_APP_ID);
      assertGoogleSampleAdId(GOOGLE_TEST_ADMOB_BANNER_ID);
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.initialize({ initializeForTesting: true });
    }
    if (billingEnabled && shouldPrepareNativeFeature(true, import.meta.env.VITE_PLAY_BILLING_ENABLED)) {
      assertNoPlayProduct(PLAY_SUBSCRIPTION_PRODUCT_ID);
      const { NativePurchases } = await import('@capgo/native-purchases');
      await NativePurchases.isBillingSupported();
    }
  } catch (err) {
    console.error('native monetization init failed', err);
  }
}
