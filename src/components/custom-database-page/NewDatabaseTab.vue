<template>
    <v-card-text>
        <!-- Required Fields -->
        <v-form ref="jobForm" v-model="isJobFormValid">
            <v-card-title class="text-button font-weight-bold">Required Fields</v-card-title>
            <div class="d-flex">
                <div class="w-100 search-required-fields">
                    <v-container>
                        <!-- DB Directory -->
                        <v-row>
                            <v-col cols="3">
                                <v-list-subheader class="pr-0">
                                    <v-tooltip location="top">
                                        <template v-slot:activator="{ props }">
                                            <v-icon v-bind="props" icon="$helpCircle"></v-icon>
                                        </template>
                                        Sequences will be stored in 'DBDIR/library'.
                                    </v-tooltip>
                                    Database Directory
                                </v-list-subheader>
                            </v-col>

                            <v-col cols="9" class="search-files">
                                <v-row>
                                    <v-col cols="4">
                                        <v-btn
                                            @click="selectFile('dbdir', 'directory')"
                                            prepend-icon="$folder"
                                            density="comfortable"
                                            size="default"
                                            class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                                            >Select Directory</v-btn
                                        >
                                        <v-text-field v-model="jobDetails.dbdir" :rules="[requiredRule]" style="display: none"></v-text-field>
                                    </v-col>
                                    <v-col cols="8" class="filename-col">
                                        <v-chip v-if="jobDetails.dbdir" label color="primary" density="comfortable" class="filename-chip">
                                            <v-icon icon="$delete" @click="clearFile('dbdir')" class="mr-1"></v-icon>
                                            {{ this.extractFilename(jobDetails.dbdir) }}</v-chip
                                        >
                                    </v-col>
                                </v-row>
                            </v-col>
                        </v-row>

                        <!-- Library File -->
                        <v-row>
                            <v-col cols="3">
                                <v-list-subheader class="pr-0">
                                    <v-tooltip location="top">
                                        <template v-slot:activator="{ props }">
                                            <v-icon v-bind="props" icon="$helpCircle"></v-icon>
                                        </template>
                                        A file containing absolute paths of the FASTA files in DBDIR/library (library-files.txt)
                                    </v-tooltip>
                                    Library File
                                </v-list-subheader>
                            </v-col>

                            <v-col cols="9" class="search-files">
                                <v-row>
                                    <v-col cols="4">
                                        <v-btn
                                            @click="selectFile('libfiles', 'file')"
                                            prepend-icon="$file"
                                            density="comfortable"
                                            size="default"
                                            class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                                            >Select File</v-btn
                                        >
                                        <v-text-field v-model="jobDetails.libfiles" :rules="[requiredRule]" style="display: none"></v-text-field>
                                    </v-col>
                                    <v-col cols="8" class="filename-col">
                                        <v-chip v-if="jobDetails.libfiles" label color="primary" density="comfortable" class="filename-chip">
                                            <v-icon icon="$delete" @click="clearFile('libfiles')" class="mr-1"></v-icon>
                                            {{ this.extractFilename(jobDetails.libfiles) }}</v-chip
                                        >
                                    </v-col>
                                </v-row>
                            </v-col>
                        </v-row>

                        <!-- <accession2taxid> -->
                        <v-row>
                            <v-col cols="3">
                                <v-list-subheader class="pr-0">
                                    <v-tooltip location="top">
                                        <template v-slot:activator="{ props }">
                                            <v-icon v-bind="props" icon="$helpCircle"></v-icon>
                                        </template>
                                        A path to NCBI-style accession2taxid.
                                    </v-tooltip>
                                    Accession 2 Tax Id
                                </v-list-subheader>
                            </v-col>

                            <v-col cols="9" class="search-files">
                                <v-row>
                                    <v-col cols="4">
                                        <div class="d-flex flex-column align-center mb-0 gc-3">
                                            <!-- Select File Button -->
                                            <v-btn
                                                @click="selectFile('accession2taxid', 'file')"
                                                prepend-icon="$file"
                                                density="comfortable"
                                                size="default"
                                                class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                                                >Select File</v-btn
                                            >
                                            <v-text-field v-model="jobDetails.accession2taxid" :rules="[requiredRule]" style="display: none"></v-text-field>

                                            <!-- Download Data Button -->
                                            <v-btn
                                                color="primary"
                                                prepend-icon="$openInNew"
                                                variant="text"
                                                class="text-caption font-weight-medium"
                                                size="small"
                                                rounded="xl"
                                                href="https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/accession2taxid/"
                                                target="_blank"
                                                >Download Data
                                            </v-btn>
                                        </div>
                                    </v-col>
                                    <v-col cols="8" class="filename-col">
                                        <v-chip v-if="jobDetails.accession2taxid" label color="primary" density="comfortable" class="filename-chip">
                                            <v-icon icon="$delete" @click="clearFile('accession2taxid')" class="mr-1"></v-icon>
                                            {{ this.extractFilename(jobDetails.accession2taxid) }}</v-chip
                                        >
                                    </v-col>
                                </v-row>
                            </v-col>
                        </v-row>
                    </v-container>
                </div>

                <!-- <v-img class="w-33 marv-metabuli-opaque" :width="300" aspect-ratio="1/1" src="assets/marv_metabuli_small.png"> </v-img> -->
            </div>

            <!-- OPTIONAL FIELDS -->
            <v-divider class="my-2"></v-divider>
            <v-card-actions>
                <v-btn text="Optional Fields" :append-icon="expandAdvancedSettings ? '$collapse' : '$expand'" @click="expandAdvancedSettings = !expandAdvancedSettings" class="font-weight-bold"></v-btn>
            </v-card-actions>

            <!-- EXPANDABLE PANEL -->
            <v-expand-transition>
                <div v-if="expandAdvancedSettings" class="search-advanced-settings w-66 pt-0 pb-2">
                    <!-- Parameters for precision mode -->
                    <!-- <v-container class="py-0">
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
                    </v-container> -->

                    <!-- Input fields -->
                    <v-container fluid class="py-0">
                        <v-row v-for="(setting, key) in advancedSettings" :key="key">
                            <v-col cols="4">
                                <v-list-subheader class="pr-0">
                                    <v-tooltip location="top">
                                        <template v-slot:activator="{ props }">
                                            <v-icon v-bind="props" icon="$helpCircle"></v-icon>
                                        </template>
                                        {{ setting.description }}
                                    </v-tooltip>
                                    {{ setting.title }}
                                </v-list-subheader>
                            </v-col>

                            <v-col>
                                <v-text-field
                                    variant="outlined"
                                    rounded="lg"
                                    density="compact"
                                    color="primary"
                                    :placeholder="setting.extra?.file ? 'Select Path' : none"
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

            <!-- BUTTON -->
            <v-sheet class="d-flex align-center my-2">
                <v-btn :disabled="!isJobFormValid" @click="startJob" color="primary">
                    Build Database
                    <template v-slot:loader>
                        <v-progress-circular indeterminate></v-progress-circular>
                    </template>
                </v-btn>
            </v-sheet>
            <v-row>
                <v-col class="pt-0">
                    <small class="text-caption text-medium-emphasis"
                        >This will generate diffIdx, info, split, and taxID_list and some other files. You can delete '*_diffIdx' and '*_info' if generated.</small
                    >
                </v-col>
            </v-row>
        </v-form>
    </v-card-text>
