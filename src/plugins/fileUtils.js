/**
 * Ensure the output file has (or lacks) “.gz” depending on `compress`.
 *
 * @param {string} fileExtension  – full extension, base name, or just ".fq"/".fq.gz"
 * @param {boolean} compress – true  ➜ end with ".gz"
 *                             false ➜ remove ".gz" if present
 * @returns {string}         – adjusted string
 *
 * Examples:
 *   resolveFastqExt("sample.fq",    true)  ➜ "sample.fq.gz"
 *   resolveFastqExt("sample.fq.gz", true)  ➜ "sample.fq.gz"
 *   resolveFastqExt("sample.fq.gz", false) ➜ "sample.fq"
 *   resolveFastqExt(".fq",          false) ➜ ".fq"
 */
export function resolveFastpExtCompression(fileExtension, compress) {
	if (compress) {
		return fileExtension.endsWith(".gz")
			? fileExtension
			: fileExtension + ".gz";
	}
	// compress === false → strip one trailing ".gz" (if any)
	return fileExtension.replace(/\.gz$/, "");
}
