import { marked } from "marked";

export async function loadMarkdownAsHtml(mdRelativePath) {
	// “mdRelativePath” should be relative to your app’s `resources` folder
	// in production, or to the project root in dev.
	const readmePath =
		process.env.NODE_ENV === "production"
			? await window.electron.resolveFilePath(mdRelativePath, true) // TODO: fix path issue
			: await window.electron.resolveFilePath(`../${mdRelativePath}`, true);

	// Read the file contents
	const rawMd = await window.electron.readFile(readmePath);

	// Convert Markdown → HTML
	let html = marked(rawMd);

	// Force every <a> to open in a new tab/window
	html = html.replace(
		/<a\s+/g,
		'<a target="_blank" rel="noopener noreferrer" ',
	);

	return html;
}
