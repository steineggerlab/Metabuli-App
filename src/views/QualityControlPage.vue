<template>
  <div>
    <v-container>
      <v-card>
        <!-- HEADER TOOLBAR -->
        <v-toolbar image="assets/toolbar_background.png" class="custom-toolbar" density="compact">
          Quality Control (QC)
          <v-spacer></v-spacer>
        </v-toolbar>
  
        <v-form ref="jobForm" v-model="isJobFormValid">
          <div class="search-required-fields">
  
            <v-container>
              <!-- End Type (single-end, paired-end, long-read) -->
              <v-row align="center" class="mt-2">
                <v-col cols="2">
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

              <!-- Parameter Settings -->
              <v-row align="center">
                <v-col cols="2">
                  <v-list-subheader>Parameter Settings</v-list-subheader>
                </v-col>
                <v-col>
                  <QCSettingsDialog v-model="showQCSettingsDialog" @update-params="jobDetails.params = $event">
                    <template v-slot:activator="{ props }">
                      <v-btn 
                        v-bind="props" 
                        variant="text" 
                        size="small" 
                        prepend-icon="$tune" 
                        color="primary"
                        >Settings</v-btn>
									</template>
								</QCSettingsDialog>
                </v-col>
              </v-row>
          
              <!-- Output Filename Suffix -->
                <v-row >
                  <v-col cols="2">
                    <v-list-subheader>Output File Suffix</v-list-subheader>
                  </v-col>
                  <v-col cols="5">
                    <v-text-field
                      v-model="jobDetails.outFileSuffix"
                      :rules="[requiredRule]"
                      :hint="computedHint"
                      persistent-hint
                      variant="outlined"
                      density="compact"
                      color="primary"
                      rounded="lg"
  
                    ></v-text-field>
                  </v-col>
                </v-row>
    
                <!-- Output Directory -->
                <v-row>
                  <v-col cols="2">
                    <v-list-subheader>Output Directory</v-list-subheader>
                  </v-col>
                  <v-col cols="3">
                    <v-btn
                      @click="selectFile('outdir', 'directory')"
                      prepend-icon="$folder"
                      density="comfortable"
                      size="default"
                      class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                      >Select Directory</v-btn
                    >
                    <v-text-field v-model="jobDetails.outdir" :rules="[requiredRule]" style="display: none"></v-text-field>
                  </v-col>
        
                  <v-col class="filename-col">
                    <v-chip v-if="jobDetails.outdir" label color="primary" density="comfortable" class="filename-chip">
                      <v-icon icon="$delete" @click="clearFile('outdir')" class="mr-1"></v-icon>
                      {{ this.extractFilename(jobDetails.outdir) }}</v-chip
                    >
                  </v-col>
                </v-row>
  
                <!-- Select Files -->
                  <v-row class="mt-0">
                  <v-col cols="2">
                    <v-list-subheader>Upload Read Files</v-list-subheader>
                  </v-col>
                  <v-col>
                    <v-row v-for="(entry, index) in jobDetails.entries" :key="index">
                      <!-- Read 1 -->
                      <v-col cols="3">
                        <div v-if="!entry.q1">
                          <v-btn @click="selectDynamicFile(index, 'q1')" prepend-icon="$file" density="comfortable" size="default"
                            class="w-100 text-caption font-weight-medium rounded-lg text-uppercase">
                            Read 1 File
                          </v-btn>
                        </div>
                        <v-chip v-else label color="primary" density="comfortable" class="filename-chip">
                          <v-icon icon="$delete" @click="clearDynamicFile(index, 'q1')" class="mr-1"></v-icon>
                          {{ extractFilename(entry.q1) }}
                        </v-chip>
                      </v-col>
      
                      <!-- Read 2 -->
                      <v-col cols="3" v-if="jobDetails.mode === 'paired-end'">
                        <div v-if="!entry.q2">
                          <v-btn @click="selectDynamicFile(index, 'q2')" prepend-icon="$file" density="comfortable" size="default"
                            class="w-100 text-caption font-weight-medium rounded-lg text-uppercase">
                            Read 2 File
                          </v-btn>
                        </div>
                        <v-chip v-else label color="primary" density="comfortable" class="filename-chip">
                          <v-icon icon="$delete" @click="clearDynamicFile(index, 'q2')" class="mr-1"></v-icon>
                          {{ extractFilename(entry.q2) }}
                        </v-chip>
                      </v-col>
  
                      <!-- Remove Row Button -->
                      <v-col cols="1" v-if="index > 0">
                        <v-btn
                          variant="text"
                          icon="$checkboxIndeterminate"
                          size="small"
                          density="compact"
                          @click="removeEntry(index)"
                        >
                        </v-btn>
                      </v-col>
                    </v-row>
  
                    <!-- Add Entry Button -->
                    <v-row>
                      <v-col cols="12">
                        <v-btn variant="text" prepend-icon="$plusBox" @click="addEntry">Add Entry</v-btn>
                      </v-col>
                    </v-row>
                  </v-col>
                  </v-row>
  
                  <v-btn :disabled="!isJobFormValid" @click="startJob" color="primary">Run QC</v-btn>
  
              </v-container>
            </div>
        </v-form>
      </v-card>
    </v-container>
  
    <!-- Loading Dialog -->
    <v-dialog v-model="processingFastp" persistent>
      <v-card class="mx-auto" width="700">
        <v-list>
          <!-- Title -->
          <v-list-item class="font-weight-bold text-h6 py-0 pl-8 text-button">
            <span>{{ status === "COMPLETE" ? "Job Complete!" : "Processing Job..." }}</span>
            <template v-slot:append>
              <v-img src="assets/marv_metabuli_animated.gif" width="60"></v-img>
            </template>
          </v-list-item>

          <!-- Display Real-time Output -->
          <v-list-item class="pt-1">
            <template v-slot:subtitle>
              <v-textarea
                variant="outlined"
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
            <v-btn v-if="status === 'COMPLETE'" color="primary" @click="hideDialog">Close</v-btn>
            <v-btn v-else variant="plain" color="primary" @click="cancelProcess">Cancel</v-btn>
          </v-card-actions>

        </v-list>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
