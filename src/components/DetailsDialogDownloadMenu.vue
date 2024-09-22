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

						<v-btn class="mt-3" color="secondary" @click="downloadSankey" block flat> Download </v-btn>
					</v-expansion-panel-text>
				</v-expansion-panel>

				<!-- Download Reads Panel -->
				<v-expansion-panel title="Extract Reads" v-if="!this.isSampleJob">
					<v-expansion-panel-text> 
						<div class="text-caption">
							Extract reads for Tax ID: <strong>{{ taxonId }}</strong>
						</div>
						<div class="text-caption mb-3">
							Classification mode: <strong>{{ jobDetails.mode }}</strong>
						</div>
						<div class="text-caption mb-3">Read 1: {{ jobDetails.q1 }}</div>
						<div class="text-caption mb-3" v-if="jobDetails.q2">Read 2: {{ jobDetails.q2 }}</div>
						<div class="text-caption mb-3">Classifications File: {{ jobDetails.outdir }}/{{ jobDetails.jobid }}_classifications.tsv</div>
						<div class="text-caption mb-3">Database: {{ jobDetails.database }}</div>
						<v-btn color="secondary" @click="downloadReads" block flat> Download Reads </v-btn>
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
						<span>Extracting Reads...</span>
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
							<v-btn variant="plain" color="primary" @click="cancelBackend">Cancel</v-btn>
						</v-card-actions>
					</div>
				</v-list>
			</v-card>
		</v-dialog>
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
		jobDetails: {},
		isSampleJob: null,
		// // Properties for backend job processing status, backend output, error tracking
		status: "INITIAL",
		backendOutput: "",
		errorHandled: false,
		// // Extract Job Processing Dialog
		loadingDialog: false,
	}),
	methods: {
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

		// Start backend job request
		async startJob() {
			try {
				// Start loading dialog
				this.status = "RUNNING";
				// this.$emit("job-started", false);
				this.showDialog();

				// Start backend request and job polling simultaneously
				const backendPromise = this.runBackend();
				const pollingPromise = this.pollJobStatus();

				// Wait for either backend to complete or polling to timeout/fail
				await Promise.race([backendPromise, pollingPromise]);

				// If backend completes successfully and polling hasn't timed out
				if (this.status === "COMPLETE") {
					console.log("🚀 Extract job completed successfully."); // DEBUG

					// await this.processResults(false); // Make sure this is called after backend completion
					// this.handleJobSuccess();
					this.hideDialog();
				}
			} catch (error) {
				console.error("Error:", error.message); // Single error handling point

				// this.handleJobError(error);
			} finally {
				this.hideDialog();

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
			const classificationFilePath = `${this.jobDetails.outdir}/${this.jobDetails.jobid}_classifications.tsv`;
			params.push(classificationFilePath);

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
					console.log(output); // DELETE
					// this.$emit("backend-realtime-output", this.backendOutput);
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

		// Dialog
		showDialog() {
			this.loadingDialog = true;
		},
		hideDialog() {
			this.loadingDialog = false;
		},
		cancelBackend() {
			this.hideDialog();
			window.electron.cancelBackend();
		},
	},

	mounted() {
		const processedResults = JSON.parse(localStorage.getItem("processedResults"));
		if (processedResults) {
			this.jobDetails = processedResults.jobDetails;
			this.isSampleJob = processedResults.isSample;

			// if (processedResults.isSample) {
			// 	this.jobDetails.outdir = window.electron.getBasePath();
			// 	this.jobDetails.q1 = `${this.jobDetails.outdir}/${this.jobDetails.q1}`
			// 	if (this.jobDetails.q2) {
			// 		this.jobDetails.q2 = `${this.jobDetails.outdir}/${this.jobDetails.q2}`
			// 	}
			// 	this.jobDetails.database = `${this.jobDetails.outdir}/${this.jobDetails.database}`;
			// }
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
</style>
