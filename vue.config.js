const webpack = require("webpack");
const { defineConfig } = require("@vue/cli-service");
const path = require("path");
const fs = require("fs");

const osMap = {
	darwin: "mac",
	win32: "win",
	linux: "linux",
};
const platformFolder = osMap[process.platform];

module.exports = defineConfig({
	transpileDependencies: true,

	outputDir: path.resolve(__dirname, "build"),

	configureWebpack: {
		plugins: [
			new webpack.DefinePlugin({
				__VUE_OPTIONS_API__: true, // Enable Options API
				__VUE_PROD_DEVTOOLS__: false, // Disable Vue DevTools in production
				__VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false, // Hide hydration mismatch details in production
			}),
		],
	},

	pluginOptions: {
		vuetify: {
			// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
		},
		electronBuilder: {
			preload: path.resolve(__dirname, "src/preload.js"), // Ensure this path is correct
			builderOptions: {
				directories: {
					output: "build", // Set the output directory for the built app
				},
				// Exclude binaries from asar packaging to prevent lipo conflicts
				asarUnpack: ["resources/**/*"],
				// Filter function to prevent lipo from processing already universal binaries
				beforePack: async (context) => {
					console.log("Before pack:", context.packager.platform.name);
				},
				extraResources: [
					{
						from: path.resolve(__dirname, "src/preload.js"), // Ensure this path is correct
						to: "preload.js",
						filter: ["**/*"],
					},
					{
						from: "public/sample_data",
						to: "sample_data",
						filter: ["**/*"],
					},
					{
						from: "public/assets",
						to: "assets",
						filter: ["**/*"],
					},
					{
						// copy everything under ./resources/<mac|win|linux> → build/.../Resources/bin
						// TODO: do i want to copy the whole resources folder? look at previous version
						from: path.resolve(__dirname, "resources"),
						to: "resources",
						filter: ["**/*"],
					},
					{
						from: path.resolve(__dirname, "docs"),
						to: "docs",
						filter: ["**/*"],
					},
					{
						from: "README.md",
						to: "README.md",
					},
				],

				// // Global artifactName for all platforms
				// artifactName: "${productName}-${version}-${os}-${arch}.${ext}",

				// Add icon paths for different platforms
				mac: {
					icon: path.resolve(__dirname, "src/assets/icons/icon.icns"),
					target: [
						{
							target: "dmg",
							arch: ["x64", "arm64"],
						},
					],
					artifactName: "${productName}-${version}-MacOS-${arch}.${ext}",
				},
				win: {
					icon: path.resolve(__dirname, "src/assets/icons/icon.ico"),
					target: [
						{
							target: "nsis",
							arch: ["x64"],
						},
					],
					artifactName: "${productName}-${version}-Windows-${arch}.${ext}",
				},
				linux: {
					category: "Science",
					icon: path.resolve(__dirname, "src/assets/icons/icon.png"),
					target: [
						{
							target: "AppImage",
							arch: ["x64", "arm64"],
						},
					],
					artifactName: "${productName}-${version}-Linux-${arch}.${ext}",
				},
				// Define the targets for the build
				afterPack: async (context) => {
					let resourcesPath;
					const platform = context.packager.platform.name;
					console.log("Target platform:", platform);

					if (platform === "mac") {
						const appName = context.packager.appInfo.productFilename;
						resourcesPath = path.join(
							context.appOutDir,
							`${appName}.app`,
							"Contents",
							"Resources",
						); // TODO: maybe bring bin folder back
					} else if (platform === "windows") {
						resourcesPath = path.join(context.appOutDir, "resources");
					} else if (platform === "linux") {
						resourcesPath = path.join(context.appOutDir, "resources");
					}

					console.log("Resources Path:", resourcesPath);

					if (!fs.existsSync(resourcesPath)) {
						console.error(`Path does not exist: ${resourcesPath}`);
						return;
					}

					// Updated binary path resolution
					const getBinaryPath = (platform) => {
						if (platform === "windows") {
							return path.join(
								resourcesPath,
								"resources",
								"win",
								"x64",
								"metabuli.bat",
							);
						} else if (platform === "mac") {
							return path.join(resourcesPath, "resources", "mac", "metabuli");
						} else if (platform === "linux") {
							// Check both x64 and arm64 based on the current build arch
							const arch = context.arch === "arm64" ? "arm64" : "x64";
							return path.join(
								resourcesPath,
								"resources",
								"linux",
								arch,
								"metabuli",
							);
						}
						return null;
					};

					const binaryPath = getBinaryPath(platform);

					if (binaryPath && fs.existsSync(binaryPath)) {
						try {
							fs.chmodSync(binaryPath, "755");
							console.log(`Permissions set for ${binaryPath}`);
							const stats = fs.statSync(binaryPath);
							console.log(`Permissions for ${binaryPath}:`, stats.mode);
						} catch (error) {
							console.error(
								`Failed to set permissions for ${binaryPath}: ${error.message}`,
							);
						}
					} else {
						console.warn(`Binary not found at ${binaryPath}`);
					}

					// Also set permissions for other binaries like fastp
					const additionalBinaries = [];
					if (platform === "mac") {
						additionalBinaries.push(
							path.join(resourcesPath, "resources", "mac", "fastp"),
							path.join(resourcesPath, "resources", "mac", "fastplong"),
						);
					} else if (platform === "linux") {
						const arch = context.arch === "arm64" ? "arm64" : "x64";
						if (arch === "x64") {
							// fastp only available for x64
							additionalBinaries.push(
								path.join(resourcesPath, "resources", "linux", "x64", "fastp"),
							);
						}
					} else if (platform === "windows") {
						additionalBinaries.push(
							path.join(resourcesPath, "resources", "win", "x64", "fastp.bat"),
							path.join(
								resourcesPath,
								"resources",
								"win",
								"x64",
								"fastplong.bat",
							),
						);
					}

					additionalBinaries.forEach((binary) => {
						if (fs.existsSync(binary)) {
							try {
								fs.chmodSync(binary, "755");
								console.log(`Permissions set for ${binary}`);
							} catch (error) {
								console.error(
									`Failed to set permissions for ${binary}: ${error.message}`,
								);
							}
						}
					});
				},
			},
		},
	},
});
