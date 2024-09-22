"use strict";

import {
  app,
  protocol,
  BrowserWindow,
  screen,
  ipcMain,
  dialog,
  shell,
} from "electron";
const { execFile, spawn } = require("child_process");
import { createProtocol } from "vue-cli-plugin-electron-builder/lib";
import installExtension, { VUEJS3_DEVTOOLS } from "electron-devtools-installer";
import fs from "fs";
import { join } from "path";
import { default as os } from "os";
import appRootDir from "app-root-dir";

const isDevelopment = process.env.NODE_ENV !== "production";

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { secure: true, standard: true } },
]);

async function createWindow() {
  // Wait for the app to be ready
  await app.whenReady();

  // Get the primary display
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  const win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 1000,
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

    kronaWindow.loadURL(
      "data:text/html;charset=utf-8," + encodeURIComponent(htmlContent)
    );
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
});

// To execute bin file for Metabuli
const platform = os.platform();
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

let childProcess;
let backendCancelled = false;
const binPath = app.isPackaged
  ? join(process.resourcesPath, "bin") // 'production' process.resourcesPath=metabuli-app/build/mac-universal--x64/Metabuli App.app/Contents/Resources
  : join(appRootDir.get(), "resources", mapPlatform(platform), os.arch());
const backendBinary = join(
  binPath,
  "metabuli" + (platform == "win32" ? ".bat" : "")
);

ipcMain.on("run-backend", async (event, args) => {
  try {
    backendCancelled = false;
    childProcess = spawn(backendBinary, args);

    // Handle real-time stdout stream
    childProcess.stdout.on("data", (data) => {
      event.reply("backend-realtime-output", data.toString());
    });

    // Handle real-time stderr stream
    childProcess.stderr.on("data", (data) => {
      console.error(`Backend stderr: ${data.toString()}`);
      event.reply("backend-error", data.toString());
    });

    // Handle process exit
    childProcess.on("close", (code) => {
      if (backendCancelled) {
        event.reply("backend-cancelled", "Job processing was cancelled.");
      } else if (code !== 0) {
        event.reply(
          "backend-error",
          `Backend process exited with code ${code}`
        );
      } else {
        event.reply(
          "backend-complete",
          "Job processing was completed successfully."
        );
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
