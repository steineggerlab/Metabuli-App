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
								<v-list-subheader>Mode</v-list-subheader>
							</v-col>

							<v-col>
								<v-btn-toggle v-model="jobDetails.mode" variant="outlined" color="primary" density="compact" divided mandatory>
									<v-btn value="single-end" class="rounded-s-lg rounded-e-0 text-caption">Single-end</v-btn>
									<v-btn value="paired-end" class="rounded-e-0 rounded-s-0 text-caption">Paired-end</v-btn>
									<v-btn value="long-read" class="rounded-e-lg rounded-s-0 text-caption">Long-read</v-btn>
								</v-btn-toggle>
							</v-col>
						</v-row>

						<!-- Fastp Toggle Switch -->
						<v-row align="center">
							<v-col cols="3">
								<v-list-subheader>Enable Fastp</v-list-subheader>
							</v-col>

							<v-col cols="1">
								<v-switch v-model="jobDetails.fastp" color="primary" hide-details="true"></v-switch>
							</v-col>
							<v-col>
								<v-btn variant="text" size="small" prepend-icon="$tune" color="primary" :disabled="!jobDetails.fastp">Settings</v-btn>
							</v-col>
						</v-row>

						<!-- Job ID -->
						<v-row>
							<v-col cols="3">
								<v-list-subheader>Job ID</v-list-subheader>
							</v-col>
							<v-col>
								<v-text-field
									v-model="jobDetails.jobid"
									:rules="[requiredRule]"
									:hint="computedHint"
									persistent-hint
									variant="outlined"
									density="compact"
									color="primary"
									rounded="lg"
									class="mb-2"
								></v-text-field>
							</v-col>
						</v-row>

						<!-- Select Files -->
						<v-row>
							<v-col cols="3">
								<v-list-subheader class="pr-0">Select Files</v-list-subheader>
							</v-col>

							<v-col cols="9" class="search-files">
								<!-- Q1 File -->
								<v-row>
									<v-col cols="6">
										<v-btn @click="selectFile('q1', 'file')" prepend-icon="$file" density="comfortable" size="default" class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
											>Read 1 File</v-btn
										>
										<v-text-field v-model="jobDetails.q1" :rules="[requiredRule]" style="display: none"></v-text-field>
									</v-col>
									<v-col cols="6" class="filename-col">
										<v-chip v-if="jobDetails.q1" label color="primary" density="comfortable" class="filename-chip">
											<v-icon icon="$delete" @click="clearFile('q1')" class="mr-1"></v-icon>
											{{ this.extractFilename(jobDetails.q1) }}</v-chip
										>
									</v-col>
								</v-row>

								<!-- Q2 File -->
								<v-row v-if="jobDetails.mode === 'paired-end'">
									<v-col cols="6">
										<v-btn @click="selectFile('q2', 'file')" prepend-icon="$file" density="comfortable" size="default" class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
											>Read 2 File</v-btn
										>
										<v-text-field v-model="jobDetails.q2" :rules="[jobDetails.mode === 'paired-end' ? requiredRule : () => true]" style="display: none"></v-text-field>
									</v-col>

									<v-col cols="6" class="filename-col">
										<v-chip v-if="jobDetails.q2" label color="primary" density="comfortable" class="filename-chip">
											<v-icon icon="$delete" @click="clearFile('q2')" class="mr-1"></v-icon>
											{{ this.extractFilename(jobDetails.q2) }}</v-chip
										>
									</v-col>
								</v-row>

								<!-- Database Directory -->
								<v-row>
									<v-col cols="6">
										<div class="d-flex flex-column align-center mb-0 gc-3">
											<v-btn
												@click="selectFile('database', 'directory')"
												prepend-icon="$folder"
												density="comfortable"
												size="default"
												class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
												>Select Database</v-btn
											>
											<v-text-field v-model="jobDetails.database" :rules="[requiredRule]" style="display: none"></v-text-field>

											<!-- Database Download Button -->
											<v-btn
												color="primary"
												prepend-icon="$openInNew"
												variant="text"
												class="text-caption font-weight-medium"
												size="small"
												rounded="xl"
												href="https://metabuli.steineggerlab.workers.dev/"
												target="_blank"
												>Database Download
											</v-btn>
										</div>
									</v-col>

									<v-col cols="6" class="filename-col">
										<v-chip v-if="jobDetails.database" label color="primary" density="comfortable" class="filename-chip">
											<v-icon icon="$delete" @click="clearFile('database')" class="mr-1"></v-icon>
											{{ this.extractFilename(jobDetails.database) }}</v-chip
										>
									</v-col>
								</v-row>

								<!-- Output Directory -->
								<v-row>
									<v-col cols="6">
										<v-btn
											@click="selectFile('outdir', 'directory')"
											prepend-icon="$folder"
											density="comfortable"
											size="default"
											class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
											>Output Directory</v-btn
										>
										<v-text-field v-model="jobDetails.outdir" :rules="[requiredRule]" style="display: none"></v-text-field>
									</v-col>

									<v-col cols="6" class="filename-col">
										<v-chip v-if="jobDetails.outdir" label color="primary" density="comfortable" class="filename-chip">
											<v-icon icon="$delete" @click="clearFile('outdir')" class="mr-1"></v-icon>
											{{ this.extractFilename(jobDetails.outdir) }}</v-chip
										>
									</v-col>
								</v-row>
							</v-col>
						</v-row>

						<!-- --max-ram -->
						<v-row class="mt-2">
							<v-col cols="3">
								<v-list-subheader>Max RAM</v-list-subheader>
							</v-col>
							<v-col>
								<v-text-field
									v-model="jobDetails.maxram"
									:rules="[...getValidationRules('--max-ram'), requiredRule]"
									variant="outlined"
									density="compact"
									color="primary"
									rounded="lg"
									suffix="GiB"
								></v-text-field>
							</v-col>
						</v-row>
					</v-container>
				</div>

				<v-img class="w-33 marv-metabuli-opaque" :width="300" aspect-ratio="1/1" src="assets/marv_metabuli_small.png"> </v-img>
			</div>

			<!-- ADVANCED SETTINGS -->
			<v-divider class="my-2"></v-divider>
			<v-card-actions>
				<v-btn text="Advanced Settings" :append-icon="expandAdvancedSettings ? '$collapse' : '$expand'" @click="expandAdvancedSettings = !expandAdvancedSettings" class="font-weight-bold"></v-btn>
			</v-card-actions>

			<!-- EXPANDABLE PANEL -->
			<v-expand-transition>
				<div v-if="expandAdvancedSettings" class="search-advanced-settings w-66 pt-0 pb-2">
					<!-- Parameters for precision mode -->
					<v-container class="py-0">
						<v-card variant="outlined" color="primary">
							<v-card-title class="text-subtitle-2 pb-0">Parameters for precision mode (Metabuli-P)</v-card-title>
							<v-card-title class="text-caption">
								<span v-if="jobDetails.mode === 'long-read'">
									<strong>PacBio HiFi reads:</strong> --min-score 0.07 --min-sp-score 0.3<br />
									<strong>PacBio Sequel II reads:</strong> --min-score 0.005<br />
									<strong>ONT reads:</strong> --min-score 0.008
								</span>
								<span v-else> <strong>Illumina short reads:</strong> --min-score 0.15 --min-sp-score 0.5 </span>
							</v-card-title>
						</v-card>
					</v-container>

					<!-- Input fields -->
					<v-container fluid>
						<v-row v-for="(setting, key) in advancedSettings" :key="key">
							<v-col cols="7">
								<v-list-subheader class="pr-0 text-high-emphasis font-weight-medium">
									{{ setting.title }}
								</v-list-subheader>
								<small class="search-advanced-settings text-caption text-medium-emphasis pr-0" >
									{{ setting.description }}
								</small>
							</v-col>

							<v-col>
								<v-text-field
									variant="outlined"
									rounded="lg"
									density="compact"
									color="primary"
									:placeholder="setting.extra?.file ? 'Select Directory' : none"
									v-model="setting.value"
									:prepend-icon="getAppendInnerIcon(setting)"
									:rules="getValidationRules(setting.parameter)"
									:suffix="setting.extra?.suffix || ''"
									v-on:click="handleAdvancedSettingsTextFieldClick(setting)"
								></v-text-field>
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

