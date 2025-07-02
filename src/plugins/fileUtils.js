// Functions for handling filenames and paths
export function stripFileExtension(filePath) {
	// 1. Extract just the filename, dropping any directory
	const filename = extractFilename(filePath);

	// 2. Separate the filename base from its extension
	// Supported extensions: .fna, .fasta, .fa, .fq, .fastq, and their gzip versions (e.g., .fna.gz)
	const m = filename.match(
		/(.+?)((?:\.fna|\.fasta|\.fa|\.fq|\.fastq)(?:\.gz)?)$/i,
	);

	if (m) {
		return {
			base: m[1], // filename base, e.g. “SRR24315757_1”
			ext: m[2], // file extension, e.g. “.fastq” or “.fq.gz”
		};
	} else {
		return { base: filename, ext: "" }; // TODO: handle case where no extension is found
	}
}
