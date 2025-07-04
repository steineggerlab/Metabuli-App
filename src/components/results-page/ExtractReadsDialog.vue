<template>
  <div>
    <v-dialog
      v-model="downloadMenu"
      :close-on-content-click="false"
      persistent
      :location="menuLocation"
      width="700"
    >
      <template v-slot:activator="{ props }">
        <slot name="activator" v-bind="{ props }"></slot>
      </template>

      <!-- Confirm File Paths Panel -->
      <v-card v-if="!processingExtract" class="mx-auto w-100">
        <v-card-title class="font-weight-bold text-h6 px-6 pt-6 text-button"
          >Extract Reads</v-card-title
        >
        <v-form v-model="isFormValid" ref="extractForm">
          <v-card-text class="pb-6">
            <v-row>
              <v-col>
                <v-card color="secondary" variant="tonal">
                  <v-card-text class="text-caption">
                    Extract reads for Tax ID: <strong>{{ taxonId }}</strong>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <v-card-text class="filepath-textfields">
              <v-row>
                <v-col class="pb-0">
                  <div class="text-caption mb-1">Classification Mode</div>
                  <v-btn-toggle
                    v-model="jobDetails.mode"
                    variant="outlined"
                    color="secondary"
                    divided
                    mandatory
                  >
                    <v-btn
                      value="paired-end"
                      height="30"
                      class="rounded-s-lg rounded-e-0 text-caption"
                      >Paired-end</v-btn
                    >
                    <v-btn
                      value="single-end"
                      height="30"
                      class="rounded-e-0 rounded-s-0 text-caption"
                      >Single-end</v-btn
                    >
                    <v-btn
                      value="long-read"
                      height="30"
                      class="rounded-e-lg rounded-s-0 text-caption"
                      >Long-read</v-btn
                    >
                  </v-btn-toggle>
                </v-col>
              </v-row>
              <v-row>
                <v-col cols="6">
                  <div class="text-caption mb-1">Read 1 (FASTA/Q)</div>
                  <v-text-field
                    v-model="jobDetails.q1"
                    append-icon="$file"
                    type="text"
                    variant="outlined"
                    density="compact"
                    color="secondary"
                    :rules="[requiredRule]"
                    @click:append="selectFile('q1', 'file')"
                    @focus="scrollToEnd($event)"
                  ></v-text-field>
                </v-col>

                <v-col cols="6">
                  <div
                    class="text-caption mb-1"
                    v-if="jobDetails.mode === 'paired-end'"
                  >
                    Read 2 (FASTA/Q)
                  </div>
                  <v-text-field
                    v-model="jobDetails.q2"
                    append-icon="$file"
                    type="text"
                    variant="outlined"
                    density="compact"
                    color="secondary"
                    :rules="[
                      jobDetails.mode === 'paired-end'
                        ? requiredRule
                        : () => true,
                    ]"
                    @click:append="selectFile('q2', 'file')"
                    @focus="scrollToEnd($event)"
                    v-if="jobDetails.mode === 'paired-end'"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col>
                  <div class="text-caption mb-1">
                    Classification File (JobID_classifications.tsv)
                  </div>
                  <v-text-field
                    v-model="jobDetails.classifications"
                    append-icon="$file"
                    type="text"
                    variant="outlined"
                    density="compact"
                    color="secondary"
                    :rules="[requiredRule]"
                    @click:append="selectFile('classifications', 'file')"
                    @focus="scrollToEnd($event)"
                  ></v-text-field>
                </v-col>
              </v-row>

              <v-row>
                <v-col>
                  <div class="text-caption mb-1">Database Directory</div>
                  <v-text-field
                    v-model="jobDetails.database"
                    append-icon="$folder"
                    type="text"
                    variant="outlined"
                    density="compact"
                    color="secondary"
                    :rules="[requiredRule]"
                    @click:append="selectFile('database', 'directory')"
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
                <v-col class="pt-0">
                  <small class="text-caption text-medium-emphasis"
                    >*Missing files will appear as empty fields. Please select
                    the correct file.</small
                  >
                </v-col>
              </v-row>

              <!-- Optional Settings Expansion Panel -->
              <v-row>
                <v-col>
                  <v-btn
                    text="Optional Settings"
                    variant="text"
                    color="secondary"
                    :append-icon="
                      expandOptionalSettings ? '$collapse' : '$expand'
                    "
                    @click="expandOptionalSettings = !expandOptionalSettings"
                    class="font-weight-bold"
                  ></v-btn>
                  <v-expand-transition>
                    <div
                      v-if="expandOptionalSettings"
                      class="search-advanced-settings pt-2 pb-0"
                    >
                      <!-- Input fields -->
                      <v-row
                        v-for="(setting, key) in optionalSettings"
                        :key="key"
                      >
                        <v-col cols="6">
                          <v-list-subheader
                            class="pr-0 text-high-emphasis font-weight-medium"
                          >
                            <code>{{ setting.title }}</code>
                          </v-list-subheader>
                          <small
                            class="search-advanced-settings text-caption text-medium-emphasis pr-0"
                          >
                            {{ setting.description }}
                          </small>
                        </v-col>

                        <v-col>
                          <v-text-field
                            variant="outlined"
                            rounded="lg"
                            density="compact"
                            color="primary"
                            :placeholder="
                              setting.extra?.file ? 'Select Folder' : none
                            "
                            v-model="setting.value"
                            :prepend-icon="getAppendInnerIcon(setting)"
                            :rules="getValidationRules(setting.parameter)"
                            :suffix="setting.extra?.suffix || ''"
                            @click:prepend="
                              handleOptionalSettingsTextFieldClick(setting)
                            "
                            @focus="scrollToEnd($event)"
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </div>
                  </v-expand-transition>
                </v-col>
              </v-row>

              <v-row>
                <v-col>
                  <v-btn
                    color="secondary"
                    :disabled="!isFormValid || isExtractDisabled"
                    @click="downloadReads"
                    block
                    flat
                    >Extract Reads</v-btn
                  >
                </v-col>

                <v-col>
                  <v-btn
                    color="grey"
                    variant="outlined"
                    @click="hideDialog"
                    block
                    flat
                    >Cancel</v-btn
                  >
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
            <span>{{
              status === "RUNNING"
                ? "Extracting Reads..."
                : "Extract Reads Complete!"
            }}</span>
            <template v-slot:append>
              <v-img src="assets/marv_metabuli_animated.gif" width="60"></v-img>
            </template>
          </v-list-item>
          <div>
            <!-- Display Real-time Output -->
            <v-list-item class="pt-4">
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
                  class="pt-4 mt-3 mx-0 text-caption"
                  ref="outputTextarea"
                ></v-textarea>
              </template>
            </v-list-item>

            <!-- Cancel Button -->
            <v-card-text>
              <v-row>
                <v-col>
                  <v-btn
                    v-if="status === 'COMPLETE'"
                    variant="tonal"
                    color="primary"
                    @click="openItemInFolder"
                    block
                    >Open in Folder</v-btn
                  >
                </v-col>
                <v-col>
                  <v-btn
                    variant="outlined"
                    color="grey"
                    @click="cancelBackend"
                    block
                    >{{ status === "RUNNING" ? "Cancel" : "Close" }}</v-btn
                  >
                </v-col>
              </v-row>
            </v-card-text>
          </div>
        </v-list>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :timeout="snackbar.timeout"
      location="top"
      color="white"
    >
      <v-icon :color="snackbar.color" :icon="`$${snackbar.icon}`"></v-icon>
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          v-if="snackbar.buttonText"
          :color="snackbar.color"
          variant="text"
          @click="handleSnackbarAction"
          >{{ snackbar.buttonText }}</v-btn
        >
        <v-btn
          v-else
          :color="snackbar.color"
          variant="text"
          @click="snackbar.show = false"
        >
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
const isDev = process.env.NODE_ENV !== "production";

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

    // Extract Reads
    jobDetails: isDev
      ? {
          mode: "",
          jobid: "",
          q1: "",
          q2: "",
          classifications: "",
          database: "",
          outdir: "",

          forceError: true,
        }
      : {
          mode: "",
          jobid: "",
          q1: "",
          q2: "",
          classifications: "",
          database: "",
          outdir: "",
        },
    optionalSettings: {
      extractFormat: {
        title: "--extract-format",
        description: "0: original format, 1: FASTA, 2: FASTQ",
        parameter: "--extract-format",
        value: 0,
        type: "INTEGER",
      },
      taxonomyPath: {
        title: "--taxonomy-path",
        description: "Directory where the taxonomy dump files are stored",
        parameter: "--taxonomy-path",
        value: "",
        type: "STRING",
        extra: {
          appendIcon: "folder",
          file: true,
        },
      },
    },
    validationRules: {
      // Input is required
      "--extract-format": (value) => {
        return (
          Number.isInteger(Number(value)) || "Input must be a valid integer"
        );
      },
    }, // FIXME: move requiredRule to here
    expandOptionalSettings: false,

    // Properties for backend job processing status, backend output, error tracking
    status: "INITIAL",
    backendOutput: "",
    errorHandled: false,

    // Extract Job Processing Dialog
    processingExtract: false,

    // Form Validation (all input fields must be non-empty)
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
        this.isExtractDisabled =
          !["single-end", "paired-end", "long-read"].includes(
            this.jobDetails.mode,
          ) ||
          !this.jobDetails.q1 ||
          !this.jobDetails.classifications ||
          !this.jobDetails.database ||
          (this.jobDetails.mode === "paired-end" && !this.jobDetails.q2);
      },
    },
  },

  methods: {
    // Textfield functions for Optional Settings
    getAppendInnerIcon(setting) {
      return setting.extra?.appendIcon ? `$${setting.extra.appendIcon}` : null;
    },
    getValidationRules(parameter) {
      if (this.validationRules[parameter]) {
        return [this.validationRules[parameter]];
      }
      return [];
    },
    async handleOptionalSettingsTextFieldClick(setting) {
      if (setting.extra?.file) {
        const filePath = await this.pickFile("directory");
        setting.value = filePath;
      }
    },
    // Functions for handling files
    async pickFile(type, field = null, index = null) {
      if (!window.electron) {
        this.$emit(
          "trigger-snackbar",
          "File dialog is not supported in the web environment.",
          "error",
          "warning",
          "Dismiss",
        );
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
        this.$emit(
          "trigger-snackbar",
          `File selection error: ${err}`,
          "error",
          "fileAlert",
          "Dismiss",
        );
      } finally {
        // re-validate the form
        this.$refs.extractForm?.validate();
      }
    },

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
          this.$emit(
            "trigger-snackbar",
            `File selection error: ${error}`,
            "error",
            "fileAlert",
            "Dismiss",
          );
        }
      } else {
        console.error("File dialog is not supported in the web environment."); // DEBUG
        this.$emit(
          "trigger-snackbar",
          "File dialog is not supported in the web environment.",
          "error",
          "warning",
          "Dismiss",
        );
      }
    },
    openItemInFolder() {
      window.electron.openItemInFolder(this.jobDetails.outdir);
    },
    insertTaxonIdBeforeExtension(filePath, taxonId) {
      // TODO: unused, remove
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
        this.showProcessingExtractPanel();

        // Start backend request and job polling simultaneously
        await this.runBackend();
        await this.pollJobStatus();

        // If backend completes successfully and polling hasn't timed out
        if (this.status === "COMPLETE") {
          console.log("🚀 Extract job completed successfully."); // DEBUG
        }
      } catch (error) {
        console.error(error); // Single error handling point
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

      // Add outdir
      params.push("--outdir", this.jobDetails.outdir);

      // Add any optionalSettings
      Object.values(this.optionalSettings).forEach((setting) => {
        if (setting.value !== "" && setting.value !== undefined) {
          let val;
          if (setting.type === "INTEGER") val = parseInt(setting.value);
          else if (setting.type === "FLOAT") val = parseFloat(setting.value);
          else val = setting.value;
          params.push(setting.parameter, val);
        }
      });

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
        // Real-time output
        window.electron.onBackendRealtimeOutput((output) => {
          this.backendOutput += output; // Append output in real-time
          this.$nextTick(() => {
            // Scroll to the bottom
            const textarea =
              this.$refs.outputTextarea.$el.querySelector("textarea");
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
            this.errorHandled = true;
            this.backendOutput += `Error: ${error.toString()}\n`;
            this.status = "ERROR"; // Signal job polling to stop
            reject(new Error(error.toString()));
          }
        });

        window.electron.onBackendCancelled((message) => {
          if (!this.errorHandled) {
            this.errorHandled = true;
            this.backendOutput += `${message}\n`;
            this.status = "CANCELLED";
            reject(new Error("Process was cancelled"));
          }
        });

        // Start backend process
        if (isDev && this.jobDetails.forceError) {
          console.warn("⚠️ Simulating extract error for testing");
          window.electron.simulateMetabuliError();
        } else {
          window.electron.runBackend(params);
        }
      });
    },
    // Function to track job status + process results + trigger snackbar
    async pollJobStatus(interval = 500, timeout = Infinity) {
      console.log("🚀 Running extract job");
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (this.errorHandled || this.status === "COMPLETE") return true;

        if (this.status === "ERROR") {
          throw new Error("Backend error occurred");
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
    },
    handleJobError(error) {
      this.errorHandled = true; // Ensure flag is set to prevent further handling

      // Trigger snackbar corresponding to case
      if (this.status === "CANCELLED") {
        this.triggerSnackbar("Job was cancelled.", "info", "cancel", "Dismiss");
      } else if (this.status === "ERROR") {
        this.triggerSnackbar(error, "error", "warning", "Dismiss");
      } else {
        this.triggerSnackbar(
          "An unexpected error occurred. Please try again.",
          "error",
          "warning",
          "Dismiss",
        );
      }
    },

    // Functions managing snackbar
    triggerSnackbar(
      message,
      color = "info",
      icon = "info",
      buttonText = "",
      action = null,
    ) {
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
      this.processingExtract = true;
    },
    hideDialog() {
      this.downloadMenu = false;
      this.processingExtract = false;
      this.backendOutput = ""; // Clear backend output
    },
    cancelBackend() {
      this.hideDialog();
      window.electron.cancelBackend();
    },
  },

  async mounted() {
    const processedResults = JSON.parse(
      localStorage.getItem("processedResults"),
    );
    if (processedResults) {
      // Copy values from processedResults to jobDetails
      if (processedResults.jobDetails) {
        Object.assign(this.jobDetails, processedResults.jobDetails);
      }
      this.jobDetails.forceError = isDev ? 1 : 0;
      // Loop over each path and check if the file exists
      const keyPath = {
        q1: processedResults.q1,
        q2: processedResults.q2,
        classifications: `${processedResults.outdir}/${processedResults.jobid}_classifications.tsv`,
        database: processedResults.database,
        outdir: processedResults.outdir,
      };
      for (const key of Object.keys(keyPath)) {
        const fileExists = await window.electron.fileExists(keyPath[key]);
        this.jobDetails[key] = fileExists ? keyPath[key] : ""; // Set to empty string if the file doesn't exist
      }
    }
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
  padding-top: 16px;
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

.search-advanced-settings .v-list-subheader {
  min-height: 0px;
}
</style>
