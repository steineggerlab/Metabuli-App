const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs').promises;

contextBridge.exposeInMainWorld('electron', {
  readFile: async (relativePath) => {
    // FIXME: this is read function for sample_data
    const basePath = process.env.NODE_ENV === 'development' ? path.join(__dirname, '..', 'public') : path.join(__dirname);
    const fullPath = path.join(basePath, relativePath);
    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  },
  openFileDialog: (options) => ipcRenderer.invoke('open-file-dialog', options),
  resolvePath: (relativePath) => path.resolve(__dirname, relativePath),
  openKrona: (filePath) => ipcRenderer.invoke('open-krona', filePath)
});