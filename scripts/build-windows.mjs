import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const electronVersion = JSON.parse(
  readFileSync(path.join(root, 'node_modules', 'electron', 'package.json'), 'utf8')
).version;
const bundle = path.join(root, 'desktop', 'bundle');
const releaseDir = path.join(root, 'release');

rmSync(bundle, { recursive: true, force: true });
mkdirSync(bundle, { recursive: true });
cpSync(path.join(root, 'dist'), path.join(bundle, 'dist'), { recursive: true });
cpSync(path.join(root, 'desktop', 'main.cjs'), path.join(bundle, 'main.cjs'));
cpSync(path.join(root, 'desktop', 'preload.cjs'), path.join(bundle, 'preload.cjs'));
cpSync(path.join(root, 'public', 'icon-512.png'), path.join(bundle, 'icon.png'));

writeFileSync(
  path.join(bundle, 'package.json'),
  `${JSON.stringify(
    {
      name: 'boardlog',
      productName: 'BoardLog',
      version: '0.0.0',
      private: true,
      main: 'main.cjs',
      description: '보드로그'
    },
    null,
    2
  )}\n`
);

const config = {
  appId: 'com.pickjin.boardlog',
  productName: 'BoardLog',
  electronVersion,
  asar: true,
  npmRebuild: false,
  directories: { output: releaseDir },
  files: ['dist/**/*', 'main.cjs', 'preload.cjs', 'package.json', 'icon.png'],
  win: {
    target: [
      { target: 'portable', arch: ['x64'] },
      { target: 'nsis', arch: ['x64'] }
    ],
    icon: 'icon.png',
    executableName: 'boardlog',
    signAndEditExecutable: true
  },
  portable: { artifactName: 'boardlog-windows-portable.exe' },
  nsis: {
    oneClick: true,
    perMachine: false,
    allowToChangeInstallationDirectory: false,
    artifactName: 'boardlog-setup.exe',
    shortcutName: 'BoardLog',
    uninstallDisplayName: 'BoardLog',
    deleteAppDataOnUninstall: false
  }
};

writeFileSync(path.join(bundle, 'electron-builder.json'), JSON.stringify(config));

const result = spawnSync(
  'npx',
  ['electron-builder', '--win', 'portable', 'nsis', '--x64', '--config', 'electron-builder.json'],
  {
    cwd: bundle,
    stdio: 'inherit',
    env: {
      ...process.env,
      CSC_IDENTITY_AUTO_DISCOVERY: 'false',
      WINEDEBUG: '-all'
    }
  }
);

if (result.status !== 0) process.exit(result.status ?? 1);
