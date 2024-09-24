const { contextBridge, ipcRenderer, shell } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

// Helper function to get full path based on environment and parameters
const getBasePath = () => {
	const basePath = process.env.NODE_ENV === "development" ? path.join(__dirname, "..", "public") : path.join(__dirname);
	return basePath;
};

// Directory to store job history on the user's machine
const historyFilePath = path.join(os.homedir(), "metabuli_job_history.json");

contextBridge.exposeInMainWorld("electron", {
	getBasePath: () => getBasePath(),
	openItemInFolder: (filePath) => shell.showItemInFolder(filePath),
	
	// Function to check if file exists
	fileExists: async (filePath) => {
		try {
			await fs.access(filePath);
			return true; // File exists
		} catch (error) {
			return false; // File does not exist
		}
	},

	// Manage Job History
	async saveJobHistory(jobsHistory) {
		try {
			const data = JSON.stringify(jobsHistory, null, 2);
			await fs.writeFile(historyFilePath, data, "utf-8");
			console.log("🚀 Job history saved successfully.");
		} catch (error) {
			console.error("Failed to save job history:", error);
			throw new Error("Failed to save job history: " + error.message);
		}
	},
	async loadJobHistory() {
		try {
			const data = await fs.readFile(historyFilePath, "utf-8");

			// Check if the file is empty, if so return an empty array
			if (!data || data.trim() === "") {
				console.log("Job history file is empty, returning empty array.");
				return [];
			}

			const jobsHistory = JSON.parse(data); // Parse the JSON data
			console.log("🚀 Job history loaded successfully.");
			return jobsHistory;
		} catch (error) {
			// If the file does not exist, return an empty array (initial state)
			if (error.code === "ENOENT") {
				console.log("No job history found, returning empty array.");
				return [];
			} else {
				console.error("Failed to load job history:", error);
				throw new Error("Failed to load job history: " + error.message);
			}
		}
	},

	readFile: async (filePath, isRelativePath) => {
		// FIXME: use getBasePath
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
