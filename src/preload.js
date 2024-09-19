const { contextBridge, ipcRenderer } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

contextBridge.exposeInMainWorld("electron", {
	readFile: async (filePath, isRelativePath) => {
		// 'development' __dirname: /Users/sunnylee/Documents/Steinegger Lab/Metabuli-App/metabuli-app/dist_electron
		// 'production' __dirname: /Users/sunnylee/Documents/Steinegger Lab/Metabuli-App/metabuli-app/build/mac-universal--arm64/Metabuli App.app/Contents/Resources/app.asar
		const basePath = process.env.NODE_ENV === "development" ? path.join(__dirname, "..", "public") : path.join(__dirname);
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

	onBackendRealtimeOutput: (callback) => ipcRenderer.on("backend-realtime-output", (event, output) => callback(output)),
	onBackendComplete: (callback) => ipcRenderer.on("backend-complete", (event, message) => callback(message)),
	onBackendError: (callback) => ipcRenderer.on("backend-error", (event, error) => callback(error)),
	onBackendCancelled: (callback) => ipcRenderer.on("backend-cancelled", (event, message) => callback(message)),

	// Methods to remove event listeners
	offBackendRealtimeOutput: () => ipcRenderer.removeAllListeners("backend-realtime-output"),
	offBackendComplete: () => ipcRenderer.removeAllListeners("backend-complete"),
	offBackendError: () => ipcRenderer.removeAllListeners("backend-error"),
	offBackendCancelled: () => ipcRenderer.removeAllListeners("backend-cancelled"),

	// Method to retrieve total system memory in GB
	getTotalRam: () => {
		const totalRamInBytes = os.totalmem(); // Get total RAM in bytes
		const totalRamInGB = Math.floor(totalRamInBytes / 1024 ** 3); // Convert to GB
		return totalRamInGB;
	},
});
