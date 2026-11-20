import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * The native projects stay installed. A default build must not also ship their JS.
 * Set the matching VITE_* flag to the string true and rebuild to put a plugin back.
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

export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), '');
  const admob = flagEnabled('VITE_ADMOB_ENABLED', fileEnv);
  const billing = flagEnabled('VITE_PLAY_BILLING_ENABLED', fileEnv);
  return {
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
