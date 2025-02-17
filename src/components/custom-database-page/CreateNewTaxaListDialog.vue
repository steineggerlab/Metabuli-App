<template>
	<div>
		<v-dialog v-model="downloadMenu" :close-on-content-click="false" persistent :location="menuLocation" width="700">
			<template v-slot:activator="{ props }">
				<slot name="activator" v-bind="{ props }"></slot>
			</template>

			<!-- Form -->
			<v-card v-if="!processingJob" class="mx-auto w-100">
				<v-card-title class="font-weight-bold text-h6 px-6 pt-6 text-button">Create New Taxa List</v-card-title>
				<v-container class="pb-4 px-6">
						<v-card variant="outlined" color="primary">
							<v-card-text class="text-caption">
								It generates <strong>newtaxa.tsv</strong> for "New Taxa" option and <strong>newtaxa.accession2taxid</strong> for "Accession 2 Tax Id" field. <br />
								<strong>accession2taxid</strong> and <strong>taxonomy dump</strong> files of the new sequences are required. <br />
								If you don't have them, please manually prepare a new taxa list following <a href="https://github.com/steineggerlab/Metabuli?tab=readme-ov-file#add-sequences-of-new-taxa" target="_blank">this</a>. 	
							</v-card-text>
						</v-card>
				</v-container>
				<v-form v-model="isFormValid" ref="extractForm">
					<v-card-text class="pt-0 pb-6">
						<v-card-text class="filepath-textfields">
							
							<v-row>
								<v-col>
									<div class="text-caption mb-1">Old Database Directory</div>
									<v-text-field
										v-model="jobDetails.oldDBDir"
										append-icon="$folder"
										type="text"
										variant="outlined"
										density="compact"
										color="secondary"
										:rules="[requiredRule]"
										@click:append="selectFile('oldDBDir', 'directory')"
										@focus="scrollToEnd($event)"
									></v-text-field>
								</v-col>
							</v-row>

							<v-row>
								<v-col>
									<div class="text-caption mb-1">FASTA List</div>
									<v-text-field
										v-model="jobDetails.fastaList"
										append-icon="$file"
										type="text"
										variant="outlined"
										density="compact"
										color="secondary"
										:rules="[requiredRule]"
										@click:append="selectFile('fastaList', 'file')"
										@focus="scrollToEnd($event)"
									></v-text-field>
								</v-col>
							</v-row>

                            <v-row>
								<v-col>
									<div class="text-caption mb-1">New Taxonomy Path</div>
									<v-text-field
										v-model="jobDetails.newTaxonomyPath"
										append-icon="$folder"
										type="text"
										variant="outlined"
										density="compact"
										color="secondary"
										:rules="[requiredRule]"
										@click:append="selectFile('newTaxonomyPath', 'directory')"
										@focus="scrollToEnd($event)"
									></v-text-field>
								</v-col>
							</v-row>

                            <v-row>
								<v-col>
									<div class="text-caption mb-1">Accession 2 Tax Id</div>
									<v-text-field
										v-model="jobDetails.accession2TaxId"
										append-icon="$file"
										type="text"
										variant="outlined"
										density="compact"
										color="secondary"
										:rules="[requiredRule]"
										@click:append="selectFile('accession2TaxId', 'file')"
										@focus="scrollToEnd($event)"
									></v-text-field>
								</v-col>
							</v-row>

							<v-row>
								<v-col>
									<div class="text-caption mb-1">Output Directory</div>
									<v-text-field
										v-model="jobDetails.outdir"
										append-icon="$folder"
										type="text"
										variant="outlined"
										density="compact"
										color="secondary"
										:rules="[requiredRule]"
										@click:append="selectFile('outdir', 'directory')"
										@focus="scrollToEnd($event)"
									></v-text-field>
								</v-col>
							</v-row>

							<v-row>
								<v-col>
									<v-btn color="secondary" :disabled="!isFormValid || isSubmitButtonDisabled" @click="downloadReads" block flat>Create Taxa List</v-btn>
								</v-col>

								<v-col>
									<v-btn color="grey" variant="outlined" @click="hideDialog" block flat>Cancel</v-btn>
								</v-col>
							</v-row>
						</v-card-text>
					</v-card-text>
				</v-form>
			</v-card>

			<!-- Processing Extract Job Panel -->
			<v-card v-else>
				<v-list>
					<v-list-item class="font-weight-bold text-h6 py-0 pl-8 text-button">
						<span>{{ status === "RUNNING" ? "Creating New Taxa List..." : "New Taxa List Created Successfully!" }}</span>
						<template v-slot:append>
							<v-img src="assets/marv_metabuli_animated.gif" width="60"></v-img>
						</template>
					</v-list-item>
					<div>
						<!-- Display Real-time Output -->
						<v-list-item class="pt-1">
							<template v-slot:subtitle>
								<v-textarea
									variant="outlined"
									v-if="backendOutput"
									v-model="backendOutput"
									label="Command Line Output"
									rows="15"
									no-resize
									readonly
									hide-details="true"
									bg-color="white"
									class="mt-3 mx-0 text-caption"
									ref="outputTextarea"
								></v-textarea>
							</template>
						</v-list-item>

						<!-- Cancel Button -->
						<v-card-text>
							<v-row>
								<v-col>
									<v-btn v-if="status === 'COMPLETE'" variant="tonal" color="primary" @click="openItemInFolder" block>Open in Folder</v-btn>
								</v-col>
								<v-col>
									<v-btn variant="outlined" color="grey" @click="cancelBackend" block>{{ status === "RUNNING" ? "Cancel" : "Close" }}</v-btn>
								</v-col>
							</v-row>
						</v-card-text>
					</div>
				</v-list>
			</v-card>
		</v-dialog>

		<!-- Snackbar -->
		<v-snackbar v-model="snackbar.show" :timeout="snackbar.timeout" location="top" color="white">
			<v-icon :color="snackbar.color" :icon="`$${snackbar.icon}`"></v-icon>
			{{ snackbar.message }}
			<template v-slot:actions>
				<v-btn v-if="snackbar.buttonText" :color="snackbar.color" variant="text" @click="handleSnackbarAction">{{ snackbar.buttonText }}</v-btn>
				<v-btn v-else :color="snackbar.color" variant="text" @click="snackbar.show = false"> Close </v-btn>
			</template>
		</v-snackbar>
	</div>