export default {
	name: "NewSearchTab",

	data() {
		return {
			// Properties for Run New Search tab
			isJobFormValid: false,
			jobDetails: {
				// Store job details including file paths
				mode: "single-end",
				fastp: false,
				q1: "",
				q2: "",
				database: "",
				outdir: "",
				jobid: "",
				maxram: "",
			},
			jobDetailsSample: {
				// Sample job details
				mode: "paired-end",
				q1: "SRR14484345_1.fq",
				q2: "SRR14484345_2.fq",
				database: "refseq_virus",
				jobid: "sample_data",
				outdir: "/sample_data",
				maxram: 128,
			},
			expandAdvancedSettings: false,
			advancedSettings: {
				thread: {
					title: "Threads",
					description: "The number of threads used (all by default)",
					parameter: "--threads",
					value: "",
					type: "INTEGER",
				},
				minScore: {
					title: "Min Score",
					description: "The minimum score to be classified",
					parameter: "--min-score",
					value: "",
					type: "FLOAT",
				},
				minSpScore: {
					title: "Min SP Score",
					description: "The minimum score to be classified at or below species rank.",
					parameter: "--min-sp-score",
					value: "",
					type: "FLOAT",
				},
				taxonomyPath: {
					title: "Taxonomy Path",
					description: "Directory where the taxonomy dump files are stored. (DBDIR/taxonomy by default)",
					parameter: "--taxonomy-path",
					value: "",
					type: "STRING",
					extra: {
						appendIcon: "folder",
						file: true,
					},
				},
				// reducedAA: {
				//   title: "Reduced AA",
				//   description:
				//     "0. Use 20 alphabets or 1. Use 15 alphabets to encode amino acids. Give the same value used for DB creation.",
				//   parameter: "--reduced-aa", // FIXME: 엥 왜 안돼
				//   value: "",
				//   type: "INTEGER",
				// },
				accessionLevel: {
					title: "Accession Level",
					description: "Set 1 to use accession level classification (0 by default). It is available when the DB is also built with accession level taxonomy.",
					parameter: "--accession-level",
					value: "0",
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
			status: "INITIAL",
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
	},

	methods: {
		// Functions for handling files
		async selectFile(field, type) {
			// FIXME: unify with UPLOAD REPORT TAB file selector function
			if (window.electron) {
				try {
					const options = {
						properties: type === "file" ? ["openFile"] : ["openDirectory"],
					};
					const filePaths = await window.electron.openFileDialog(options);
					if (filePaths && filePaths.length > 0) {
						if (!field) {
							return filePaths[0];
						}
						this.jobDetails[field] = filePaths[0];
					}
				} catch (error) {
					console.error("Error selecting file:", error); // DEBUG
					this.$emit("trigger-snackbar", `File selection error: ${error}`, "error", "fileAlert", "Dismiss");
				}
			} else {
				console.error("File dialog is not supported in the web environment."); // DEBUG
				this.$emit("trigger-snackbar", "File dialog is not supported in the web environment.", "error", "warning", "Dismiss");
			}
		},
		extractFilename(path) {
			return path.split("/").pop();
		},
		clearFile(field) {
			this.jobDetails[field] = null;
			this.$refs.jobForm.validate();
		},

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
				const filePath = await this.selectFile(null, "directory");
				setting.value = filePath;
			}
		},

		// Start backend job request
		async startJob() {
			try {
				// Start loading dialog
				this.status = "RUNNING";
				this.$emit("job-started", false);

				// Start backend request and job polling simultaneously
				const backendPromise = this.runBackend();
				const pollingPromise = this.pollJobStatus();

				// Wait for either backend to complete or polling to timeout/fail
				await Promise.race([backendPromise, pollingPromise]);

				// If backend completes successfully and polling hasn't timed out
				if (this.status === "COMPLETE") {
					await this.processResults(false); // Make sure this is called after backend completion
					this.handleJobSuccess();
				}
			} catch (error) {
				console.error("Error:", error.message); // Single error handling point
				this.handleJobError(error);
			} finally {
				if (this.status !== "COMPLETE") {
					this.status = "INITIAL";
				}
				this.errorHandled = false; // Resets error handled tracking
				this.backendOutput = ""; // Clear backendOutput

				// Remove any previously attached event listeners
				window.electron.offBackendRealtimeOutput(); // Custom off method for the event
				window.electron.offBackendComplete();
				window.electron.offBackendError();
				window.electron.offBackendCancelled();
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
				const completedJob = {
					jobDetails: this.jobDetailsSample,
					outdir: this.jobDetailsSample.outdir,
					jobid: this.jobDetailsSample.jobid,
					isSample: true,
					jobStatus: "Completed",
					jobType: "runSearch",
					backendOutput: this.backendOutput,
					resultsJSON: this.processedResults.jsonData.results,
					kronaContent: this.processedResults.kronaContent,
					reportFilePath: sampleReportFilePath,
				};

				// Store latest job in local storage for results rendering
				localStorage.setItem("processedResults", JSON.stringify(completedJob));

				// Store completed job in local storage
				this.$emit("store-job", completedJob);

				// Emit job-completed event: close loading dialog and expose results tab in navigation drawer
				this.$emit("job-completed", completedJob);

				// Trigger snackbar
				// this.$emit("trigger-snackbar", "Sample data successfully loaded.", "success", "success", "View", () => {
				// 	this.$router.push({ name: "ResultsPage" });
				// });

				// Clear backendOutput
				this.backendOutput = "";
			}, 2000); // Simulate a job taking 2 seconds
		},

		async runBackend() {
			let params = ["classify"];

			// Add input
			if (this.jobDetails.mode === "single-end") {
				params.push("--seq-mode", 1, this.jobDetails.q1);
			} else if (this.jobDetails.mode === "paired-end") {
				params.push(this.jobDetails.q1, this.jobDetails.q2);
			} else if (this.jobDetails.mode === "long-read") {
				params.push("--seq-mode", 3, this.jobDetails.q1);
			}

			// Add dbdir, outdir, jobid
			params.push(this.jobDetails.database, this.jobDetails.outdir, this.jobDetails.jobid);

			// Add max-ram
			if (this.jobDetails.maxram !== "") {
				params.push("--max-ram", parseInt(this.jobDetails.maxram));
			}

			// Add advanced settings
			for (const key in this.advancedSettings) {
				let value;
				const setting = this.advancedSettings[key];
				if (setting.value !== "" && setting.value !== undefined) {
					switch (setting.type) {
						case "INTEGER":
							value = parseInt(setting.value);
							break;
						case "FLOAT":
							value = parseFloat(setting.value);
							break;
						default:
							value = setting.value;
					}
					params.push(setting.parameter, value);
				}
			}

			// TEST PARAMS
			// params = [
			//   "classify",
			//   "--seq-mode",
			//   1,
			//   "/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/SRR14484345_1.fq",
			//   "/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/refseq_virus",
			//   "/Users/sunnylee/Documents/Steinegger Lab/metabuli_example",
			//   "",
			//   "--max-ram",
			//   32,
			// ];

			console.log("🚀 Job requested:", params); // DEBUG

			// Return a promise that resolves or rejects based on backend success or failure
			return new Promise((resolve, reject) => {
				// Run backend process
				window.electron.runBackend(params);

				// Real-time output
				window.electron.onBackendRealtimeOutput((output) => {
					this.backendOutput += output; // Append output in real-time
					this.$emit("backend-realtime-output", this.backendOutput);
					this.status = "RUNNING"; // Keep the status as RUNNING
				});

				window.electron.onBackendComplete((message) => {
					if (this.status !== "RUNNING") return; // Prevent processing if not in RUNNING state
					this.backendOutput += message;
					this.status = "COMPLETE"; // Signal job polling
					resolve(); // Resolve the backend promise
				});

				window.electron.onBackendError((error) => {
					if (!this.errorHandled) {
						const message = "\nJob processing was terminated due to an error.";
						this.backendOutput += message;
						this.status = "ERROR"; // Signal job polling to stop
						reject(new Error("Backend execution error:", error));
					}
				});

				window.electron.onBackendCancelled((message) => {
					if (this.status !== "TIMEOUT" && !this.errorHandled) {
						this.backendOutput += message;
						this.status = "CANCELLED";
						reject(new Error("Process was cancelled"));
					}
				});
			});
		},

		// Function to track job status + process results + trigger snackbar
		async pollJobStatus(interval = 500, timeout = Infinity) {
			// FIXME: decide timeout duration
			console.log("🚀 Running job"); // DEBUG
			const start = Date.now();
			while (Date.now() - start < timeout) {
				if (this.errorHandled || this.status === "COMPLETE") return true;

				if (this.status === "ERROR") {
					throw new Error("Backend error occurred");
				}
				await new Promise((resolve) => setTimeout(resolve, interval));
			}
			if (!this.errorHandled) {
				this.status = "TIMEOUT";
				throw new Error("Polling timed out");
			}
		},

		// Function for processing results (shared for both tabs)
		async processResults(isSample) {
			let reportFilePath;
			let kronaFilePath;

			// Resolve outdir path
			let resolvedOutdirPath;
			let jobId;

			resolvedOutdirPath = isSample ? this.jobDetailsSample.outdir : this.jobDetails.outdir;
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
		handleJobSuccess() {
			console.log("🚀 Job completed successfully."); // DEBUG

			// Object storing info about completedJob
			const completedJob = {
				jobDetails: this.jobDetails,
				outdir: this.jobDetails.outdir,
				jobid: this.jobDetails.jobid,
				isSample: false,
				jobStatus: "Completed",
				jobType: "runSearch",
				backendOutput: this.backendOutput,
				resultsJSON: this.processedResults.jsonData.results,
				kronaContent: this.processedResults.kronaContent,
				reportFilePath: `${this.jobDetails.outdir}/${this.jobDetails.jobid}_report.tsv`
			};
			this.$emit("store-job", completedJob);

			// Store latest job in local storage for results rendering
			localStorage.setItem("processedResults", JSON.stringify(completedJob));

			// Store completed job in local storage
			// console.log("newrun completedJob:", completedJob); // DEBUG

			// Trigger snackbar
			// this.$emit("trigger-snackbar", "Job successfully completed. Check the results tab.", "success", "success", "View", () => {
			// 	this.$router.push({ name: "ResultsPage" });
			// });

			// Emit job-completed event: close loading dialog and expose results tab in navigation drawer
			this.$emit("job-completed", completedJob);
		},
		handleJobError() {
			this.errorHandled = true; // Ensure flag is set to prevent further handling

			// Additional error handling logic (save failed job to local storage, trigger snackbar)

			// Create failed job object to store in local storage
			const failedJob = {
				jobDetails: this.jobDetails,
				outdir: this.jobDetails.outdir,
				jobid: this.jobDetails.jobid,
				isSample: false,
				jobStatus: this.status,
				jobType: "runSearch",
				backendOutput: this.backendOutput,
				resultsJSON: null,
				kronaContent: null,
				reportFilePath: null,
			};

			// Store completed job in local storage
			this.$emit("store-job", failedJob);

			// Trigger snackbar corresponding to case
			if (this.status === "TIMEOUT") {
				this.$emit("job-timed-out");
				this.$emit("trigger-snackbar", "Job execution timed out.", "warning", "timer", "Retry", this.startJob);
			} else if (this.status === "CANCELLED") {
				this.$emit("trigger-snackbar", "Job was cancelled.", "info", "cancel", "Dismiss");
			} else if (this.status === "ERROR") {
				this.$emit("job-aborted");
				this.$emit("trigger-snackbar", "Invalid request. Check your query and try again.", "error", "warning", "Dismiss");
			} else {
				this.$emit("job-aborted");
				this.$emit("trigger-snackbar", "An unexpected error occurred. Please try again.", "error", "warning", "Dismiss");
			}

			this.status = "ERROR"; // FIXME: do i need this; Set status to ERROR
		},
		handleTimeout() {
			window.electron.cancelBackend();
		},

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
