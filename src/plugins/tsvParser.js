export default {
	async readTSVFile(filePath) {
        // Read content from tsv file
		try {
			const tsvContent = await window.electron.readFile(filePath);
			return tsvContent;
		} catch (error) {
			console.error("Error reading TSV file:", error);
		}
	},

	tsvToJSON(tsv) {
        // Helper function to check for valid tsv data
		const validateReportTSVData = (records) => {
			const firstRecord = records[0];

			if (firstRecord === undefined) return false;

			return (
				(firstRecord.rank === "no rank" && firstRecord.taxon_id === "0" && firstRecord.name === "unclassified") ||
				(firstRecord.rank === "no rank" && firstRecord.taxon_id === "1" && firstRecord.name === "root")
			);
		};

		const headers = ["proportion", "clade_reads", "taxon_reads", "rank", "taxon_id", "name"];

		const lines = tsv.split("\n");
		// If first line is a header row (starts with “#”), remove it
		if (lines[0].trim().startsWith("#")) {
			lines.shift();
		}

		const records = lines
			.map((line) => {
				const data = line.split("\t"); // Strip leading and trailing whitespace

				let record = Object.fromEntries(headers.map((header, index) => [header, data[index]]));

				if (data[5]) {
					// Skip empty rows or rows with only whitespace
					const leadingSpacesInName = (data[5].match(/^\s+/) || [""])[0].length; // Count leading spaces in name
					const depth = Math.floor(leadingSpacesInName / 2); // Assuming 2 spaces per depth level
					record.depth = depth; // Depth based on indentation in front of scientific name in taxonomy report
					record.nameWithIndentation = record.name; // Store name with indentation from taxonomy report
					record.name = record.name.trim(); // Remove leading and trailing whitespace after counting leading spaces
					record.rank = record.rank === "superkingdom" ? "domain" : record.rank; // Convert 'superkingdom' to 'domain'
				}

				return record;
			})
			.filter((record) => !Object.values(record).every((field) => field === "" || field === undefined || field === null)); // Filter out empty rows

		// Validate report.tsv file
		if (validateReportTSVData(records)) {
			return { results: records };
		} else {
			return null; // Return null if the row does not meet the criteria
		}
	},
}; 