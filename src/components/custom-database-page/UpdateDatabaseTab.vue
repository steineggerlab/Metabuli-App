<template>
    <v-card-text>
        <!-- Required Fields -->
        <v-form ref="jobForm" v-model="isJobFormValid">
			<v-container>
				<v-card variant="outlined" color="primary">
					<v-card-title class="text-subtitle-2">
						Please refer to the <a href="https://github.com/steineggerlab/Metabuli" target="_blank">Metabuli documentation</a> for more information on how to update a database.<br/>
						You can add new sequences to an existing database. Adding new taxa is also possible with 'New Taxa' option.</v-card-title>
				</v-card>
			</v-container>
            
			<v-card-title class="text-button font-weight-bold">Required Fields</v-card-title>
            <div class="d-flex">
                <div class="w-100 search-required-fields">
                    <v-container class="py-2">
						<!-- GTDB-Based Checkbox -->
						<v-row>
							<v-col cols="3" class="d-flex align-center">
								<v-list-subheader class="pr-0">
									GTDB-Based
								</v-list-subheader>
							</v-col>

							<v-col cols="9">
								<v-checkbox v-model="jobDetails.gtdbBased" color="primary" hide-details></v-checkbox>
							</v-col>
						</v-row>

                        <!-- Old DB Directory -->
                        <v-row>
                            <v-col cols="3">
                                <v-list-subheader class="pr-0">
                                    Old Database Directory
                                </v-list-subheader>
                            </v-col>

                            <v-col cols="9" class="search-files">
                                <v-row>
                                    <v-col cols="4">
                                        <v-btn
                                            @click="selectFile('olddbdir', 'directory')"
                                            prepend-icon="$folder"
                                            density="comfortable"
                                            size="default"
                                            class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                                            >Select Directory</v-btn
                                        >
                                        <v-text-field v-model="jobDetails.olddbdir" :rules="[requiredRule]" style="display: none"></v-text-field>
                                    </v-col>
                                    <v-col cols="8" class="filename-col">
                                        <v-chip v-if="jobDetails.olddbdir" label color="primary" density="comfortable" class="filename-chip">
                                            <v-icon icon="$delete" @click="clearFile('olddbdir')" class="mr-1"></v-icon>
                                            {{ this.extractFilename(jobDetails.olddbdir) }}</v-chip
                                        >
                                    </v-col>
                                </v-row>
                            </v-col>
                        </v-row>

                        <!-- New DB Directory -->
                        <v-row>
                            <v-col cols="3">
                                <v-list-subheader class="pr-0">
                                    New Database Directory
                                </v-list-subheader>
                            </v-col>

                            <v-col cols="9" class="search-files">
                                <v-row>
                                    <v-col cols="4">
                                        <v-btn
                                            @click="selectFile('newdbdir', 'directory')"
                                            prepend-icon="$folder"
                                            density="comfortable"
                                            size="default"
                                            class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                                            >Select Directory</v-btn
                                        >
                                        <v-text-field v-model="jobDetails.newdbdir" :rules="[requiredRule]" style="display: none"></v-text-field>
                                    </v-col>
                                    <v-col cols="8" class="filename-col">
                                        <v-chip v-if="jobDetails.newdbdir" label color="primary" density="comfortable" class="filename-chip">
                                            <v-icon icon="$delete" @click="clearFile('newdbdir')" class="mr-1"></v-icon>
                                            {{ this.extractFilename(jobDetails.newdbdir) }}</v-chip
                                        >
                                    </v-col>
                                </v-row>
                            </v-col>
                        </v-row>

                        <!-- FASTA File -->
                        <v-row>
                            <v-col cols="3">
                                <v-list-subheader class="pr-0">
                                    <v-tooltip location="top">
                                        <template v-slot:activator="{ props }">
                                            <v-icon v-bind="props" icon="$helpCircle"></v-icon>
                                        </template>
										File of reference genome absolute paths.
                                    </v-tooltip>
                                    FASTA File
                                </v-list-subheader>
                            </v-col>

                            <v-col cols="9" class="search-files">
                                <v-row>
                                    <v-col cols="4">
                                        <v-btn
                                            @click="selectFile('fastafile', 'file')"
                                            prepend-icon="$file"
                                            density="comfortable"
                                            size="default"
                                            class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                                            >Select File</v-btn
                                        >
                                        <v-text-field v-model="jobDetails.fastafile" :rules="[requiredRule]" style="display: none"></v-text-field>
                                    </v-col>
                                    <v-col cols="8" class="filename-col">
                                        <v-chip v-if="jobDetails.fastafile" label color="primary" density="comfortable" class="filename-chip">
                                            <v-icon icon="$delete" @click="clearFile('fastafile')" class="mr-1"></v-icon>
                                            {{ this.extractFilename(jobDetails.fastafile) }}</v-chip
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
                                        {{ jobDetails.gtdbBased ? 'Directory where the taxonomy dump files are stored.' : 'A path to NCBI-style accession2taxid.' }}
                                    </v-tooltip>
									{{ jobDetails.gtdbBased ? "Taxonomy Path" : " Accession 2 Tax Id" }}
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
                                                :href="jobDetails.gtdbBased ? 'https://github.com/shenwei356/gtdb-taxdump/releases' : 'https://ftp.ncbi.nlm.nih.gov/pub/taxonomy/accession2taxid/'"
                                                target="_blank"
                                                >Download {{ jobDetails.gtdbBased ? "GTDB" : "NCBI" }}
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
                <div v-if="expandAdvancedSettings" class="search-advanced-settings w-75 pt-0 pb-2">
                    <!-- Input fields -->
                    <v-container fluid class="py-0">
                        <v-row v-for="(setting, key) in advancedSettings" :key="key">
                            <v-col cols="6">
                                <v-list-subheader class="pr-0 text-high-emphasis font-weight-medium">
                                    {{ setting.title }}
                                </v-list-subheader>
								<small class="text-caption text-medium-emphasis pr-0" >
									{{ setting.description }}
								</small>
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

							<v-col>
								<!-- Dialog for New Taxa -->
								<CreateNewTaxaListDialog>
									<template v-slot:activator="{ props }">
										<v-btn
											v-if="key === 'newTaxa'"
											v-bind="props"
											prepend-icon="$plusBox"
											color="primary"
											variant="text"
											@click="openNewTaxaDialog"
										>Create New Taxa</v-btn>
									</template>
								</CreateNewTaxaListDialog>

							</v-col>
                        </v-row>
						<v-container class=" px-0">
						<v-card variant="outlined" color="primary">
							<v-card-text class="text-caption">
								NOTE: Mixing taxonomies within the same domain is not recommended. 
								For example, adding prokaryotes to a GTDB database using NCBI taxonomy will cause issues, 
								but adding eukaryotes or viruses is fine since GTDB does not cover them.
							</v-card-text>
						</v-card>
				</v-container>

						
						
                    </v-container>
                </div>
            </v-expand-transition>

            <!-- BUTTON -->
            <v-sheet class="d-flex align-center my-2">
                <v-btn :disabled="!isJobFormValid" @click="startJob" color="primary">
                    Update Database
                    <template v-slot:loader>
                        <v-progress-circular indeterminate></v-progress-circular>
                    </template>
                </v-btn>
            </v-sheet>
        </v-form>
    </v-card-text>
