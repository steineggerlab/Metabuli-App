const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options)
});
