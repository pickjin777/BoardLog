import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import { shouldBundleMonetizationPlugin } from './src/utils/nativeMonetization';
import { nativePackageEnabled } from './src/utils/omitNativeMonetization';

/**
 * The native projects stay installed. A default build must not also ship their JS.
 * boardlog.monetization=true plus the matching VITE_* flag puts a plugin back (D-048).
 */
function omitPackageUnlessEnabled(packageName: string, enabled: boolean): Plugin {
  const virtualId = `\0omitted:${packageName}`;
  return {
    name: `omit-${packageName}`,
    enforce: 'pre',
    resolveId(source) {
      if (enabled) return null;
      if (source === packageName || source.startsWith(`${packageName}/`)) return virtualId;
      return null;
    },
    load(id) {
      if (id !== virtualId) return null;
      return 'export {}';
    }
  };
}

function flagEnabled(name: string, fileEnv: Record<string, string>): boolean {
  return process.env[name] === 'true' || fileEnv[name] === 'true';
}

function readNativePackageEnabled(): boolean {
  if (!existsSync('android/gradle.properties')) return false;
  return nativePackageEnabled(readFileSync('android/gradle.properties', 'utf8'));
}

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const packageOn = readNativePackageEnabled();
  const admob = shouldBundleMonetizationPlugin(packageOn, flagEnabled('VITE_ADMOB_ENABLED', fileEnv));
  const billing = shouldBundleMonetizationPlugin(packageOn, flagEnabled('VITE_PLAY_BILLING_ENABLED', fileEnv));
  return {
    define: {
      __BOARDLOG_MONETIZATION_PACKAGE__: packageOn ? 'true' : 'false'
    },
    plugins: [
      react(),
      tailwindcss(),
      omitPackageUnlessEnabled('@capacitor-community/admob', admob),
      omitPackageUnlessEnabled('@capgo/native-purchases', billing)
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {}
    }
  };
});