</template>

<script>
import CreateNewTaxaListDialog from './CreateNewTaxaListDialog.vue';

export default {
	name: "UpdateDatabaseTab",
	components: {
		CreateNewTaxaListDialog
	},
	data: () => ({
		// Properties for Run New Search tab
		isJobFormValid: false,
		jobDetails: {
			// Store job details including file paths
			newdbdir: "", // new db directory path
			fastafile: "", // file path
			accession2taxid: "", // file path
            olddbdir: "", // old db directory path
			gtdbBased: false, // gtdb option
		},
		expandAdvancedSettings: false,
		isNewTaxaDialogVisible: false,
		advancedSettings: {
			maxRam: {
				title: "Max RAM (GiB)",
				description: "The maximum RAM usage.",
				parameter: "--max-ram",
				value: 128,
				type: "INTEGER"
			},
			thread: {
				title: "Threads",
				description: "The number of threads used (all by default)",
				parameter: "--threads",
				value: "", // FIXME: should be 0 or int?
				type: "INTEGER",
			},
			accessionLevel: {
				title: "Accession Level",
				description: "Set 1 to create a DB for accession level classification.",
				parameter: "--accession-level",
				value: "0", // FIXME: should be 0 or int?
				type: "INTEGER",
			},
            makeLibrary: {
                title: "Make Library",
				description: "Make species library for faster execution.",
				parameter: "--make-library",
				value: "0", // FIXME: should be 0 or int?
				type: "INTEGER",
			},
            newTaxa: {
                title: "New Taxa",
                description: "List of new taxa. Please check GitHub for the format.",
                parameter: "--new-taxa",
                value: "",
                type: "STRING",
                extra: {
                    appendIcon: "file",
                    file: true, // FIXME: edit the select file path function to accomodate both file and directory
                },
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
		backendOutput: "",
		errorHandled: false,
	}),

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
				const filePath = await this.selectFile(null, "file");
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
                    console.log("🚀 Build new database completed successfully."); // DEBUG
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

				// Save backendOutput to a log file before clearing it
				if (this.backendOutput) {
					window.electron.writeFile(this.jobDetails.newdbdir + "/updateDB_log.txt", this.backendOutput).catch(console.error);
				}
				this.backendOutput = ""; // Clear backendOutput

				// Remove any previously attached event listeners
				window.electron.offBackendRealtimeOutput(); // Custom off method for the event
				window.electron.offBackendComplete();
				window.electron.offBackendError();
				window.electron.offBackendCancelled();
			}
		},

		async runBackend() {
			const workingDir = this.jobDetails.olddbdir.substring(0, this.jobDetails.olddbdir.lastIndexOf("/"));
			
			// Add command
			let params = ["updateDB"];

			// Add dbdir, fastafile, accession2taxid
			params.push(this.jobDetails.newdbdir, this.jobDetails.fastafile, this.jobDetails.accession2taxid, this.jobDetails.olddbdir);

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
            console.log("🚀 UpdateDB requested:", params); // DEBUG

			// Return a promise that resolves or rejects based on backend success or failure
			return new Promise((resolve, reject) => {
				// Run backend process
				window.electron.runBackend(params, workingDir);

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
            console.log("🚀 UpdateDB database"); // DEBUG
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

		handleJobError() {
			this.errorHandled = true; // Ensure flag is set to prevent further handling

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

		// Create new taxa dialog
		openNewTaxaDialog() {
            this.isNewTaxaDialogVisible = true;
        },
	},

	mounted() {
		// On every page reload
		this.errorHandled = false; // Flag to ensure errors are handled only once

		// Prefill Job Details
		const totalRam = window.electron.getTotalRam(); // Get total RAM of current computer
		this.advancedSettings.maxRam.value = totalRam; // Set maxram to total RAM in GB
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

.search-advanced-settings .v-list-subheader {
	min-height: 0px;
}

/* hyperlink */
.v-card-text a {
  color: inherit;
}

.v-card-text a:hover {
  text-decoration: none;
}
</style>
