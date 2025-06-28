import { saveSvgAsPng } from "save-svg-as-png";
import * as d3 from "d3";

export function exportSankeyDiagram({
	sankeySvgElement,
	format,
	filename = "sankey_diagram",
}) {
	switch (format) {
		case "png":
			downloadSankeyAsPng(sankeySvgElement, filename);
			break;
		case "jpg":
			downloadSankeyAsJpg(sankeySvgElement, filename);
			break;
		case "svg":
			downloadSankeyAsSvg(sankeySvgElement, filename);
			break;
		default:
			return;
	}
}

export function downloadSankeyAsPng(sankeySvgElement, filename) {
	saveSvgAsPng(sankeySvgElement, `${filename}.png`);
}

export async function downloadSankeyAsJpg(sankeySvgElement, filename) {
	// Get the SVG element
	const svg = d3.select(sankeySvgElement);
	const svgString = new XMLSerializer().serializeToString(svg.node());

	// Set canvas size to match the SVG size
	const svgBBox = svg.node().getBBox();
	const width = svgBBox.width;
	const height = svgBBox.height;

	// Create a canvas element with increased resolution
	const scaleFactor = 3;
	const canvas = document.createElement("canvas");
	canvas.width = width * scaleFactor;
	canvas.height = height * scaleFactor;

	const context = canvas.getContext("2d");
	context.scale(scaleFactor, scaleFactor);

	// Draw white background
	context.fillStyle = "white";
	context.fillRect(0, 0, canvas.width, canvas.height);

	// Create an image and draw the SVG onto the canvas
	const img = new Image();
	img.onload = () => {
		context.drawImage(img, 0, 0);

		// Convert the canvas to a data URL (base64)
		const jpgDataUrl = canvas.toDataURL("image/jpeg", 1.0); // Quality parameter set to maximum (1.0)

		// Create a download link and click it
		const link = document.createElement("a");
		link.href = jpgDataUrl;
		link.download = `${filename}.jpg`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};
	img.src =
		"data:image/svg+xml;base64," +
		btoa(unescape(encodeURIComponent(svgString)));
}

export function downloadSankeyAsSvg(svgElement, filename) {
	const svgData = new XMLSerializer().serializeToString(svgElement);
	const svgBlob = new Blob([svgData], {
		type: "image/svg+xml;charset=utf-8",
	});
	const url = URL.createObjectURL(svgBlob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `${filename}.svg`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
