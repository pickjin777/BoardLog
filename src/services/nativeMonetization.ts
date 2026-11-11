import {
  assertGoogleSampleAdId,
  GOOGLE_TEST_ADMOB_APP_ID,
  GOOGLE_TEST_ADMOB_BANNER_ID,
  shouldPrepareNativeFeature
} from '../utils/nativeMonetization';
import { isNativeShell } from '../utils/nativeShell';

/**
 * Skeleton only. Both flags default off, so neither SDK is imported.
 * No Play product id is declared. The banner id is checked and then not requested.
 */
export async function prepareNativeMonetization(): Promise<void> {
  const native = isNativeShell();
  try {
    if (shouldPrepareNativeFeature(native, import.meta.env.VITE_ADMOB_ENABLED)) {
      assertGoogleSampleAdId(GOOGLE_TEST_ADMOB_APP_ID);
      assertGoogleSampleAdId(GOOGLE_TEST_ADMOB_BANNER_ID);
      const { AdMob } = await import('@capacitor-community/admob');
      await AdMob.initialize({ initializeForTesting: true });
    }
    if (shouldPrepareNativeFeature(native, import.meta.env.VITE_PLAY_BILLING_ENABLED)) {
      const { NativePurchases } = await import('@capgo/native-purchases');
      await NativePurchases.isBillingSupported();
    }
  } catch (err) {
    console.error('native monetization init failed', err);
  }
}
