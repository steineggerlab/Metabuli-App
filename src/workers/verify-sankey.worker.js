/* eslint-disable no-restricted-globals */
import { extractTaxonomyArray } from "@/plugins/sankeyUtils";
/**
 * Utility that reproduces what compareTSVContents() did:
 *   – It receives the ORIGINAL report as a string                      (originalReportContent)
 *   – It receives nodesByDepth (array of depth-grouped Sankey nodes)   (nodesByDepth)
 *   – It rebuilds the “regenerated” TSV from nodesByDepth
 *   – It returns true | false | null
 */
self.onmessage = async (e) => {
	const { originalReportContent, nodesByDepth } = e.data;

	try {
		// ---------- 1. Extract taxonomy array from nodes ----------
		const extractedTaxonomyArray = extractTaxonomyArray(nodesByDepth);

		// ---------- 2. Regenerate TSV ----------
		const properties = [
			"proportion",
			"clade_reads",
			"taxon_reads",
			"rank",
			"taxon_id",
			"nameWithIndentation",
		];
		const regeneratedReport = extractedTaxonomyArray
			.map((node) =>
				properties
					.map((property) => {
						let val = node[property];
						// Treat undefined or null as empty string
						if (val === undefined || val === null) {
							return "";
						}
						// If this is the rank column and it was "root", switch back
						if (property === "rank" && val === "root") {
							return "no rank";
						}
						return val;
					})
					.join("\t"),
			)
			.join("\n");

		// ---------- 3. Compare ----------
		const identical = await compareTSVContents(
			regeneratedReport,
			originalReportContent,
		);
		postMessage({ result: identical }); // true / false
	} catch (err) {
		console.error("verify-sankey worker error:", err);
		postMessage({ result: null }); // null  → skip / error
	}
};

/* ------------------------- helpers -------------------------- */
async function compareTSVContents(
	regeneratedReportContent,
	originalReportContent,
) {
	try {
		// Read the TSV file content from the original report file
		// const originalReportContent = await window.electron.readFile(originalReportFile);

		// Split both contents into lines
		const regeneratedReportEntries = regeneratedReportContent
			.split("\n")
			.map((line) => line.trim())
			.filter(
				(line, idx) =>
					line !== "" && !(idx === 0 && line.trim().startsWith("#")),
			); // Remove empty lines and header row
		const originalReportEntries = originalReportContent
			.split("\n")
			.map((line) => line.trim())
			.filter(
				(line, idx) =>
					line !== "" && !(idx === 0 && line.trim().startsWith("#")),
			); // Remove empty lines and header row

		// Compare line counts
		if (regeneratedReportEntries.length !== originalReportEntries.length) {
			// console.log("The number of lines in the reports do not match.");
			// console.log(`Regenerated report: ${regeneratedReportEntries.length}, Original report: ${originalReportEntries.length}`);
			return false;
		}

		// Compare each line
		for (let i = 0; i < regeneratedReportEntries.length; i++) {
			const regeneratedEntryColumns = regeneratedReportEntries[i].split("\t");
			const originalEntryColumns = originalReportEntries[i].split("\t");

			if (regeneratedEntryColumns.length !== originalEntryColumns.length) {
				console.log(`Difference in column count on line ${i + 1}:`);
				// console.log(`Generated: ${regeneratedReportEntries[i]}`);
				// console.log(`File: ${originalReportEntries[i]}`);
				return false;
			}

			for (let j = 0; j < regeneratedEntryColumns.length; j++) {
				// Trim trailing whitespaces
				const trimTrailing = (str) => str.replace(/\s+$/, "");
				const generatedStringValue = trimTrailing(regeneratedEntryColumns[j]);
				const fileStringValue = trimTrailing(originalEntryColumns[j]);

				// Attempt to parse as numbers
				const generatedNumber = parseFloat(generatedStringValue);
				const fileNumber = parseFloat(fileStringValue);

				if (!isNaN(generatedNumber) && !isNaN(fileNumber)) {
					// Compare numeric values with a precision threshold
					const precisionThreshold = 0.0001;
					if (Math.abs(generatedNumber - fileNumber) > precisionThreshold) {
						// console.log(`Numeric difference found on line ${i + 1}, column ${j + 1}:`);
						// console.log(`Generated: ${generatedStringValue}`);
						// console.log(`File: ${fileStringValue}`);
						return false;
					}
				} else if (generatedStringValue !== fileStringValue) {
					// Compare as strings for non-numeric values
					// console.log(`String difference found on line ${i + 1}, column ${j + 1}:`);
					// console.log(`Generated: ${generatedStringValue}`);
					// console.log(`File: ${fileStringValue}`);

					// Ignore differences between "superkingdom" and "domain" ranks
					if (
						["superkingdom", "domain"].includes(generatedStringValue) &&
						["superkingdom", "domain"].includes(fileStringValue)
					) {
						continue;
					}

					return false;
				}
			}
		}

		// console.log("The TSV contents are identical.");
		return true;
	} catch (error) {
		console.error(`Error comparing TSV contents: ${error.message}`);
		return false;
	}
}
