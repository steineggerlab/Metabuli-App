const { contextBridge, ipcRenderer, shell } = require("electron");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

// Helper function to get full path based on environment and parameters
const getBasePath = () => {
	const basePath =
		process.env.NODE_ENV === "development"
			? path.join(__dirname, "..", "public")
			: path.join(__dirname);
	return basePath;
};

// Directory to store job history on the user's machine
const historyFilePath = path.join(os.homedir(), "metabuli_job_history.json");

// Extract the filename from a path (cross-platform)
const extractFilename = (filePath) => {
	return path.basename(filePath);
};

// Remove extension from a filename
const stripFileExtension = (filePath) => {
	const filename = extractFilename(filePath);
	const m = filename.match(
		/(.+?)((?:\.fna|\.fasta|\.fa|\.fq|\.fastq)(?:\.gz)?)$/i,
	);

	return m ? { base: m[1], ext: m[2] } : { base: filename, ext: "" };
};

contextBridge.exposeInMainWorld("electron", {
	getBasePath: () => getBasePath(),
	getParentDir: (filePath) => {
		return path.dirname(filePath);
	},
	openItemInFolder: (filePath) => shell.showItemInFolder(filePath),

	// Function to resolve file path
	resolveFilePath: (filePath, isRelativePath) => {
		// Determine the base path based on the environment
		// 'development' __dirname: /Users/sunnylee/Documents/Steinegger Lab/Metabuli-App/metabuli-app/dist_electron
		// 'production' basePath: /Users/sunnylee/Documents/Steinegger Lab/Metabuli-App/metabuli-app/build/mac-universal--arm64/Metabuli App.app/Contents/Resources
		const basePath =
			process.env.NODE_ENV === "development"
				? path.join(__dirname, "..", "public")
				: process.resourcesPath;
		return isRelativePath ? path.join(basePath, filePath) : filePath;
	},
	joinPath: (...segments) => path.join(...segments),

	// Function to check if file exists
	fileExists: async (filePath) => {
		try {
			await fs.access(filePath);
			return true; // File exists
		} catch (error) {
			return false; // File does not exist
		}
	},
	// Extract the filename+extension from a path (cross-platform)
	extractFilename: (filePath) => extractFilename(filePath),
	stripFileExtension: (filePath) => stripFileExtension(filePath),

	// Method to retrieve total system memory in GB
	getTotalRam: () => {
		const totalRamInBytes = os.totalmem(); // Get total RAM in bytes
		const totalRamInGB = Math.floor(totalRamInBytes / 1024 ** 3); // Convert to GB
		return totalRamInGB;
	},

	// Manage Job History
	async saveJobHistory(jobsHistory) {
		try {
			const data = JSON.stringify(jobsHistory, null, 2);
			await fs.writeFile(historyFilePath, data, "utf-8");
			// console.log("🚀 Job history saved successfully.");
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
			// console.log("🚀 Job history loaded successfully.");
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

	readFile: async (filePath) => {
		try {
			return await fs.readFile(filePath, "utf-8");
		} catch (error) {
			throw new Error(`Failed to read file: ${error.message}`);
		}
	},
	writeFile: async (filePath, content) => {
		try {
			await fs.writeFile(filePath, content, "utf8");
		} catch (error) {
			throw error;
		}
	},

	mkdir: (dirPath) => fs.mkdir(dirPath, { recursive: true }),

	openFileDialog: (options) => ipcRenderer.invoke("open-file-dialog", options),
	openKrona: (filePath) => ipcRenderer.invoke("open-krona", filePath),

	/* ==========================================================================
	 *  Metabuli (“classification”) IPC API
	 * ========================================================================== */
	runBackend: (params, workingDir) =>
		ipcRenderer.send("run-backend", { params, workingDir }),
	cancelBackend: () => ipcRenderer.send("cancel-backend"),

	onBackendRealtimeOutput: (callback) =>
		ipcRenderer.on("backend-realtime-output", (event, output) =>
			callback(output),
		),
	onBackendComplete: (callback) =>
		ipcRenderer.on("backend-complete", (event, message) => callback(message)),
	onBackendError: (callback) =>
		ipcRenderer.on("backend-error", (event, error) => callback(error)),
	onBackendCancelled: (callback) =>
		ipcRenderer.on("backend-cancelled", (event, message) => callback(message)),

	/** Remove all Metabuli IPC listeners. */
	offBackendRealtimeOutput: () =>
		ipcRenderer.removeAllListeners("backend-realtime-output"),
	offBackendComplete: () => ipcRenderer.removeAllListeners("backend-complete"),
	offBackendError: () => ipcRenderer.removeAllListeners("backend-error"),
	offBackendCancelled: () =>
		ipcRenderer.removeAllListeners("backend-cancelled"),

	// Simulate Classify Error
	simulateMetabuliError: () => {
		ipcRenderer.emit("backend-error", null, "Simulated metabuli error");
	},

	/* ==========================================================================
	 *  fastp (QC) IPC API
	 * ========================================================================== */
	runFastp: (params, mode, workingDir) =>
		ipcRenderer.send("run-fastp", { params, mode, workingDir }),
	cancelFastp: () => ipcRenderer.send("cancel-fastp"),

	onFastpOutput: (callback) =>
		ipcRenderer.on("fastp-output", (_, data) => callback(data)),
	onFastpComplete: (callback) =>
		ipcRenderer.on("fastp-complete", (_, msg) => callback(msg)),
	onFastpError: (callback) =>
		ipcRenderer.on("fastp-error", (_, error) => callback(error)),
	onFastpCancelled: (callback) =>
		ipcRenderer.on("fastp-cancelled", (event, message) => callback(message)),

	// Simulate Fastp Error
	simulateFastpError: () => {
		ipcRenderer.emit("fastp-error", null, "Simulated fastp error");
	},

	/** Remove all fastp IPC listeners. */
	offFastpListeners: () => {
		ipcRenderer.removeAllListeners("fastp-output");
		ipcRenderer.removeAllListeners("fastp-error");
		ipcRenderer.removeAllListeners("fastp-complete");
	},
});
