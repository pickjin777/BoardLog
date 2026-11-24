import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { _electron as electron } from '@playwright/test';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const electronPath = require('electron');
const shot = process.env.BOARDLOG_SMOKE_SHOT ?? '/opt/cursor/artifacts/desktop-smoke.png';

const app = await electron.launch({
  executablePath: electronPath,
  args: [path.join(root, 'desktop', 'main.cjs')],
  cwd: root,
  env: { ...process.env }
});

try {
  const win = await app.firstWindow();
  await win.waitForLoadState('domcontentloaded');
  const skip = win.locator('#treasure-skip-btn');
  if (await skip.isVisible().catch(() => false)) await skip.click();
  await win.locator('h1').filter({ hasText: '보드로그' }).waitFor({ timeout: 20_000 });
  await win.screenshot({ path: shot });
  const title = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.getTitle() ?? '');
  if (title !== '보드로그') throw new Error(`window title is ${title}`);
} finally {
  await app.close();
}
