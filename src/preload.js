const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs").promises;

contextBridge.exposeInMainWorld("electron", {
  readFile: async (filePath, isRelativePath) => {
    // 'development' __dirname: /Users/sunnylee/Documents/Steinegger Lab/Metabuli-App/metabuli-app/dist_electron
    // 'production' __dirname: /Users/sunnylee/Documents/Steinegger Lab/Metabuli-App/metabuli-app/build/mac-universal--arm64/Metabuli App.app/Contents/Resources/app.asar
    const basePath =
      process.env.NODE_ENV === "development"
        ? path.join(__dirname, "..", "public")
        : path.join(__dirname);
    const fullPath = isRelativePath ? path.join(basePath, filePath) : filePath;
    try {
      return await fs.readFile(fullPath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  },
  openFileDialog: (options) => ipcRenderer.invoke("open-file-dialog", options),
  openKrona: (filePath) => ipcRenderer.invoke("open-krona", filePath),

  runBackend: (args) => ipcRenderer.send("run-backend", args),
  cancelBackend: () => ipcRenderer.send("cancel-backend"),
  onBackendOutput: (callback) =>
    ipcRenderer.on("backend-output", (event, output) => callback(output)),
  onBackendError: (callback) =>
    ipcRenderer.on("backend-error", (event, error) => callback(error)),
  onBackendCancelled: (callback) =>
    ipcRenderer.on("backend-cancelled", (event, message) => callback(message)),

  onBackendRealtimeOutput: (callback) =>
    ipcRenderer.on("backend-realtime-output", (event, output) =>
      callback(output)
    ),
  onBackendComplete: (callback) =>
    ipcRenderer.on("backend-complete", (event, message) => callback(message)),
});