/* eslint-disable */
import QCSettingsDialog from "@/components/quality-control-page/QCSettingsDialog.vue";

export default {
  name: "QualityControlPage",
  components: {
    QCSettingsDialog,
  },
	data() {
    return {
      isJobFormValid: false,
      jobDetails: {
        // Store job details
        mode: "single-end",
        outFileSuffix: "_out",
        outdir: "/Users/sunnylee/Documents/SteineggerLab/metabuli-qc-test",
        entries: [
          { q1: "", q2: "" }
        ],
        testentries: [
          { q1: "/Users/sunnylee/Documents/SteineggerLab/metabuli-qc-test/SRR24315757_1.fastq", q2: "/Users/sunnylee/Documents/SteineggerLab/metabuli-qc-test/SRR24315757_2.fastq" },
          { q1: "/Users/sunnylee/Documents/SteineggerLab/metabuli-qc-test/SRR23604821_1.fastq", q2: "/Users/sunnylee/Documents/SteineggerLab/metabuli-qc-test/SRR23604821_2.fastq" },
        ],
        params: {},
      },

      // Properties for job processing status, response, and results
			status: "INITIAL", // INITIAL, RUNNING, COMPLETE, ERROR
      backendOutput: "",
      errorHandled: false,
      processingFastp: false, // Flag to indicate if fastp is being processed

      // Properties for QC settings dialog
      showQCSettingsDialog: false,
		};
	},
	computed: {
		computedHint() {
			return `{inputFileName}${this.jobDetails.outFileSuffix}.fastq`;
		},
	},
	methods: {
    // Functions for handling files
    addEntry() {
      this.jobDetails.entries.push({ q1: "", q2: "" });
    },
    selectDynamicFile(index, field) {
      this.selectFile(null, "file").then((filePath) => {
        if (filePath) {
          this.jobDetails.entries[index][field] = filePath;
        }
      });
    },
    clearDynamicFile(index, field) {
      this.jobDetails.entries[index][field] = "";
    },
    removeEntry(index) {
      if (this.jobDetails.entries.length > 1) {
        this.jobDetails.entries.splice(index, 1);
      }
    },

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
    clearFile(field) {
      this.jobDetails[field] = null;
      this.$refs.jobForm.validate();
    },

    // Functions for handling filenames
		extractFilename(path) {
			return path.split("/").pop();
		},
    stripFileExtension(filePath) {
      // 1. Extract just the filename, dropping any directory
      const filename = this.extractFilename(filePath);

      // 2. Separate the filename base from its extension
      // Supported extensions: .fna, .fasta, .fa, .fq, .fastq, and their gzip versions (e.g., .fna.gz)
      const m = filename.match(
        /(.+?)((?:\.fna|\.fasta|\.fa|\.fq|\.fastq)(?:\.gz)?)$/i
      );

      if (m) {
        return {
          base: m[1],  // filename base, e.g. “SRR24315757_1”
          ext:  m[2],  // file extension, e.g. “.fastq” or “.fq.gz”
        };
      } else {
        return { base: filename, ext: "" }; // TODO: handle case where no extension is found
      }
    },

    // Functions handling validation rules
    requiredRule(value) {
      if (value === "" || value === null || value === undefined) {
        return "Required field *";
      }
      return true;
    },

    // Start backend job request
		async startJob() {
			try {
				// Start loading dialog
				this.status = "RUNNING";
        this.processingFastp = true; // Set processing flag

				// Start backend request and job polling simultaneously
				const backendPromise = this.runBackend();
				const pollingPromise = this.pollJobStatus();

				// Wait for either backend to complete or polling to timeout/fail
				await Promise.race([backendPromise, pollingPromise]);

				// If backend completes successfully and polling hasn't timed out
				if (this.status === "COMPLETE") {
          console.log("🚀 Fastp job completed successfully!"); // DEBUG
					// await this.processResults(false); // Make sure this is called after backend completion
					// this.handleJobSuccess();
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
				window.electron.offFastpListeners();
			}
		},
    async runBackend() {
      const outDir = this.jobDetails.outdir;
      const suffix = this.jobDetails.outFileSuffix;
      const modeTag =
        this.jobDetails.mode === "paired-end"   ? "_PE"  :
        this.jobDetails.mode === "single-end"   ? "_SE"  :
        "_LR";
      
      for (const entry of this.jobDetails.testentries) { // TODO: use jobDetails.entries
        // 1) reset status & error flag
        this.status = "RUNNING";
        this.errorHandled = false;
        // DEBUG
        console.log('status:', this.status);
        console.log('errorhandled:', this.errorHandled);
        console.log('modetag:', modeTag);
        console.log('entry:', entry);
        //

        const { base: base1, ext: ext1 } = this.stripFileExtension(entry.q1);
        const batchName = `${base1}${modeTag}`;
        const batchOutDir = `${outDir}/${batchName}`; // TODO: organize code
        await window.electron.mkdir(batchOutDir);

        const params = ["fastp", 
        "-h", `${batchOutDir}/${batchName}.html`,
        "-j", `${batchOutDir}/${batchName}.json`];
          
          // Add read 1 input/output parameters
          params.push(
            "-i", entry.q1, // Read 1 file
            "-o", `${batchOutDir}/${base1}${suffix}${ext1}`, // Output filepath for Read 1
          );
          
          // Add read 2 input/output parameters if paired-end mode
          if (this.jobDetails.mode === "paired-end" && entry.q2) {
            const { base: base2, ext: ext2 } = this.stripFileExtension(entry.q2);
            params.push(
              "-I", entry.q2,
              "-O", `${batchOutDir}/${base2}${suffix}${ext2}`, // Output filepath for Read 2
            );
          }

        console.log("🚀 fastp job requested:", params); // DEBUG
        
        // Return a promise that resolves or rejects based on backend success or failure
        await new Promise((resolve, reject) => {
          // 1. Remove any old listeners
          // window.electron.offFastpListeners();

          const cleanup = () => {
            window.electron.offFastpListeners();
          };
          
          // 2. Attach listeners
          window.electron.onFastpOutput((output) => {
            this.backendOutput += output;
            console.log(output); // DEBUG
            this.$nextTick(() => {
              // Scroll to the bottom
              const textarea = this.$refs.outputTextarea.$el.querySelector("textarea");
              textarea.scrollTop = textarea.scrollHeight;
            });
            // NO cleanup here—we want output throughout the run
            this.status = "RUNNING"; // Keep the status as RUNNING
          });
          window.electron.onFastpError((err) => {
            if (!this.errorHandled) {
              const message = "\nError:\n" + err.toString();
              this.backendOutput += message;
              this.status = "ERROR"; // Signal job polling to stop
              cleanup(); // Cleanup listeners
              reject(new Error("Fastp execution error:", err));
            }
          });
          window.electron.onFastpComplete((msg) => {
            if (this.status !== "RUNNING") return; // Prevent processing if not in RUNNING state
            this.backendOutput += `${msg}\n`;
            this.status = "COMPLETE";
            cleanup(); // Cleanup listeners
            resolve();
          });
          
          window.electron.onFastpCancelled((message) => {
            if (this.status !== "TIMEOUT" && !this.errorHandled) {
              this.backendOutput += `${message}\n`;
              this.status = "CANCELLED";
              cleanup(); // Cleanup listeners
              reject(new Error("Process was cancelled"));
            }
          });

          // 3. Start backend process
          window.electron.runFastp(params);
        });
      }
    },
    // Function to track job status + process results + trigger snackbar
    async pollJobStatus(interval = 500, timeout = Infinity) {
			// FIXME: decide timeout duration
			console.log("🚀 Running fastp job"); // DEBUG
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
			this.processingFastp = false;
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

    // Show/hide dialog
		hideDialog() {
			this.processingFastp = false;
			this.backendOutput = ""; // Clear backend output
		},
    cancelProcess() {
      this.hideDialog();
      window.electron.cancelFastp(); // Cancel the fastp process
    },
	},
};
</script>

<style scoped>
.v-col {
	padding-bottom: 0px;
  padding-top: 0px;
}
.v-row {
	margin-bottom: 0px;
  margin-top: 12px;
}
</style>
