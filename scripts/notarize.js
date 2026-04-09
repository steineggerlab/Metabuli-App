require("dotenv").config();
const { notarize } = require("@electron/notarize");

exports.default = async function notarizing(context) {
	console.log("afterSign hook triggered");
	const { electronPlatformName, appOutDir } = context;
	if (electronPlatformName !== "darwin") return;

	console.log("Starting notarization...");
	const appName = context.packager.appInfo.productFilename;
	await notarize({
		appPath: `${appOutDir}/${appName}.app`,
		appleId: process.env.APPLE_ID,
		appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
		teamId: process.env.APPLE_TEAM_ID,
	});
	console.log("Notarization complete");
};
