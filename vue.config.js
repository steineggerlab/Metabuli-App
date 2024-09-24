const webpack = require("webpack");
const { defineConfig } = require("@vue/cli-service");
const path = require("path");
const fs = require("fs");

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
						from: "resources/${os}/${arch}",
						to: "bin",
						filter: ["**/*"],
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
							arch: ["universal"],
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
				target: ["mac", "win", "linux"],
				afterPack: async (context) => {
					let resourcesPath;
					const platform = context.packager.platform.name;
					console.log("Target platform:", platform);

					if (platform === "mac") {
						const appName = context.packager.appInfo.productFilename;
						resourcesPath = path.join(context.appOutDir, `${appName}.app`, "Contents", "Resources", "bin");
					} else if (platform === "windows") {
						resourcesPath = path.join(context.appOutDir, "resources", "bin");
					} else if (platform === "linux") {
						resourcesPath = path.join(context.appOutDir, "resources", "bin");
					}
					console.log("Resources Path:", resourcesPath);

					if (!fs.existsSync(resourcesPath)) {
						console.error(`Path does not exist: ${resourcesPath}`);
						return;
					}

					const binaries = [path.join(resourcesPath, "metabuli" + (platform == "windows" ? ".bat" : ""))];

					binaries.forEach((binary) => {
						try {
							fs.chmodSync(binary, "755");
							console.log(`Permissions set for ${binary}`);
							const stats = fs.statSync(binary);
							console.log(`Permissions for ${binary}:`, stats.mode);
						} catch (error) {
							console.error(`Failed to set permissions for ${binary}: ${error.message}`);
						}
					});
				},
			},
		},
	},
});
