<template>
	<v-container>
		<!-- Required Fields -->
		<v-form ref="jobForm" v-model="isJobFormValid">
			<v-card-title class="text-button font-weight-bold">Required Fields</v-card-title>
			<div class="d-flex">
				<div class="w-66 search-required-fields">
					<v-container>
						<!-- End Type (single-end, paired-end, long-read) -->
						<v-row align="center">
							<v-col cols="3">
								<v-list-subheader class="pr-0">
									<v-tooltip location="top">
										<template v-slot:activator="{ props }">
											<v-icon v-bind="props" icon="$helpCircle" size="16" color="grey lighten-2">
											</v-icon>
										</template>
										Sequencing type of your samples.
									</v-tooltip>
									<span class="font-weight-bold"> Mode</span>
								</v-list-subheader>
							</v-col>

							<v-col>
								<v-btn-toggle v-model="jobDetails.mode" variant="outlined" color="primary" density="compact" divided
									mandatory>
									<v-btn value="paired-end" class="rounded-s-lg rounded-e-0 text-caption">Paired-end</v-btn>
									<v-btn value="single-end" class="rounded-e-0 rounded-s-0 text-caption">Single-end</v-btn>
									<v-btn value="long-read" class="rounded-e-lg rounded-s-0 text-caption">Long-read</v-btn>
								</v-btn-toggle>
							</v-col>
						</v-row>

						<!-- Fastp Toggle Switch -->
						<v-row align="center">
							<v-col cols="3">
								<v-list-subheader>
									<v-tooltip location="top">
										<template v-slot:activator="{ props }">
											<v-icon v-bind="props" icon="$helpCircle" size="16" color="grey lighten-2">
											</v-icon>
										</template>
										Enable it to preprocess raw reads before classification.
									</v-tooltip>
									<span class="font-weight-bold"> Quality Control</span>
								</v-list-subheader>
							</v-col>

							<v-col cols="1">
								<v-switch v-model="jobDetails.enableQC" color="primary" hide-details="true"></v-switch>
							</v-col>

							<v-col>
								<QCSettingsDialog v-model="showQCSettingsDialog" :mode="jobDetails.mode"
									:initialParams="jobDetails.fastpParams" @update-fastp-params="jobDetails.fastpParams = $event">
									<template v-slot:activator="{ props }">
										<v-btn v-bind="props" :disabled="!jobDetails.enableQC" variant="text" size="small"
											prepend-icon="$tune" color="primary">Settings</v-btn>
									</template>
								</QCSettingsDialog>
							</v-col>
						</v-row>

						<!-- Job ID -->
						<v-row>
							<v-col cols="3">
								<v-list-subheader>
									<v-tooltip location="top">
										<template v-slot:activator="{ props }">
											<v-icon v-bind="props" icon="$helpCircle" size="16" color="grey lighten-2">
											</v-icon>
										</template>
										TODO
									</v-tooltip>
									<span class="font-weight-bold"> Job ID</span>
								</v-list-subheader>
							</v-col>
							<v-col cols="6">
								<v-text-field v-model="jobDetails.jobid" :rules="[requiredRule]" :hint="computedHint" persistent-hint
									variant="outlined" density="compact" color="primary" rounded="lg" class="mb-2"></v-text-field>
							</v-col>
						</v-row>

						<!-- Query Files -->
						<v-row>
							<v-col cols="3">
								<v-list-subheader class="pr-0">
									<v-tooltip location="top">
										<template v-slot:activator="{ props }">
											<v-icon v-bind="props" icon="$helpCircle" size="16" color="grey lighten-2">
											</v-icon>
										</template>
										(gzipped) FASTA/Q query read files.
									</v-tooltip>
									<span class="font-weight-bold"> Query Files</span>
								</v-list-subheader>
							</v-col>

							<v-col cols="9" class="search-files">
								<v-row v-for="(entry, index) in jobDetails.entries" :key="index">
									<!-- Read 1 -->
									<v-col cols="5">
										<div v-if="!entry.q1">
											<v-btn @click="pickFile('file', 'q1', index)" prepend-icon="$file" density="comfortable"
												size="default" class="w-100 text-caption font-weight-medium rounded-lg text-uppercase">
												Read 1 File
											</v-btn>
										</div>
										<v-chip v-else label color="primary" density="comfortable" class="filename-chip">
											<v-icon icon="$delete" @click="clearFile('q1', index)" class="mr-1"></v-icon>
											{{ extractFilename(entry.q1) }}
										</v-chip>
										<v-text-field v-model="entry.q1" :rules="[requiredRule]" style="display: none"></v-text-field>
									</v-col>

									<!-- Read 2 -->
									<v-col cols="5" v-if="jobDetails.mode === 'paired-end'">
										<div v-if="!entry.q2">
											<v-btn @click="pickFile('file', 'q2', index)" prepend-icon="$file" density="comfortable"
												size="default" class="w-100 text-caption font-weight-medium rounded-lg text-uppercase">
												Read 2 File
											</v-btn>
										</div>
										<v-chip v-else label color="primary" density="comfortable" class="filename-chip">
											<v-icon icon="$delete" @click="clearFile('q2', index)" class="mr-1"></v-icon>
											{{ extractFilename(entry.q2) }}
										</v-chip>
										<v-text-field v-model="entry.q2"
											:rules="[jobDetails.mode === 'paired-end' ? requiredRule : () => true]"
											style="display: none"></v-text-field>
									</v-col>

									<!-- Remove Row Button -->
									<v-col cols="1" v-if="index > 0">
										<v-btn variant="text" icon="$checkboxIndeterminate" size="small" density="compact"
											@click="removeEntry(index)">
										</v-btn>
									</v-col>
								</v-row>

								<!-- Add Entry Button -->
								<v-row>
									<v-col cols="4">
										<v-btn variant="text" prepend-icon="$plusBox" @click="addEntry">Add Entry</v-btn>
									</v-col>
								</v-row>

								<!-- Database Directory -->
								<v-row>
									<v-col cols="6">
										<div class="d-flex flex-column align-center mb-0 gc-3">
											<v-btn @click="pickFile('directory', 'database')" prepend-icon="$folder" density="comfortable"
												size="default" class="w-100 text-caption font-weight-medium rounded-lg text-uppercase">Select
												Database</v-btn>
											<v-text-field v-model="jobDetails.database" :rules="[requiredRule]"
												style="display: none"></v-text-field>

											<!-- Database Download Button -->
											<v-btn color="primary" prepend-icon="$openInNew" variant="text"
												class="text-caption font-weight-medium" size="small" rounded="xl"
												href="https://metabuli.steineggerlab.workers.dev/" target="_blank">Database
												Download
											</v-btn>
										</div>
									</v-col>

									<v-col cols="6" class="filename-col">
										<v-chip v-if="jobDetails.database" label color="primary" density="comfortable"
											class="filename-chip">
											<v-icon icon="$delete" @click="clearFile('database')" class="mr-1"></v-icon>
											{{ extractFilename(jobDetails.database) }}</v-chip>
									</v-col>
								</v-row>

								<!-- Output Directory -->
								<v-row>
									<v-col cols="6">
										<v-btn @click="pickFile('directory', 'outdir')" prepend-icon="$folder" density="comfortable"
											size="default" class="w-100 text-caption font-weight-medium rounded-lg text-uppercase">Output
											Directory</v-btn>
										<v-text-field v-model="jobDetails.outdir" :rules="[requiredRule]"
											style="display: none"></v-text-field>
									</v-col>

									<v-col cols="6" class="filename-col">
										<v-chip v-if="jobDetails.outdir" label color="primary" density="comfortable" class="filename-chip">
											<v-icon icon="$delete" @click="clearFile('outdir')" class="mr-1"></v-icon>
											{{ extractFilename(jobDetails.outdir) }}</v-chip>
									</v-col>
								</v-row>
							</v-col>
						</v-row>

						<!-- --max-ram -->
						<v-row class="mt-4">
							<v-col cols="3">
								<v-list-subheader>
									<v-tooltip location="top">
										<template v-slot:activator="{ props }">
											<v-icon v-bind="props" icon="$helpCircle" size="16" color="grey lighten-2">
											</v-icon>
										</template>
										Maximum RAM to be used for the job.
									</v-tooltip>
									<span class="font-weight-bold"> Max RAM</span>
								</v-list-subheader>
							</v-col>
							<v-col cols="6">
								<v-text-field v-model="jobDetails.maxram" :rules="[...getValidationRules('--max-ram'), requiredRule]"
									variant="outlined" density="compact" color="primary" rounded="lg" suffix="GiB"></v-text-field>
							</v-col>
						</v-row>
					</v-container>
				</div>

				<!-- <v-divider vertical></v-divider> -->

				<!-- Output Format -->
				<!-- <v-card class="w-33" variant="text" >
					<v-card-title class="text-button font-weight-bold">Output Format</v-card-title>
					<v-card-subtitle>Lorem ipsum</v-card-subtitle>
				</v-card> -->

				<v-img class="w-33 marv-metabuli-opaque" :width="200" aspect-ratio="1/1" src="assets/marv_metabuli_small.png">
				</v-img>
			</div>

			<!-- ADVANCED SETTINGS -->
			<v-divider class="my-2"></v-divider>
			<v-card-actions>
				<v-btn text="Advanced Settings" :append-icon="expandAdvancedSettings ? '$collapse' : '$expand'"
					@click="expandAdvancedSettings = !expandAdvancedSettings" class="font-weight-bold"></v-btn>
			</v-card-actions>

			<!-- EXPANDABLE PANEL -->
			<v-expand-transition>
				<div v-if="expandAdvancedSettings" class="search-advanced-settings w-66 pt-0 pb-2">
					<!-- Parameters for precision mode -->
					<v-container class="py-0">
						<v-card variant="outlined" color="primary">
							<v-card-title class="text-subtitle-2 pb-0" style="white-space: normal; word-break: break-word;">
								Parameters for Precision Mode (Metabuli-P) <br>
								<span class="font-weight-regular" style="font-style: normal;">
									Recommended values below increase precision maintaing the F1 score. <br>
									These values are determined from score distributions of false and true positives in synthetic
									benchmarks.
									<br>
									(Details in Supp. Fig. 4-7 in the
									<a href="https://www.nature.com/articles/s41592-024-02273-y.epdf?sharing_token=je_2D5Su0-xVOSjuKSAXF9RgN0jAjWel9jnR3ZoTv0M7gE7NDF_xi_3sW8QdRiwfSJNwqaXItSoeCvr7cvcoQxKLt0oROgWc6urmki9tP80cXEuHPN0D7b4y9y3i8Yv7sZw8MxxhAj7W6p9eZE2zaK3eozdOkXvwADVfso9cXIM%3D"
										target="_blank" rel="noopener" class="text--primary">
										Metabuli paper
									</a>)
								</span>
							</v-card-title>
							<v-card-title class="text-caption">
								<span v-if="jobDetails.mode === 'long-read'">
									<strong>PacBio HiFi reads:</strong> --min-score 0.07 --min-sp-score 0.3<br />
									<strong>PacBio Sequel II reads:</strong> --min-score 0.005<br />
									<strong>ONT reads:</strong> --min-score 0.008
								</span>
								<span v-else> <strong>Illumina short reads:</strong> <code> --min-score 0.15 --min-sp-score 0.5 </code>
								</span>
							</v-card-title>
						</v-card>
					</v-container>

					<!-- Input fields -->
					<v-container fluid>
						<v-row v-for="(setting, key) in advancedSettings" :key="key">
							<v-col cols="8">
								<v-list-subheader class="pr-0 text-high-emphasis font-weight-medium">
									<code>{{ setting.title }}</code>
								</v-list-subheader>
								<small class="search-advanced-settings text-caption text-medium-emphasis pr-0">
									{{ setting.description }}
								</small>
							</v-col>

							<v-col>
								<v-text-field variant="outlined" rounded="lg" density="compact" color="primary"
									:placeholder="setting.extra?.file ? 'Select Folder' : none" v-model="setting.value"
									:prepend-icon="getAppendInnerIcon(setting)" :rules="getValidationRules(setting.parameter)"
									:suffix="setting.extra?.suffix || ''"
									v-on:click="handleAdvancedSettingsTextFieldClick(setting)"></v-text-field>
							</v-col>
						</v-row>
					</v-container>
				</div>
			</v-expand-transition>

			<!-- BUTTONS -->
			<v-sheet class="d-flex align-center my-2">
				<v-btn :disabled="!isJobFormValid" @click="startJob" color="primary">
					Run Metabuli
					<template v-slot:loader>
						<v-progress-circular indeterminate></v-progress-circular>
					</template>
				</v-btn>

				<v-btn variant="outlined" class="ml-3" @click="loadSampleData" color="primary"> Load Sample Data </v-btn>
			</v-sheet>
		</v-form>
	</v-container>
