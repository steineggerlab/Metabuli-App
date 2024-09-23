<template>
	<div>
		<v-menu v-model="downloadMenu" :close-on-content-click="false" :location="menuLocation" transition="slide-x-reverse-transition" width="320">
			<template v-slot:activator="{ props }">
				<slot name="activator" v-bind="{ props }"></slot>
			</template>

			<v-expansion-panels v-model="activePanel" variant="accordion" class="my-1">
				<!-- Format Selection Panel -->
				<v-expansion-panel title="Download Sankey">
					<v-expansion-panel-text>
						<v-btn-toggle v-model="format" variant="text" color="secondary" density="compact" mandatory>
							<v-btn v-for="(item, i) in items" :key="i" :value="item.value" rounded="0">
								<v-icon start :icon="item.icon" />
								{{ item.text }}
							</v-btn>
						</v-btn-toggle>

						<v-btn class="mt-3" color="secondary" @click="downloadSankey" block flat> Download Sankey </v-btn>
					</v-expansion-panel-text>
				</v-expansion-panel>

				<!-- Download Reads Panel -->
				<v-expansion-panel title="Extract Reads">
					<v-expansion-panel-text>
						<div class="text-caption">
							Extract reads for Tax ID: <strong>{{ taxonId }}</strong>
						</div>
						<div class="text-caption mb-3">
							Classification mode: <strong>{{ jobDetails.mode }}</strong>
						</div>

						<v-form v-model="isFormValid" ref="extractForm">
							<div class="text-caption mb-1">Read 1</div>
							<v-text-field
								v-model="jobDetails.q1"
								prepend-icon="$file"
								type="text"
								variant="outlined"
								density="compact"
								color="secondary"
								:rules="[requiredRule]"
								@click:prepend="selectFile('q1', 'file')"
								@focus="scrollToEnd($event)"
							></v-text-field>

							<div class="text-caption mb-1" v-if="jobDetails.mode === 'paired-end'">Read 2</div>
							<v-text-field
								v-model="jobDetails.q2"
								prepend-icon="$file"
								type="text"
								variant="outlined"
								density="compact"
								color="secondary"
								:rules="[jobDetails.mode === 'paired-end' ? requiredRule : () => true]"
								@click:prepend="selectFile('q2', 'file')"
								@focus="scrollToEnd($event)"
								v-if="jobDetails.mode === 'paired-end'"
							></v-text-field>

							<div class="text-caption mb-1">Classifications File</div>
							<v-text-field
								v-model="jobDetails.classifications"
								prepend-icon="$file"
								type="text"
								variant="outlined"
								density="compact"
								color="secondary"
								:rules="[requiredRule]"
								@click:prepend="selectFile('classifications', 'file')"
								@focus="scrollToEnd($event)"
							></v-text-field>

							<div class="text-caption mb-1">Database</div>
							<v-text-field
								v-model="jobDetails.database"
								prepend-icon="$folder"
								type="text"
								variant="outlined"
								density="compact"
								color="secondary"
								:rules="[requiredRule]"
								@click:prepend="selectFile('database', 'directory')"
								@focus="scrollToEnd($event)"
							></v-text-field>

							<v-btn color="secondary" :disabled="!isFormValid || isExtractDisabled" @click="downloadReads" block flat> Extract Reads </v-btn>
						</v-form>
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
		</v-menu>

		<!-- Loading Dialog -->
		<v-dialog v-model="loadingDialog" persistent>
			<v-card class="mx-auto" width="700">
				<v-list>
					<!-- Title -->
					<v-list-item class="font-weight-bold text-h6 py-0 pl-8 text-button">
						<span>{{ status === "RUNNING" ? "Extracting Reads..." : "Extract Reads Complete!" }}</span>
						<template v-slot:append>
							<v-img src="assets/marv_metabuli_animated.gif" width="60"></v-img>
						</template>
					</v-list-item>

					<!-- Hide Log Output + Cancel Button on Load Sample -->
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
						<v-card-actions>
							<v-spacer></v-spacer>
							<v-btn v-if="status === 'COMPLETE'" variant="outlined" color="primary" @click="openItemInFolder">Open in Folder</v-btn>

							<v-btn variant="text" color="grey" @click="cancelBackend">{{ status === "RUNNING" ? "Cancel" : "Close" }}</v-btn>
						</v-card-actions>
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
		taxonId: {
			type: String,
			required: true,
		},
	},
	data: () => ({
		downloadMenu: false, // Show/hide menu
		activePanel: [0],

		// Download Sankey
		format: "png", // Default selected format png
		items: [
			{ text: "JPG", value: "jpg", icon: "$image" },
			{ text: "PNG", value: "png", icon: "$fileImage" },
			{ text: "HTML", value: "html", icon: "$codeTags" },
		],

		// Extract Reads
		jobDetails: {
			q1: "",
			q2: "",
			classifications: "",
			database: "",
		},
		isSampleJob: null,
		// // Properties for backend job processing status, backend output, error tracking
		status: "INITIAL",
		backendOutput: "",
		errorHandled: false,
		// // Extract Job Processing Dialog
		loadingDialog: false,
		// // Form Validation (all input fields must be non-empty)
		isFormValid: false, // This tracks the overall form validity
		requiredRule: (v) => !!v || "This field is required", // Simple required rule
		isExtractDisabled: false, // Tracks button state for any other custom conditions

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
				this.isExtractDisabled = !this.jobDetails.q1 || !this.jobDetails.classifications || !this.jobDetails.database || (this.jobDetails.mode === "paired-end" && !this.jobDetails.q2);
			},
		},
	},

	methods: {
		// Button actions
		downloadSankey() {
			this.downloadMenu = false;
			this.$emit("format-selected", {
				format: this.format,
				filename: `sankey_diagram_taxID_${this.taxonId}`,
			});
		},
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
			const outputRead1FilePath = this.insertTaxonIdBeforeExtension(this.jobDetails.q1, this.taxonId);
			if (window.electron) {
				window.electron.openItemInFolder(outputRead1FilePath);
			}
		},
		insertTaxonIdBeforeExtension(filePath, taxonId) {
			// Extract the base name and extension
			const extensionIndex = filePath.lastIndexOf(".");

			if (extensionIndex === -1) {
				// If there's no extension, just append the taxonId
				// return `${filePath}_${taxonId}`;

				// Backup: open output directory
				return this.jobDetails.outdir;
			}

			// Insert the taxonId before the extension
			const baseName = filePath.slice(0, extensionIndex);
			const extension = filePath.slice(extensionIndex);

			// Return the modified path with the taxonId inserted
			return `${baseName}_${taxonId}${extension}`;
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
				this.showDialog();

				// Start backend request and job polling simultaneously
				const backendPromise = this.runBackend();
				const pollingPromise = this.pollJobStatus();

				// Wait for either backend to complete or polling to timeout/fail
				await Promise.race([backendPromise, pollingPromise]);

				// If backend completes successfully and polling hasn't timed out
				if (this.status === "COMPLETE") {
					console.log("🚀 Extract job completed successfully."); // DEBUG

					// this.handleJobSuccess(); // FIXME: add to job history
				}
			} catch (error) {
				console.error("Error:", error.message); // Single error handling point

				this.handleJobError(error);
				this.hideDialog();
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
			let params = ["extract"];

			// Add FASTA/Q file path(s)
			if (this.jobDetails.mode === "single-end") {
				params.push("--seq-mode", 1, this.jobDetails.q1);
			} else if (this.jobDetails.mode === "paired-end") {
				params.push(this.jobDetails.q1, this.jobDetails.q2);
			} else if (this.jobDetails.mode === "long-read") {
				params.push("--seq-mode", 3, this.jobDetails.q1);
			}

			// Add Classification file path
			params.push(this.jobDetails.classifications);

			// Add Database path
			params.push(this.jobDetails.database);

			// Add Tax ID
			params.push("--tax-id", parseInt(this.taxonId));

			// params = [
			// 	"extract",
			// 	"/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/SRR14484345_1.fq",
			// 	"/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/SRR14484345_2.fq",
			// 	"/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/extractreads_test_classifications.tsv",
			// 	"/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/refseq_virus",
			// 	"--tax-id",
			// 	10239,
			// ];

			console.log("🚀 Extractreads job requested:", params); // DEBUG

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

			// Additional error handling logic (save failed job to local storage, trigger snackbar)

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
		showDialog() {
			this.loadingDialog = true;
		},
		hideDialog() {
			this.loadingDialog = false;
			this.backendOutput = ""; // Clear backend output
		},
		cancelBackend() {
			this.hideDialog();
			window.electron.cancelBackend();
		},
	},

	async mounted() {
		const processedResults = JSON.parse(localStorage.getItem("processedResults"));
		if (processedResults) {
			this.jobDetails = processedResults.jobDetails;
			this.isSampleJob = processedResults.isSample;

			// Resolve file paths for sample data
			if (this.isSampleJob) {
				this.jobDetails.outdir = window.electron.getBasePath();
				this.jobDetails.q1 = `${this.jobDetails.outdir}/${this.jobDetails.q1}`;
				this.jobDetails.q2 = `${this.jobDetails.outdir}/${this.jobDetails.q2}`;
				this.jobDetails.database = `${this.jobDetails.outdir}/${this.jobDetails.database}`;
			}
			// Resolve file path for classifications file
			this.jobDetails.classifications = `${this.jobDetails.outdir}/${this.jobDetails.jobid}_classifications.tsv`;

			// Loop over each path and check if the file exists
			const paths = ["q1", "q2", "classifications", "database"]; // Array of file paths to check
			for (const key of paths) {
				const fileExists = await window.electron.fileExists(this.jobDetails[key]);
				if (!fileExists) {
					this.jobDetails[key] = ""; // Set to empty string if the file doesn't exist
				}
			}
		}
	},
};
</script>

<style scoped>
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