</template>

<script>
import { trimAndStoreJobsHistory, loadJobsHistory } from "@/plugins/storageUtils.js";

export default {
	name: "NewDatabaseTab",

	data: () => ({
		tab: "newDatabase",
		tabItems: [
			{ title: "New Database", value: "newDatabase" },
			{ title: "Update Database", value: "updateDatabase" },
		],
		snackbar: {
			show: false,
			message: "",
			color: "",
			icon: "",
			buttonText: "",
			action: null,
			timeout: 4000,
		},

		// Properties for Run New Search tab
		isJobFormValid: false,
		jobDetails: {
			// Store job details including file paths
			dbdir: "", // directory path
			libfiles: "", // file path
			accession2taxid: "", // file path
			// taxonomyPath: "", // directory path
			// maxram: "",
		},
		expandAdvancedSettings: false,
		advancedSettings: {
			thread: {
				title: "Threads",
				description: "The number of threads used (all by default)",
				parameter: "--threads",
				value: "", // FIXME: should be 0 or int?
				type: "INTEGER",
			},
            maxRam: {
                title: "Max RAM",
                description: "The maximum RAM usage. (128 GiB by default)",
                parameter: "--max-ram",
                value: 128,
                type: "INTEGER"
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
			accessionLevel: {
				title: "Accession Level",
				description: "Set 1 to use accession level classification (0 by default).",
				parameter: "--accession-level",
				value: "", // FIXME: should be 0 or int?
				type: "INTEGER",
			},
            cdsInfo: {
                title: "CDS Info",
                description: "List of absolute paths to CDS files.",
                parameter: "--cds-info",
                value: "",
                type: "STRING",
                extra: {
                    appendIcon: "file",
                    file: true,
                },
            },
            makeLibrary: {
				title: "Make Library",
				description: "Make species library for faster execution (1 by default).",
				parameter: "--make-library",
				value: "", // FIXME: should be 0 or int?
				type: "INTEGER",
			},
		},
		validationRules: {
            "--threads": (value) => {
                // Input must be valid integer
                if (value === "" || value === null || value === undefined) {
                    return true;
                }
                return Number.isInteger(Number(value)) || "Input must be a valid integer";
            },
			// Input is required
			"--max-ram": (value) => {
				return Number.isInteger(Number(value)) || "Input must be a valid integer";
			},
			"--accession-level": (value) => {
				// Input can be empty, or either numerical 0 or 1
				const isEmpty = value === "" || value === null || value === undefined;
				const validInputs = ["0", "1"];

				return isEmpty || validInputs.includes(value) || "Value must be 0 or 1";
			},
            "--make-library": (value) => {
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
	}),

	computed: {
		computedHint() {
			return `${this.jobDetails.jobid}_report.tsv`;
		},
	},

	methods: {
		// Cascade emit from tabs
		emitJobStarted(bool) {
			this.$emit("job-started", bool);
		},
		emitJobCompleted(completedJobObject) {
			this.$emit("job-completed", completedJobObject);
		},
		emitBackendRealtimeOutput(string) {
			this.$emit("backend-realtime-output", string);
		},
		emitJobTimedOut() {
			this.$emit("job-timed-out");
		},
		emitJobAborted() {
			this.$emit("job-aborted");
		},

		// Function managing job history storage
		async storeJob(job) {
			// Deep clone the jobDetails and results to avoid storing reactive proxies
			const plainJobDetails = JSON.parse(JSON.stringify(job.jobDetails));
			const plainResults = JSON.parse(JSON.stringify(job.resultsJSON));

			// Create a new job entry with additional details
			const jobEntry = {
				jobDetails: plainJobDetails,
				jobId: job.jobid,
				timestamp: new Date().toISOString(), // Timestamp of job completion
				jobType: job.jobType,
				isSample: job.isSample,
				jobStatus: job.jobStatus,
				backendOutput: job.backendOutput,
				results: plainResults,
				kronaContent: job.kronaContent,
			};

			try {
				// Load existing jobs from file using Electron API
				let jobsHistory = await loadJobsHistory();

				// Add the new job to the history array
				jobsHistory.push(jobEntry);

				// Trim and store the latest 10 jobs in the file
				await trimAndStoreJobsHistory(jobsHistory);
			} catch (error) {
				console.error("Error storing job:", error);
			}
		},

		// Functions managing snackbar
		triggerSnackbar(message, color = "info", icon = "info", buttonText = "", action = null) {
			if (this.snackbar.show) return; // If multiple snackbars are triggered, show the first one

			this.snackbar.message = message;
			this.snackbar.color = color;
			this.snackbar.icon = icon;
			this.snackbar.buttonText = buttonText;
			this.snackbar.action = action;

			this.snackbar.show = true;
		},
		handleSnackbarAction() {
			if (this.snackbar.action) {
				this.snackbar.action();
			}
			this.snackbar.show = false;
		},

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
			reportFilePath = `${resolvedOutdirPath}/${jobId}_report.tsv`;
			kronaFilePath = `${resolvedOutdirPath}/${jobId}_krona.html`;

			// Read and process TSV and Krona HTML here
			const tsvData = await this.readTSVFile(reportFilePath, isSample);
			const jsonData = this.tsvToJSON(tsvData);
			const kronaContent = await this.readKronaHTML(kronaFilePath, isSample);

			// Store in component for emission
			this.processedResults = { jsonData, kronaContent };
		},
		// Helper functions for processing data
		async readTSVFile(filePath, isSample) {
			try {
				const tsvContent = await window.electron.readFile(filePath, isSample); //FIXME: edit readFile preload function
				return tsvContent;
			} catch (error) {
				console.error("Error reading TSV file:", error);
			}
		},
		validateReportTSVData(records) {
			// Validation criteria for report.tsv file format
			const firstRecord = records[0];

			// No parsed data
			if (firstRecord === undefined) return false;

			return (
				(firstRecord.rank === "no rank" && firstRecord.taxon_id === "0" && firstRecord.name === "unclassified") ||
				(firstRecord.rank === "no rank" && firstRecord.taxon_id === "1" && firstRecord.name === "root")
			);
		},
		tsvToJSON(tsv) {
			const headers = ["proportion", "clade_reads", "taxon_reads", "rank", "taxon_id", "name"];
			const records = tsv
				.split("\n")
				.map((line) => {
					const data = line.split("\t").map((item) => item.trim()); // Strip leading and trailing whitespace
					return Object.fromEntries(headers.map((header, index) => [header, data[index]]));
				})
				.filter((record) => !Object.values(record).every((field) => field === "" || field === undefined || field === null)); // Filter out empty rows

			// Validate report.tsv file
			if (this.validateReportTSVData(records)) {
				return { results: records };
			} else {
				return null; // Return null if the row does not meet the criteria
			}
		},
		async readKronaHTML(filePath, isSample) {
			if (!filePath) {
				// Results tab will hide krona tab for null
				return null;
			}

			try {
				const kronaHtml = await window.electron.readFile(filePath, isSample); //FIXME: too messy, edit readFile preload function
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

		// getCurrentDateTime() {
		// 	const now = new Date();

		// 	// Format the date and time (YYYY-MM-DD_HH-MM-SS)
		// 	const year = now.getFullYear();
		// 	const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
		// 	const day = String(now.getDate()).padStart(2, "0");
		// 	const hours = String(now.getHours()).padStart(2, "0");
		// 	const minutes = String(now.getMinutes()).padStart(2, "0");
		// 	const seconds = String(now.getSeconds()).padStart(2, "0");

		// 	return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
		// },
	},

	mounted() {
		// On every page reload
		this.errorHandled = false; // Flag to ensure errors are handled only once

		// Prefill Job Details
		const totalRam = window.electron.getTotalRam(); // Get total RAM of current computer
		this.jobDetails.maxram = totalRam; // Set maxram to total RAM in GB
		// this.jobDetails.jobid = this.getCurrentDateTime(); // Prefill Job ID with current timestamp
	},
};
</script>

<style scoped>
/* STYLE APPLYING TO BOTH TABS */
.search-setting-title {
	font-family: Roboto;
	font-weight: 600;
	font-size: 16px;
	letter-spacing: 2px;
	text-transform: uppercase;
}

.v-col {
	padding-bottom: 0px;
}
.v-row {
	margin-top: 0px;
	margin-bottom: 0px;
}

.custom-snackbar {
	top: 64px !important; /* Adjust this value to match your app bar height */
}

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
</style>