</template>

<script>
import TSVParser from "@/plugins/tsvParser";
import QCSettingsDialog from "@/components/quality-control-page/QCSettingsDialog.vue";
import { extractFilename, stripFileExtension } from "@/plugins/fileUtils.js";
import { makeCompletedJob, makeFailedJob } from "@/plugins/jobHistoryStruct.js";

export default {
	name: "NewSearchTab",
	components: {
		QCSettingsDialog,
	},
	data() {
		return {
			// Properties for Run New Search tab
			isJobFormValid: false,
			jobDetails: {
				// Store job details including file paths
				mode: "paired-end", // "paired-end" | "single-end" | "long-read"
				enableQC: false,
				entries: [
					{ q1: "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-revision/SRR14484345_10000_1.fq", q2: "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-revision/SRR14484345_10000_2.fq", batchName: "" }, // TODO: remove hardcoded path
					{ q1: "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-revision/SRR24315757_1.fastq", q2: "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-revision/SRR24315757_2.fastq", batchName: "" }, // TODO: remove hardcoded path
				],
				// database: "",
				database: "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-analysis/refseq_virus", // TODO: remove hardcoded path
				// outdir: "",
				outdir: "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-revision/OUTDIR", // TODO: remove hardcoded path
				jobid: "",
				maxram: "",

				fastpParams: {}, // Parameters for quality control (fastp/fastplong)
			},
			jobDetailsSample: {
				// Sample job details
				mode: "paired-end",
				enableQC: false,
				q1: "SRR14484345_1.fq",
				q2: "SRR14484345_2.fq",
				database: "refseq_virus",
				outdir: "/sample_data",
				jobid: "sample_data",
				maxram: 32,
			},
			expandAdvancedSettings: false,
			advancedSettings: {
				minScore: {
					title: "--min-score",
					description: "Search results of scores lower than this are discarded to reduce false positives at the cost of sensitivity. ",
					parameter: "--min-score",
					value: "0",
					type: "FLOAT",
				},
				minSpScore: {
					title: "--min-sp-score",
					description: "Reads with scores below this threshold are assigned to genus‐ or higher‐rank to avoid overconfident calls.",
					parameter: "--min-sp-score",
					value: "0",
					type: "FLOAT",
				},
				taxonomyPath: {
					title: "--taxonomy-path",
					description: "Use it when your database lacks 'taxonomy' directory or 'taxonomyDB' file to provide tax dump files.",
					parameter: "--taxonomy-path",
					value: "",
					type: "STRING",
					extra: {
						appendIcon: "folder",
						file: true,
					},
				},
				accessionLevel: {
					title: "--accession-level",
					description: "Set 1 to use accession level classification. It is available when the DB is also built with accession level taxonomy.",
					parameter: "--accession-level",
					value: "0",
					type: "INTEGER",
				},
				thread: {
					title: "--threads",
					description: "The number of threads used (all by default)",
					parameter: "--threads",
					value: "",
					type: "INTEGER",
				},
			},
			validationRules: {
				// Input is required
				"--max-ram": (value) => {
					return Number.isInteger(Number(value)) || "Input must be a valid integer";
				},
				"--threads": (value) => {
					// Input must be valid integer
					if (value === "" || value === null || value === undefined) {
						return true;
					}
					return Number.isInteger(Number(value)) || "Input must be a valid integer";
				},
				"--min-score": (value) => {
					// Input must be valid float
					if (value === "" || value === null || value === undefined) {
						return true;
					}
					return (!isNaN(value) && parseFloat(value) === Number(value)) || "Input must be a valid float";
				},
				"--min-sp-score": (value) => {
					// Input must be valid float
					if (value === "" || value === null || value === undefined) {
						return true;
					}
					return (!isNaN(value) && parseFloat(value) === Number(value)) || "Input must be a valid float";
				},
				"--reduced-aa": (value) => {
					// Input can be empty, or either numerical 0 or 1
					const isEmpty = value === "" || value === null || value === undefined;
					const validInputs = ["0", "1"];

					return isEmpty || validInputs.includes(value) || "Value must be 0 or 1";
				},
				"--accession-level": (value) => {
					// Input can be empty, or either numerical 0 or 1
					const isEmpty = value === "" || value === null || value === undefined;
					const validInputs = ["0", "1"];

					return isEmpty || validInputs.includes(value) || "Value must be 0 or 1";
				},
			}, // FIXME: move requiredRule to here

			// Properties for job processing status, response, and results
			status: "INITIAL",// "INITIAL" | "RUNNING" | "COMPLETE" | "ERROR" | "CANCELLED" | "TIMEOUT"
			results: "",
			backendOutput: "",
			processedResults: null,
			errorHandled: false,
		};
	},

	computed: {
		computedHint() {
			return `${this.jobDetails.jobid}_report.tsv`;
		},
		modeTag() {
			if (this.jobDetails.mode === "paired-end") {
				return "_PE";
			} else if (this.jobDetails.mode === "single-end") {
				return "_SE";
			} else {
				return "_LR";
			}
		},
	},

	watch: {
		// Watch both mode and entries array — update batch names when either changes
		'jobDetails.mode': 'updateBatchNames',
		'jobDetails.entries': {
			handler: 'updateBatchNames',
			deep: true,
			immediate: true
		}
	},

	methods: {
		// Button actions for adding/removing entry rows
		addEntry() {
			this.jobDetails.entries.push({ q1: "", q2: "" });
		},
		removeEntry(index) {
			if (this.jobDetails.entries.length > 1) {
				this.jobDetails.entries.splice(index, 1);
			}
		},
		// Functions for handling files
		async pickFile(type, field = null, index = null) {
			if (!window.electron) {
				this.$emit("trigger-snackbar", "File dialog is not supported in the web environment.", "error", "warning", "Dismiss");
				return;
			}

			try {
				const options = {
					properties: type === "file" ? ["openFile"] : ["openDirectory"],
				};
				const filePaths = await window.electron.openFileDialog(options);
				if (!filePaths?.length) return;

				const filePath = filePaths[0];
				if (index !== null && field) {
					// row entry
					this.jobDetails.entries[index][field] = filePath;
				} else if (field) {
					// top‐level field
					this.jobDetails[field] = filePath;
				} else {
					// no target field → return for ad-hoc use
					return filePath;
				}
			} catch (err) {
				console.error("File selection error:", err);
				this.$emit("trigger-snackbar", `File selection error: ${err}`, "error", "fileAlert", "Dismiss");
			} finally {
				// re-validate the form
				this.$refs.jobForm?.validate(); // TODO: do i need this

			}
		},
		clearFile(field, index = null) {
			if (index !== null) {
				// clear a row entry
				this.jobDetails.entries[index][field] = "";
			} else {
				// clear a top-level field
				this.jobDetails[field] = null;
			}
			// re-validate the form
			this.$refs.jobForm?.validate();
		},
		updateBatchNames() {
			this.jobDetails.entries.forEach(entry => {
				if (entry.q1) {
					const { base } = this.stripFileExtension(entry.q1);
					entry.batchName = base + this.modeTag;
				} else {
					entry.batchName = "";
				}
			});
		},
		extractFilename,
		stripFileExtension,

		// Functions handling validation rules
		requiredRule(value) {
			if (value === "" || value === null || value === undefined) {
				return "Required field *";
			}
			return true;
		},
		getValidationRules(parameter) {
			if (this.validationRules[parameter]) {
				return [this.validationRules[parameter]];
			}
			return [];
		},

		// Textfield functions for Advanced Settings (currently only applies to taxonomy path)
		getAppendInnerIcon(setting) {
			return setting.extra?.appendIcon ? `$${setting.extra.appendIcon}` : null;
		},
		async handleAdvancedSettingsTextFieldClick(setting) {
			if (setting.extra?.file) {
				const filePath = await this.pickFile("directory");
				setting.value = filePath;
			}
		},

		// Function for loading sample data report file
		async loadSampleData() {
			// Start loading dialog
			this.$emit("job-started", true);

			// Process report file
			await this.processResults(true);

			// Set log message
			this.backendOutput = "Sample data was loaded successfully.";

			const sampleReportFilePath = await window.electron.resolveFilePath(`${this.jobDetailsSample.outdir}/${this.jobDetailsSample.jobid}_report.tsv`, true);
			setTimeout(() => {
				// Object storing info about completedJob
				const completedJob = makeCompletedJob({
					jobDetails: this.jobDetailsSample,
					sampleNames: ["SRR14484345_1", "SRR14484345_2"],
					batchFolder: this.jobDetailsSample.outdir,
					isSample: true,
					jobType: "runSearch",
					backendOutput: this.backendOutput,
					processedResults: this.processedResults,
					reportFilePath: sampleReportFilePath,
				});

				// Store latest job in local storage for results rendering
				localStorage.setItem("processedResults", JSON.stringify(completedJob));

				// Store completed job in local storage
				this.$emit("store-job", completedJob);

				// Emit job-completed event: close loading dialog and expose results tab in navigation drawer
				this.$emit("job-completed", completedJob);

				// Clear backendOutput
				this.backendOutput = "";
			}, 2000); // Simulate a job taking 2 seconds
		},

		// Main job processing function
		async startJob() {
			// Reset job state
			this.status = "INITIAL";
			this.errorHandled = false;
			this.backendOutput = "";

			// Loop over each entry and run the job for each
			for (const entry of this.jobDetails.entries) {
				// Before each batch, reset status & backend‐output
				this.status = "RUNNING";
				this.errorHandled = false;
				this.backendOutput = "";
				this.$emit("job-started", false);

				try {
					// 1) Run that one batch's backend process
					await this.runOneEntry(entry);

					// 2) Poll until it flips to COMPLETE/ERROR (or times out)
					await this.pollJobStatus();

					// 3) If it succeeded, handle results for that batch:
					if (this.status === "COMPLETE") {
						await this.processResults(false, entry); // you can pass an argument pointing at batch folder if needed
						this.handleBatchSuccess(entry);
					}
				} catch (error) { // TODO: figure out how to handle errors in the loop (e.g. if one entry fails, the rest should still run)
					console.error(`Batch ${entry.batchName} failed:`, error);
					// console.error("Error:", error.message); // Single error handling point
					this.handleJobError(entry);
				} finally {
					// Save log file
					window.electron.writeFile(`${this.jobDetails.outdir}/${this.jobDetails.jobid}/${entry.batchName}/${this.jobDetails.jobid}_log.txt`, this.backendOutput).catch(console.error);
				}
			}

			// Once all batches are done (or attempted), reset top‐level UI state
			this.status = "INITIAL";
			this.backendOutput = "";
			this.errorHandled = false;
		},

		async runOneEntry(entry) {
			// 1) Build the batch‐specific output folder: `${outdir}/${jobid}/${batchName}`
			const outdir = this.jobDetails.outdir;
			const jobid = this.jobDetails.jobid;
			const batchName = entry.batchName;
			const batchFolder = `${outdir}/${jobid}/${batchName}`;
			// ensure that directory exists (recursively)
			await window.electron.mkdir(batchFolder); // returns a Promise if you exposed it; `await` in caller

			// Figure out file‐base names:
			const { base: base1, ext: ext1 } = this.stripFileExtension(entry.q1);
			let base2 = "", ext2 = "";
			if (this.jobDetails.mode === "paired-end" && entry.q2) {
				({ base: base2, ext: ext2 } = this.stripFileExtension(entry.q2));
			}

			// 2) If QC is enabled, run fastp first:
			let classifyRead1 = entry.q1;
			let classifyRead2 = entry.q2;

			if (this.jobDetails.enableQC) {
				const suffixQC = "_qc"; // you had this as const suffix = "_qc"

				const qcCmd = this.jobDetails.mode === 'long-read'
					? 'fastplong'
					: 'fastp';

				const qcParams = [
					qcCmd,
					"-h", `${batchFolder}/${batchName}.html`,
					"-j", `${batchFolder}/${batchName}.json`,
					"-i", entry.q1,
					"-o", `${batchFolder}/${base1}${suffixQC}${ext1}`
				];
				if (this.jobDetails.mode === "paired-end" && entry.q2) {
					qcParams.push(
						"-I", entry.q2,
						"-O", `${batchFolder}/${base2}${suffixQC}${ext2}`
					);
				}

				// Append fastp params from dialog
				if (this.jobDetails.fastpParams && this.jobDetails.fastpParams.length > 0) {
					qcParams.push(...this.jobDetails.fastpParams);
				} 

				console.log("🚀 fastp job requested:", qcParams);

				await new Promise((resolve, reject) => {
					const cleanupFastp = () => {
						window.electron.offFastpListeners();
					};

					// 2. Attach listeners
					window.electron.onFastpOutput((output) => {
						// console.log(output); // DEBUG
						this.backendOutput += output;
						this.$emit("backend-realtime-output", this.backendOutput);
						this.status = "RUNNING"; // Keep the status as RUNNING
					});
					window.electron.onFastpError((err) => {
						if (!this.errorHandled) {
							this.errorHandled = true; // Prevent multiple error handling
							this.backendOutput += "\nError:\n" + err.toString();
							this.status = "ERROR"; // Signal job polling to stop
							cleanupFastp();
							reject(new Error("Fastp execution error:", err));
						}
					});
					window.electron.onFastpComplete((msg) => {
						if (this.status !== "RUNNING") return; // Prevent processing if not in RUNNING state
						this.backendOutput += `${msg}\n`;
						this.status = "COMPLETE";
						cleanupFastp();
						resolve();
					});
					window.electron.onFastpCancelled((msg) => {
						if (!this.errorHandled) {
							this.errorHandled = true; // Prevent multiple error handling
							this.backendOutput += `\n${msg}`;
							this.status = "CANCELLED";
							cleanupFastp();
							reject(new Error("QC process was cancelled"));
						}
					});

					// 3. Start backend process
					window.electron.runFastp(qcParams, this.jobDetails.mode);
				});

				// After fastp finishes, update classifyRead1/2 so that classify uses QC outputs:
				classifyRead1 = `${batchFolder}/${base1}_qc${ext1}`;
				if (this.jobDetails.mode === "paired-end" && entry.q2) {
					classifyRead2 = `${batchFolder}/${base2}_qc${ext2}`;
				} else {
					classifyRead2 = null;
				}
			} // end if enableQC

			// 3) Now run “classify” on classifyRead1 (and classifyRead2 if paired)
			const classifyParams = ["classify"];
			if (this.jobDetails.mode === "single-end") {
				classifyParams.push("--seq-mode", 1, classifyRead1);
			} else if (this.jobDetails.mode === "paired-end") {
				classifyParams.push(classifyRead1, classifyRead2);
			} else {
				classifyParams.push("--seq-mode", 3, classifyRead1);
			}

			// Add dbdir, outdir (this batchFolder), jobid
			classifyParams.push(this.jobDetails.database, batchFolder, jobid);

			// Add max-ram if set
			if (this.jobDetails.maxram) {
				classifyParams.push("--max-ram", parseInt(this.jobDetails.maxram));
			}

			// Add any advancedSettings
			Object.values(this.advancedSettings).forEach(setting => {
				if (setting.value !== "" && setting.value !== undefined) {
					let val;
					if (setting.type === "INTEGER") val = parseInt(setting.value);
					else if (setting.type === "FLOAT") val = parseFloat(setting.value);
					else val = setting.value;
					classifyParams.push(setting.parameter, val);
				}
			});

			console.log("🚀 classify job requested:", classifyParams);

			// Return a promise that resolves when classify finishes (or rejects on error)
			return new Promise((resolve, reject) => {
				const cleanupClassify = () => {
					window.electron.offBackendRealtimeOutput();
					window.electron.offBackendComplete();
					window.electron.offBackendError();
					window.electron.offBackendCancelled();
				};

				window.electron.onBackendRealtimeOutput(output => {
					this.backendOutput += output;
					this.$emit("backend-realtime-output", this.backendOutput);
					this.status = "RUNNING";
				});

				window.electron.onBackendComplete(msg => {
					if (this.status !== "RUNNING") return;
					this.backendOutput += msg;
					this.status = "COMPLETE";
					cleanupClassify();
					resolve();
				});

				window.electron.onBackendError(err => {
					if (!this.errorHandled) {
						this.errorHandled = true;
						this.backendOutput += "\nError:\n" + err;
						this.$emit("backend-realtime-output", this.backendOutput);
						this.status = "ERROR";
						cleanupClassify();
						reject(new Error("classify execution error: " + err));
					}
				});

				window.electron.onBackendCancelled(msg => {
					if (!this.errorHandled) {
						this.errorHandled = true;
						this.backendOutput += `\n${msg}`;
						this.status = "CANCELLED";
						cleanupClassify();
						reject(new Error("classify cancelled"));
					}
				});

				window.electron.runBackend(classifyParams);
			});
		},

		// Poll for status flips to “COMPLETE” or “ERROR” (or TIMEOUT)
		async pollJobStatus(interval = 500, timeout = Infinity) {
			console.log("🚀 classify job running");
			const start = Date.now();
			while (Date.now() - start < timeout) {
				if (this.errorHandled || this.status === "COMPLETE") return true;
				if (this.status === "ERROR") throw new Error("Backend signaled ERROR");
				await new Promise(r => setTimeout(r, interval));
			}
		},

		// Function for processing results (shared for both tabs)
		async processResults(isSample, entry = null) {
			let reportFilePath;
			let kronaFilePath;

			// Resolve outdir path
			let resolvedOutdirPath;
			let jobId;

			let batchFolder = "";
			if (!isSample) {
				// Grab the last entry from jobDetails.entries
				// const lastEntry = this.jobDetails.entries[this.jobDetails.entries.length - 1];
				batchFolder = `${this.jobDetails.outdir}/${this.jobDetails.jobid}/${entry.batchName}`;
			}

			resolvedOutdirPath = isSample ? this.jobDetailsSample.outdir : batchFolder;
			jobId = isSample ? this.jobDetailsSample.jobid : this.jobDetails.jobid;

			// Set file paths for report and krona
			reportFilePath = await window.electron.resolveFilePath(`${resolvedOutdirPath}/${jobId}_report.tsv`, isSample);
			kronaFilePath = await window.electron.resolveFilePath(`${resolvedOutdirPath}/${jobId}_krona.html`, isSample);

			// Store report file path in session storage for later use (taxonomy verification)
			sessionStorage.setItem("reportFilePath", reportFilePath);

			// Read and process TSV and Krona HTML here
			const tsvData = await TSVParser.readTSVFile(reportFilePath);
			const jsonData = TSVParser.tsvToJSON(tsvData);
			const kronaContent = await this.readKronaHTML(kronaFilePath);

			// Store in component for emission
			this.processedResults = { jsonData, kronaContent };
		},
		async readKronaHTML(filePath) {
			if (!filePath) {
				// Results tab will hide krona tab for null
				return null;
			}

			try {
				const kronaHtml = await window.electron.readFile(filePath); //FIXME: too messy, edit readFile preload function
				return kronaHtml;
			} catch (error) {
				console.error("Error opening Krona viewer:", error);
			}
		},

		// Called once classify for one batch completes
		handleBatchSuccess(entry) {
			const jobid = this.jobDetails.jobid;
			const batchFolder = `${this.jobDetails.outdir}/${jobid}/${entry.batchName}`;

			// processResults(false) should look in batchFolder for jobid_report.tsv, etc.
			// this.processResults(false, entry).then(() => {
			const { base: sampleNameBase1 } = this.stripFileExtension(entry.q1);
			const { base: sampleNameBase2 } = this.stripFileExtension(entry.q2);
			const completedJob = makeCompletedJob({
				jobDetails: this.jobDetails,
				sampleNames: this.jobDetails.mode === "paired-end" ? [sampleNameBase1, sampleNameBase2] : [sampleNameBase1],
				batchFolder: batchFolder,
				isSample: false,
				jobType: "runSearch",
				backendOutput: this.backendOutput,
				processedResults: this.processedResults,
				reportFilePath: `${batchFolder}/${jobid}_report.tsv`
			});

			this.$emit("store-job", completedJob);
			localStorage.setItem(`processedResults`, JSON.stringify(completedJob));

			// Emit job-completed only if this is the last entry in the batch
			const isLastEntry = entry === this.jobDetails.entries[this.jobDetails.entries.length - 1];
			if (isLastEntry) {
				this.$emit("job-completed", completedJob);
			}
			// });
		},

		handleJobError(entry) {
			this.errorHandled = true; // Ensure flag is set to prevent further handling

			// Additional error handling logic (save failed job to local storage, trigger snackbar)

			// Create failed job object to store in local storage
			const { base: sampleNameBase1 } = this.stripFileExtension(entry.q1);
			const { base: sampleNameBase2 } = this.stripFileExtension(entry.q2);
			const failedJob = makeFailedJob({
				jobDetails: this.jobDetails,
				sampleNames: this.jobDetails.mode === "paired-end" ? [sampleNameBase1, sampleNameBase2] : [sampleNameBase1],
				backendOutput: this.backendOutput,
				status: this.status,
				jobType: "runSearch",
				isSample: false,
			});

			// Store completed job in local storage
			this.$emit("store-job", failedJob);

			// Trigger snackbar corresponding to case
			if (this.status === "CANCELLED") {
				this.$emit("trigger-snackbar", "Job was cancelled.", "info", "cancel", "Dismiss");
			} else if (this.status === "ERROR") {
				this.$emit("trigger-snackbar", "Invalid request. Check your query and try again.", "error", "warning", "Dismiss");
			} else {
				this.backendOutput += "\nError: An unexpected error occurred. Please try again.\n";
				this.$emit("backend-realtime-output", this.backendOutput);
				this.$emit("trigger-snackbar", "An unexpected error occurred. Please try again.", "error", "warning", "Dismiss");
				// TODO: leaves record in job history as 'INCOMPLETE', find out why
			}

			this.status = "ERROR"; // FIXME: do i need this; Set status to ERROR
		},
		handleTimeout() {
			window.electron.cancelBackend();
		},

		// Other helper functions
		getCurrentDateTime() {
			const now = new Date();

			// Format the date and time (YYYY-MM-DD_HH-MM-SS)
			const year = now.getFullYear();
			const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
			const day = String(now.getDate()).padStart(2, "0");
			const hours = String(now.getHours()).padStart(2, "0");
			const minutes = String(now.getMinutes()).padStart(2, "0");
			const seconds = String(now.getSeconds()).padStart(2, "0");

			return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
		},
	},

	mounted() {
		// On every page reload
		this.errorHandled = false; // Flag to ensure errors are handled only once

		// Prefill Job Details
		const totalRam = window.electron.getTotalRam(); // Get total RAM of current computer
		this.jobDetails.maxram = totalRam; // Set maxram to total RAM in GB
		this.jobDetails.jobid = this.getCurrentDateTime(); // Prefill Job ID with current timestamp
	},
};
</script>

<style scoped>
.v-col {
	padding-bottom: 0px;
}

.v-row {
	margin-top: 0px;
	margin-bottom: 0px;
}

.search-required-fields .v-col {
	padding-top: 0px;
}

.search-required-fields .v-list-subheader {
	min-height: 30px;
}

.search-required-fields .search-files .v-row {
	margin-bottom: 12px;
}

.search-required-fields .search-files .filename-col {
	padding-left: 0px;
}

:deep(.v-field__input),
:deep(.v-text-field__suffix) {
	padding-top: 4px !important;
	padding-bottom: 4px !important;
	min-height: 30px;
	font-size: 12px;
}

.filename-chip {
	padding-left: 8px;
	align-items: center;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

.search-advanced-settings .v-list-subheader {
	min-height: 0px;
}
</style>
