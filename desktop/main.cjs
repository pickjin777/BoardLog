const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL, fileURLToPath } = require('node:url');
const { app, BrowserWindow, protocol, net, session } = require('electron');

const SCHEME = 'app';
const HOST = 'localhost';
const TITLE = '보드로그';

protocol.registerSchemesAsPrivileged([
  {
    scheme: SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true
    }
  }
]);

// Chromium refuses its setuid sandbox when the process is root. Windows users are not root.
if (typeof process.getuid === 'function' && process.getuid() === 0) {
  app.commandLine.appendSwitch('no-sandbox');
}

function distRoot() {
  const candidates = [path.join(__dirname, 'dist'), path.join(__dirname, '..', 'dist')];
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) return path.resolve(candidate);
  }
  return path.resolve(candidates[0]);
}

function isInsideDist(file) {
  const root = distRoot();
  const resolved = path.resolve(file);
  return resolved === root || resolved.startsWith(`${root}${path.sep}`);
}

function fileForRequest(requestUrl) {
  let url;
  try {
    url = new URL(requestUrl);
  } catch {
    return null;
  }
  if (url.protocol !== `${SCHEME}:` || url.hostname !== HOST) return null;
  let pathname = decodeURIComponent(url.pathname);
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = path.resolve(distRoot(), pathname.replace(/^\/+/, ''));
  if (!isInsideDist(file)) return null;
  return file;
}

function isFileInsideDist(raw) {
  try {
    return isInsideDist(fileURLToPath(raw));
  } catch {
    return false;
  }
}

function isAllowedUrl(raw) {
  if (raw.startsWith('data:') || raw.startsWith('blob:') || raw.startsWith('devtools:')) return true;
  if (raw.startsWith('file:')) return isFileInsideDist(raw);
  try {
    const url = new URL(raw);
    return url.protocol === `${SCHEME}:` && url.hostname === HOST;
  } catch {
    return false;
  }
}

function createWindow() {
  const icon = path.join(distRoot(), 'icon-512.png');
  const win = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 360,
    minHeight: 640,
    title: TITLE,
    backgroundColor: '#0E1628',
    autoHideMenuBar: true,
    icon: fs.existsSync(icon) ? icon : undefined,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      preload: path.join(__dirname, 'preload.cjs')
    }
  });
  win.setMenuBarVisibility(false);
  win.on('page-title-updated', (event) => {
    event.preventDefault();
    win.setTitle(TITLE);
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  const stopLeaving = (event, url) => {
    if (!isAllowedUrl(url)) event.preventDefault();
  };
  win.webContents.on('will-navigate', stopLeaving);
  win.webContents.on('will-redirect', stopLeaving);
  void win.loadURL(`${SCHEME}://${HOST}/index.html`);
  return win;
}

app.whenReady().then(() => {
  protocol.handle(SCHEME, (request) => {
    const file = fileForRequest(request.url);
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      return new Response('Not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(file).toString());
  });

  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (isAllowedUrl(details.url)) {
      callback({});
      return;
    }
    callback({ cancel: true });
  });
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => {
    callback(false);
  });

  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
