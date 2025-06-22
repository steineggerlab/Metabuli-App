"use strict";

import { app, protocol, BrowserWindow, screen, ipcMain, dialog, shell } from "electron";
const { execFile, spawn } = require("child_process");
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS3_DEVTOOLS } from "electron-devtools-installer";
import fs from "fs";
import { join } from "path";
import { default as os } from "os";
import appRootDir from "app-root-dir";

const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: "app", privileges: { secure: true, standard: true } }]);

async function createWindow() {
	// Wait for the app to be ready
	await app.whenReady();

	// Get the primary display
	const { width, height } = screen.getPrimaryDisplay().workAreaSize;

	// Create the browser window.
	const win = new BrowserWindow({
		x: 0,
		y: 0,
		width: width * 0.75,
		height: height,
		minWidth: 850,
		minHeight: 650,
		webPreferences: {
			// Use pluginOptions.nodeIntegration, leave this alone
			// See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
			// nodeIntegration: process.env.ELECTRON_NODE_INTEGRATION,
			// contextIsolation: !process.env.ELECTRON_NODE_INTEGRATION,
			nodeIntegration: true,
			contextIsolation: true,
			preload: join(__dirname, "preload.js"), // Ensure the preload script is specified
		},
	});

	// Intercepting new-window events to open external URLs in the default browser
	win.webContents.on("new-window", (event, url) => {
		event.preventDefault(); // Prevent the default behavior
		shell.openExternal(url); // Open the URL in the default browser
	});

	if (process.env.WEBPACK_DEV_SERVER_URL) {
		// Load the url of the dev server if in development mode
		await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
		if (!process.env.IS_TEST) win.webContents.openDevTools();
	} else {
		createProtocol("app");
		// Load the index.html when not in development
		const indexPath = `file://${__dirname}/index.html`;
		win.loadURL(indexPath).catch((err) => {
			console.error(`Failed to load URL: ${indexPath}`, err);
		});
	}
}

// Quit when all windows are closed.
app.on("window-all-closed", () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== "darwin") {
		app.quit();
	}
});

app.on("activate", () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
	if (isDevelopment && !process.env.IS_TEST) {
		// Install Vue Devtools
		try {
			await installExtension(VUEJS3_DEVTOOLS);
		} catch (e) {
			console.error("Vue Devtools failed to install:", e.toString());
		}
	}
	createWindow();
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
	if (process.platform === "win32") {
		process.on("message", (data) => {
			if (data === "graceful-exit") {
				app.quit();
			}
		});
	} else {
		process.on("SIGTERM", () => {
			app.quit();
		});
	}
}

// IPC handler to open file dialog
ipcMain.handle("open-file-dialog", async (event, options) => {
	const result = await dialog.showOpenDialog(options);
	return result.filePaths;
});

// IPC handler to open krona html file in browser
ipcMain.handle("open-krona", async (event, filePath) => {
	try {
		const htmlContent = fs.readFileSync(filePath, "utf-8");

		const kronaWindow = new BrowserWindow({
			width: 800,
			height: 600,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: false,
			},
		});

		kronaWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(htmlContent));
	} catch (error) {
		throw new Error(`Failed to read file: ${error.message}`);
	}
});

// To execute bin file for Metabuli
const mapPlatform = (platform) => {
	switch (platform) {
    case "win32": 
			return "win";
    case "darwin":
			return "mac";
    case "linux": 
			return "linux";
    default:      
			return "UNSUPPORTED-PLATFORM";
  }
};

const platform = os.platform();            // "darwin" | "win32" | "linux"
const folder   = mapPlatform(platform);    // "mac"    | "win"     | "linux"
		
// Determine the base path for binaries
// when packaged, electron-builder will have put your Makefile output under:
//   MyApp.app/Contents/Resources/resources/mac     (for mac)
//   MyApp-win-unpacked/resources/resources/win/x64 (for windows)
//   MyApp-linux/resources/resources/linux/{arm64,x64}
const baseResources = app.isPackaged
  ? join(process.resourcesPath, "resources", folder)
  : join(appRootDir.get(), "resources", folder);

// only Windows & Linux have arch sub-folders, mac has binaries directly in /resources/mac
const arch = os.arch(); // "x64" | "arm64"
const binPath = folder === "mac"
	? baseResources
	: join(baseResources, arch);

// METABULI BACKEND BINARY
const backendBinary = join(binPath, "metabuli" + (platform == "win32" ? ".bat" : ""));
let childProcess;
let backendCancelled = false;

ipcMain.on("run-backend", async (event, args) => {
	try {
		backendCancelled = false;

		// Extract params array and working directory
		const { params, workingDir = process.cwd() } = args;
		
		// Ensure params is an array before spreading
		if (!Array.isArray(params)) {
			throw new Error("Params must be an array");
		}

		// Set working directory before spawning the process
		// Run the backend process with params and set working directory
		childProcess = spawn(backendBinary, [...params], { cwd: workingDir });

		// Handle real-time stdout stream
		childProcess.stdout.on("data", (data) => {
			event.reply("backend-realtime-output", data.toString());
		});

		// Handle real-time stderr stream
		childProcess.stderr.on("data", (data) => {
			event.reply("backend-error", data.toString());
		});

		// Handle process exit
		childProcess.on("close", (code) => {
			if (backendCancelled) {
				event.reply("backend-cancelled", "Job processing was cancelled.");
			} else if (code !== 0) {
				event.reply("backend-error", `Backend process exited with code ${code}`);
			} else {
				event.reply("backend-complete", "Job processing was completed successfully.");
			}
		});
	} catch (error) {
		console.error(`Failed to run backend: ${error.message}`);
		event.reply("backend-error", `Failed to run backend: ${error.message}`);
	}
});

// IPC handler to cancel an ongoing backend job
ipcMain.on("cancel-backend", (event) => {
	if (childProcess) {
		backendCancelled = true;
		childProcess.kill();
	}
});

// FASTP QUALITY CONTROL BINARY
let fastpProcess;
let fastpCancelled = false;
ipcMain.on("run-fastp", async (event, args) => {
	try {
		fastpCancelled = false;
    const { params, workingDir = process.cwd() } = args;
    if (!Array.isArray(params)) throw new Error("Params must be an array");

		// Locate fastp binary
		const fastpBinary = join(binPath, "fastp" + (platform === "win32" ? ".exe" : ""));

		// Spawn fastp
		let fastpProcess = spawn(fastpBinary, [...params], { cwd: workingDir });

		// Handle stdout
		fastpProcess.stdout.on("data", (data) => {
			event.reply("fastp-output", data.toString());
		});

		// Send stderr to the regular log channel
		fastpProcess.stderr.on("data", data => {
			event.reply("fastp-output", data.toString());
		});

		// Handle completion
		// rely on the exit code to signal true errors
		fastpProcess.on("close", code => {
			if (fastpCancelled) {
        event.reply("fastp-cancelled", "Fastp process was cancelled.");
      } else if (code !== 0) {
        event.reply("fastp-error", `Fastp exited with code ${code}`);
      } else {
        event.reply("fastp-complete", "Fastp finished successfully.");
      }
      // clean up
      fastpProcess = null;
      fastpCancelled = false;
		});
	} catch (error) {
		console.error(`Failed to run fastp: ${error.message}`);
		event.reply("fastp-error", `Failed to run fastp: ${error.message}`);
	}
});

// IPC handler to cancel fastp
ipcMain.on("cancel-fastp", () => {
  if (fastpProcess) {
    fastpCancelled = true;
    fastpProcess.kill();
  }
});