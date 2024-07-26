const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');

contextBridge.exposeInMainWorld('electron', {
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  resolvePath: (relativePath) => path.resolve(__dirname, relativePath),
  openKrona: (filePath) => ipcRenderer.invoke('open-krona', filePath)
});
