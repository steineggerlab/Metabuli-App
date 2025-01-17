<template>
	<div class="d-flex">
		<v-container class="w-66 gr-2 upload-container" @drop="handleDrop" @dragover.prevent>
			<!-- TITLE -->
			<v-card flat>
				<v-card-title class="text-button font-weight-bold">Upload Previous Report</v-card-title>
				<v-card-text>Upload report.tsv file directly to see visualization.</v-card-text>
			</v-card>

			<v-sheet class="d-flex flex-column gr-2 mb-2">
				<!-- Upload Box -->
				<div class="d-flex flex-column align-center dotted-border gr-3" @click="triggerFilePicker">
					<v-file-input v-model="file" ref="fileInput" class="hidden-input" @change="handleFileSelect" accept=".tsv"></v-file-input>
					<v-icon size="50" icon="$fileUpload" color="primary"></v-icon>
					<p class="text-body-2">Drag & drop your file here or choose from files.</p>
				</div>

				<!-- Show Uploaded Files -->
				<div v-if="file" class="uploaded-file">
					<v-card-subtitle>Uploaded File</v-card-subtitle>
					<v-card-text class="py-1">
						<v-chip label closable prepend-icon="$file" color="primary" @click:close="removeFile">{{ file.name }}</v-chip>
					</v-card-text>
				</div>

				<!-- Upload Button -->
				<v-btn block color="primary" @click="uploadFile" :disabled="!file">Upload</v-btn>
			</v-sheet>
		</v-container>

		<v-img class="w-33 marv-metabuli-opaque" :width="300" aspect-ratio="1/1" src="assets/marv_metabuli_small.png"> </v-img>
	</div>
</template>

<script>
import TSVParser from "@/plugins/tsvParser";

export default {
	name: "UploadReportTab",
	data() {
		return {
			file: null, // FIXME: rename to uploadedReportFile or Path
			status: "INITIAL",
			backendOutput: "",
			processedResults: null,
		};
	},
	methods: {
		handleDrop(event) {
			const file = event.dataTransfer.files[0];
			if (file) {
				this.file = file;
			}
		},
		triggerFilePicker() {
			this.$refs.fileInput.click();
		},
		handleFileSelect() {
			this.file = this.$refs.fileInput.files[0];
		},
		removeFile() {
			this.file = null;
			this.$refs.fileInput.value = "";
		},
		async uploadFile() {
			if (!this.file) {
				this.$emit("trigger-snackbar", "No file selected.", "error", "warning", "Dismiss");
				return;
			}

			try {
				// Starting loading dialog
				this.$emit("job-started", true); // FIXME: true sets isSample as true

				// Process the file content
				await this.processResults(false);
				console.log("🚀 Upload Report Processed:", this.processedResults); // DEBUG

				// Throw error if invalid report.tsv file
				if (!this.processedResults.jsonData) {
					throw new Error("Invalid report file.");
				}

				// Set log message
				this.backendOutput = `Report file was processed successfully.\nFile path: ${this.file.path}`;

				setTimeout(() => {
					// Object storing info about completedJob
					const completedJob = {
						jobDetails: null,
						outdir: null,
						jobid: null,
						isSample: false,
						jobStatus: "Completed",
						jobType: "uploadReport",
						backendOutput: this.backendOutput,
						resultsJSON: this.processedResults.jsonData.results,
						kronaContent: this.processedResults.kronaContent, // null
					};

					// Store latest job in local storage for results rendering
					localStorage.setItem("processedResults", JSON.stringify(completedJob));

					// Store completed job in local storage
					// console.log("uploadfile completedjob", completedJob); // DEBUG
					this.$emit("store-job", completedJob);

					// Emit job-completed event: close loading dialog and expose results tab in navigation drawer
					this.$emit("job-completed", completedJob);

					// Trigger snackbar
					// this.$emit("trigger-snackbar", "Upload successful. Check the results tab!", "success", "success", "View", () => {
					// 	this.$router.push({ name: "ResultsPage" });
					// });
				}, 2000);
			} catch (error) {
				console.error("Error processing file: ", error.message); // DEBUG

				// Set log message
				this.backendOutput = "Error processing file: " + error.message;
				this.$emit("job-aborted");

				this.status = "ERROR";
				// Create failed job object to store in local storage
				const failedJob = {
					jobDetails: null,
					outdir: null,
					jobid: null,
					isSample: false,
					jobStatus: "ERROR", // this.status
					jobType: "uploadReport",
					backendOutput: this.backendOutput,
					resultsJSON: null,
					kronaContent: null,
				};
				// Store completed job in local storage
				this.$emit("store-job", failedJob);

				// Trigger snackbar
				this.$emit("trigger-snackbar", "Error processing file. Please check file and try again.", "error", "warning", "Dismiss");
			} finally {
				this.backendOutput = ""; // Clear backendOutput
			}
		},

		// // Function for processing results (shared for both tabs)
		async processResults(isSample) {
			// Set file path for report directly
			const reportFilePath = this.file.path;

			// Store report file path in session storage for later use (taxonomy verification)
			sessionStorage.setItem("reportFilePath", reportFilePath);

			// Read and process TSV and Krona HTML here
			const tsvData = await TSVParser.readTSVFile(reportFilePath, isSample);
			const jsonData = TSVParser.tsvToJSON(tsvData);

			// Store in component for emission
			this.processedResults = { jsonData, kronaContent: null };
		},
	},
};
</script>

<style scoped>
.upload-container {
	display: flex;
	flex-direction: column;
}

.hidden-input {
	display: none;
}

.dotted-border {
	border: 2px dashed #ccc;
	border-width: 2px;
	border-radius: 5px;
	padding: 70px;
	text-align: center;
	cursor: pointer;
	transition: all 0.3s ease;
}

.dotted-border:hover {
	border: 2px dashed #1976d2;
	background-color: rgba(21, 101, 192, 0.04);
}

.uploaded-file {
	margin: 10px 0;
}
</style>
