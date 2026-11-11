/// <reference types="@capacitor/splash-screen" />
import type { CapacitorConfig } from '@capacitor/cli';
import { APP_ID, APP_NAME } from './src/config/appIdentity';

/**
 * The WebView loads `webDir` from the APK. Do not add a server address here:
 * that would turn the app into a remote page instead of a bundled shell.
 */
const config: CapacitorConfig = {
  appId: APP_ID,
  appName: APP_NAME,
  webDir: 'dist',
  backgroundColor: '#F1F3F5',
  server: {
    androidScheme: 'https',
    hostname: 'localhost'
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 0,
      backgroundColor: '#5641DE',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false
    },
    SystemBars: {
      insetsHandling: 'css',
      initialViewportFitValueHint: 'cover',
      style: 'LIGHT'
    }
  }
};

export default config;
