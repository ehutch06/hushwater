const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('hushwaterDesktop', {
  getVersion: () => ipcRenderer.invoke('app-version'),
  checkForUpdates: () => ipcRenderer.invoke('update-check'),
  getUpdateStatus: () => ipcRenderer.invoke('update-status-current'),
  downloadUpdate: () => ipcRenderer.invoke('update-download'),
  installUpdate: () => ipcRenderer.invoke('update-install'),
  onUpdateStatus: cb => ipcRenderer.on('update-status', (_event, data) => cb(data))
});
