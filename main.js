const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

let mainWindow;

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#102d3c',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'app', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  if (app.isPackaged) setTimeout(() => autoUpdater.checkForUpdates(), 2500);
}

app.whenReady().then(() => {
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => send('update-status', { state: 'checking' }));
  autoUpdater.on('update-available', info => send('update-status', { state: 'available', version: info.version }));
  autoUpdater.on('update-not-available', () => send('update-status', { state: 'current' }));
  autoUpdater.on('download-progress', p => send('update-status', { state: 'downloading', percent: Math.round(p.percent) }));
  autoUpdater.on('update-downloaded', info => send('update-status', { state: 'ready', version: info.version }));
  autoUpdater.on('error', err => send('update-status', { state: 'error', message: err.message }));

  ipcMain.handle('update-check', () => autoUpdater.checkForUpdates());
  ipcMain.handle('update-download', () => autoUpdater.downloadUpdate());
  ipcMain.handle('update-install', () => autoUpdater.quitAndInstall(false, true));
  ipcMain.handle('app-version', () => app.getVersion());

  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
