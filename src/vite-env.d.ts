/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GA4 measurement id (G-XXXX). Unset means no analytics request leaves the browser (FR-MEAS-01). */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /** Native shell only. Unset or anything other than "true" keeps AdMob off. */
  readonly VITE_ADMOB_ENABLED?: string;
  /** Native shell only. Unset or anything other than "true" keeps Play Billing off. */
  readonly VITE_PLAY_BILLING_ENABLED?: string;
}
