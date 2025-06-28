export const CITATIONS = {
	metabuli: {
		name: "Metabuli",
		plaintext: `Kim, J., Steinegger, M. Metabuli: sensitive and specific metagenomic classification via joint analysis of amino acid and DNA. Nat Methods 21, 971–973 (2024). https://doi.org/10.1038/s41592-024-02273-y`,
		bibtex: `@article{kim2024metabuli,
  title={{Metabuli: sensitive and specific metagenomic classification via joint analysis of amino acid and DNA}},
  author={Kim, Jaebeom and Steinegger, Martin},
  journal={Nature Methods},
  volume={21},
  pages={971--973},
  year={2024},
  publisher={Nature Publishing Group US New York}
}`,
	},
	fastp: {
		name: "fastp",
		plaintext: `Chen, Shifu. 2023. “ Ultrafast one-pass FASTQ data preprocessing, quality control, and deduplication using fastp.” iMeta 2, e107. https://doi.org/10.1002/imt2.107`,
		bibtex: `@article{chen2023ultrafast,
  title={Ultrafast one-pass FASTQ data preprocessing, quality control, and deduplication using fastp},
  author={Chen, Shifu},
  journal={Imeta},
  volume={2},
  number={2},
  pages={e107},
  year={2023},
  publisher={Wiley Online Library}
}`,
	},
};

export function formatCitations(citations = []) {
	return citations
		.map(
			(c) => `# Cite ${c.name}\nplaintext: ${c.plaintext}\nbibtex: ${c.bibtex}`,
		)
		.join("\n\n");
}
