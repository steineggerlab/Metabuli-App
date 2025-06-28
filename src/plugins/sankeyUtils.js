// Generates taxonomy report from Sankey nodes
export function extractTaxonomyArray(nodesByDepth) {
	const taxonomyReport = [];
	const depthDict = nodesByDepth;

	// Sort nodes in each depth in descending order of clade_reads
	Object.keys(depthDict).forEach((depth) => {
		depthDict[depth].sort((a, b) => b.clade_reads - a.clade_reads);
	});

	Object.keys(depthDict)
		.map(Number)
		.sort((a, b) => a - b) // Sort depthDict in ascending order of depth
		.forEach((depth) => {
			if (depth > 0) {
				depthDict[depth - 1]?.forEach((parentNode) => {
					const parentIndex = taxonomyReport.findIndex(
						(n) => n.taxon_id === parentNode.taxon_id,
					);

					if (parentIndex !== -1) {
						taxonomyReport.splice(parentIndex + 1, 0, ...parentNode.children);
					} else {
						console.warn(
							`Parent node ${parentNode.name} not found in taxonomyReport.`,
						);
					}
				});
			} else {
				depthDict[depth].sort((a, b) => a.taxon_id - b.taxon_id);
				taxonomyReport.push(...depthDict[depth]);
			}
		});
	return taxonomyReport;
}

export async function compareTSVContents(
	regeneratedReportContent,
	originalReportFile,
) {
	try {
		// Read the TSV file content from the original report file
		const originalReportContent =
			await window.electron.readFile(originalReportFile);

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

export async function saveTSVFile(content, filePath) {
	// FIXME: remove
	try {
		await window.electron.writeFile(filePath, content);
		// console.log("File saved successfully:", filePath);
	} catch (error) {
		console.error("Error saving file:", error);
	}
}