</template>

<script>
export default {
	props: {
		menuLocation: {
			type: String,
			default: "bottom end",
		},
	},

	data: () => ({
		downloadMenu: false, // Show/hide menu
		activePanel: [0],

		// Extract Reads
		jobDetails: {
			oldDBDir: "",
			fastaList: "",
			newTaxonomyPath: "",
			accession2TaxId: "",
			outdir: "",
		},
		// isSampleJob: null,
		// Properties for backend job processing status, backend output, error tracking
		status: "INITIAL",
		backendOutput: "",
		errorHandled: false,
		// Extract Job Processing Dialog
		processingJob: false,
		// Form Validation (all input fields must be non-empty)
		isFormValid: false, // This tracks the overall form validity
		requiredRule: (v) => !!v || "This field is required", // Simple required rule
		isSubmitButtonDisabled: false, // Tracks button state for any other custom conditions

		// Snackbar
		snackbar: {
			show: false,
			message: "",
			color: "",
			icon: "",
			buttonText: "",
			action: null,
			timeout: 4000,
		},
	}),

	watch: {
		// Watch changes to the form fields if you need to toggle button states
		jobDetails: {
			deep: true,
			handler() {
				this.isSubmitButtonDisabled =
					!this.jobDetails.oldDBDir ||
					!this.jobDetails.fastaList ||
					!this.jobDetails.newTaxonomyPath ||
					!this.jobDetails.accession2TaxId ||
					!this.jobDetails.outdir;
			},
		},
	},

	methods: {
		// Button action
		downloadReads() {
			this.startJob();
		},

		// Functions for handling files
		async selectFile(field, type) {
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
		openItemInFolder() {
			// Call Electron shell to open the file/folder in file manager
			if (window.electron) {
				window.electron.openItemInFolder(this.jobDetails.outdir);
			}
		},
		scrollToEnd(event) {
			// Scroll to the right end of textfield
			const input = event.target;
			input.scrollLeft = input.scrollWidth;
		},

		// Start backend job request
		async startJob() {
			try {
				// Start loading dialog
				this.status = "RUNNING";
				this.showProcessingExtractPanel();

				// Start backend request and job polling simultaneously
				const backendPromise = this.runBackend();
				const pollingPromise = this.pollJobStatus();

				// Wait for either backend to complete or polling to timeout/fail
				await Promise.race([backendPromise, pollingPromise]);

				// If backend completes successfully and polling hasn't timed out
				if (this.status === "COMPLETE") {
					console.log("🚀 New taxa list created successfully."); // DEBUG
				}
			} catch (error) {
				console.error("Error:", error.message); // Single error handling point

				this.handleJobError(error);
			} finally {
				if (this.status !== "COMPLETE") {
					this.status = "INITIAL";
				}
				this.errorHandled = false; // Resets error handled tracking

				// Remove any previously attached event listeners
				window.electron.offBackendRealtimeOutput(); // Custom off method for the event
				window.electron.offBackendComplete();
				window.electron.offBackendError();
				window.electron.offBackendCancelled();
			}
		},
		async runBackend() {
			let params = ["createnewtaxalist"];

			// Add parameters
			params.push(this.jobDetails.oldDBDir, this.jobDetails.fastaList, this.jobDetails.newTaxonomyPath, this.jobDetails.accession2TaxId, this.jobDetails.outdir);

			// params = [
			// 	"extract",
			// 	"/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/SRR14484345_1.fq",
			// 	"/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/SRR14484345_2.fq",
			// 	"/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/extractreads_test_classifications.tsv",
			// 	"/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/refseq_virus",
			// 	"--tax-id",
			// 	10239,
			// ];

			console.log("🚀 createnewtaxalist job requested:", params); // DEBUG

			// Return a promise that resolves or rejects based on backend success or failure
			return new Promise((resolve, reject) => {
				// Run backend process
				window.electron.runBackend(params);

				// Real-time output
				window.electron.onBackendRealtimeOutput((output) => {
					this.backendOutput += output; // Append output in real-time
					this.$nextTick(() => {
						// Scroll to the bottom
						const textarea = this.$refs.outputTextarea.$el.querySelector("textarea");
						textarea.scrollTop = textarea.scrollHeight;
					});

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
			console.log("🚀 Running extract job"); // DEBUG
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
			this.processingJob = false;
			this.backendOutput = "";

			// Trigger snackbar corresponding to case
			if (this.status === "TIMEOUT") {
				this.cancelBackend();

				this.triggerSnackbar("Job execution timed out.", "warning", "timer", "Retry", this.startJob);
			} else if (this.status === "CANCELLED") {
				this.triggerSnackbar("Job was cancelled.", "info", "cancel", "Dismiss");
			} else if (this.status === "ERROR") {
				this.triggerSnackbar("Invalid request. Check your query and try again.", "error", "warning", "Dismiss");
			} else {
				this.triggerSnackbar("An unexpected error occurred. Please try again.", "error", "warning", "Dismiss");
			}

			this.status = "ERROR"; // FIXME: do i need this; Set status to ERROR
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

		// Dialog
		showProcessingExtractPanel() {
			this.processingJob = true;
		},
		hideDialog() {
			this.downloadMenu = false;
			this.processingJob = false;
			this.backendOutput = ""; // Clear backend output
		},
		cancelBackend() {
			this.hideDialog();
			window.electron.cancelBackend();
		},
	},

	async mounted() {
	},
};
</script>

<style scoped>
.filepath-textfields .v-col {
	padding-bottom: 8px;
}

/* Log textarea */
:deep(.v-textarea .v-field__input) {
	font-family: Roboto;
	background-color: white;
	font-size: 12px;
	margin-top: 16px;
	/* -webkit-mask-image: none; */
}

/* Filepath textfield */
:deep(.v-field__input),
:deep(.v-text-field__suffix) {
	padding-top: 4px !important;
	padding-bottom: 4px !important;
	min-height: 30px;
	font-size: 12px;
}
</style>
