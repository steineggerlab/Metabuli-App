<template>
  <div>
    <v-container>
      <!-- SEARCH SETTINGS PANEL -->
      <v-card class="mb-3 search-settings-panel">
        <!-- HEADER TOOLBAR -->
        <v-toolbar class="custom-toolbar" density="compact">
          Search Settings
          <v-spacer></v-spacer>
          <v-btn icon @click="toggleApiDialog">
            <v-icon icon="$api" size="28"></v-icon>
          </v-btn>

          <!-- TABS -->
          <template v-slot:extension>
            <v-tabs v-model="tab">
              <v-tab
                v-for="item in items"
                :text="item.title"
                :key="item.value"
                :value="item.value"
              ></v-tab>
            </v-tabs>
          </template>
        </v-toolbar>

        <v-tabs-window v-model="tab">
          <!-- RUN SEARCH -->
          <v-tabs-window-item
            transition="fade-transition"
            reverse-transition="fade-transition"
            :value="items[0].value"
          >
            <v-container>
              <!-- Title -->
              <v-card flat>
                <v-card-title> 
                  <v-icon
                    left
                    class="mr-1 align-center"
                    icon="$dna"
                  ></v-icon>
                  Configure Search </v-card-title>
              </v-card>

              <!-- End Type (single-end, paired-end, long-read) -->
              <v-form ref="jobForm" v-model="isJobFormValid">
                <div class="w-50">
                <v-radio-group
                  v-model="endType"
                  inline
                  class="d-flex align-center mb-0"
                >
                  <v-radio label="Single-end" value="single-end"></v-radio>
                  <v-radio label="Paired-end" value="paired-end"></v-radio>
                  <v-radio label="Long-read" value="long-read"></v-radio>
                </v-radio-group>

                <!-- Job ID -->
                <v-text-field
                  label="Job ID"
                  variant="underlined"
                  v-model="jobDetails.jobid"

                  :hint="computedHint"
                  persistent-hint
                  class="mb-2"
                ></v-text-field>

                <!-- FIXME: refactor -->
                <v-sheet class="d-flex align-center mb-2">
                  <v-btn @click="selectFile('q1', 'file')"
                    >Select q1 File</v-btn
                  >
                  <div class="ml-3">Selected Path: {{ jobDetails.q1 }}</div>
                  <v-text-field
                    v-model="jobDetails.q1"
                    :rules="[requiredRule]"
                    style="display: none"
                  ></v-text-field>
                </v-sheet>

                <v-sheet
                  class="d-flex align-center mb-2"
                  v-if="endType === 'paired-end'"
                >
                  <v-btn @click="selectFile('q2', 'file')"
                    >Select q2 File</v-btn
                  >
                  <div class="ml-3">Selected Path: {{ jobDetails.q2 }}</div>
                  <v-text-field
                    v-model="jobDetails.q2"
                    :rules="[
                      endType === 'paired-end' ? requiredRule : () => true,
                    ]"
                    style="display: none"
                  ></v-text-field>
                </v-sheet>

                <v-sheet class="d-flex align-center mb-2">
                  <v-btn @click="selectFile('database', 'directory')"
                    >Select Database</v-btn
                  >

                  <div class="ml-3">
                    Selected Path: {{ jobDetails.database }}
                  </div>
                  <v-text-field
                    v-model="jobDetails.database"
                    :rules="[requiredRule]"
                    style="display: none"
                  ></v-text-field>
                </v-sheet>

                <v-sheet class="d-flex align-center mb-2">
                  <v-btn @click="selectFile('outdir', 'directory')"
                    >Select Output Directory</v-btn
                  >
                  <div class="ml-3">Selected Path: {{ jobDetails.outdir }}</div>
                  <v-text-field
                    v-model="jobDetails.outdir"
                    :rules="[requiredRule]"
                    style="display: none"
                  ></v-text-field>
                </v-sheet>
                </div>

                <!-- ADVANCED SETTINGS -->
                <v-divider class="mt-7"></v-divider>
                <v-card-actions>
                  <v-btn
                    text="Advanced Settings"
                    :append-icon="
                      expandAdvancedSettings ? '$collapse' : '$expand'
                    "
                    @click="expandAdvancedSettings = !expandAdvancedSettings"
                  ></v-btn>
                </v-card-actions>

                <!-- EXPANDABLE PANEL -->
                <v-expand-transition>
                  <div v-if="expandAdvancedSettings" class="py-2">
                    <v-container fluid>
                      <v-row
                        v-for="(setting, key) in advancedSettings"
                        :key="key"
                      >
                        <v-col cols="3">
                          <v-list-subheader>
                            <v-tooltip location="top">
                              <template v-slot:activator="{ props }">
                                <v-icon
                                  v-bind="props"
                                  icon="$helpCircle"
                                ></v-icon>
                              </template>
                              {{ setting.description }}
                            </v-tooltip>
                            {{ setting.title }}
                          </v-list-subheader>
                        </v-col>

                        <v-col cols="6">
                          <v-text-field
                            variant="outlined"
                            rounded="lg"
                            density="compact"
                            v-model="setting.value"
                            :append-inner-icon="getAppendInnerIcon(setting)"
                            :label="setting.parameter"
                            :rules="getValidationRules(setting.parameter)"
                            :suffix="setting.extra?.suffix || ''"
                            v-on:click="
                              handleAdvancedSettingsTextFieldClick(setting)
                            "
                          ></v-text-field>
                        </v-col>
                      </v-row>
                    </v-container>
                  </div>
                </v-expand-transition>

                <!-- BUTTONS -->
                <v-sheet class="d-flex align-center mb-2">
                  <v-btn
                    :disabled="!isJobFormValid"
                    @click="startJob"
                    color="primary"
                  >
                    Run Metabuli
                    <template v-slot:loader>
                      <v-progress-circular indeterminate></v-progress-circular>
                    </template>
                  </v-btn>

                  <v-btn
                    variant="outlined"
                    class="ml-3"
                    @click="loadSampleData"
                    color="primary"
                  >
                    Load Sample Data
                  </v-btn>
                </v-sheet>
              </v-form>
            </v-container>
          </v-tabs-window-item>

          <!-- UPLOAD REPORT -->
          <v-tabs-window-item
            transition="fade-transition"
            reverse-transition="fade-transition"
            :value="items[1].value"
          >
            <v-container
              class="gr-2 upload-container"
              @drop="handleDrop"
              @dragover.prevent
            >
              <!-- TITLE -->
              <v-card flat>
                <v-card-title>
                  <v-icon
                    left
                    class="mr-1 align-center"
                    icon="$fileUpload"
                  ></v-icon>
                  Upload Report File
                </v-card-title>
                <v-card-text
                  >Upload report.tsv file directly to see
                  visualization.</v-card-text
                >
              </v-card>

              <v-sheet class="d-flex flex-column w-66 gr-2 mb-2">
                <!-- Upload Box -->
                <div
                  class="align-center dotted-border"
                  @click="triggerFilePicker"
                >
                  <v-file-input
                    v-model="file"
                    ref="fileInput"
                    class="hidden-input"
                    @change="handleFileSelect"
                    accept=".tsv"
                  ></v-file-input>
                  <v-icon size="50" icon="$fileUpload" color="#004DE5"></v-icon>
                  <p>Drag & drop your file or select a file.</p>
                </div>

                <!-- Show Uploaded Files -->
                <div v-if="file" class="uploaded-file">
                  <v-card-subtitle>Uploaded File</v-card-subtitle>
                  <v-chip
                    close
                    closable
                    color="primary"
                    @click:close="removeFile"
                    >{{ file.name }}</v-chip
                  >
                </div>

                <!-- Upload Button -->
                <v-btn
                  block
                  color="primary"
                  @click="uploadFile"
                  :disabled="!file"
                  >Upload</v-btn
                >
              </v-sheet>
            </v-container>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>

      <!-- API Dialog -->
      <v-dialog v-model="apiDialog" max-width="800">
        <v-card>
          <v-card-title> cURL Command </v-card-title>
          <v-card-text>
            Use this command to get a submit a file in FASTA or FASTQ format to
            the Metabuli search server. Replace the ‘PATH_TO_FILE’ and
            '@PATH_TO_DIRECTORY' string with the path to the file or directory.
          </v-card-text>
          <v-card-text>
            <code
              >curl -X POST -F q1=@PATH_TO_FILE -F q2=@PATH_TO_FILE -F
              'database[]=@PATH_TO_DIRECTORY' -F 'mode=3diaa' -F
              outdir=@PATH_TO_DIRECTORY -F jobid='test'
              "http://localhost:8081/api/ticket"</code
            >
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" text @click="closeApiDialog"
              >Close</v-btn
            >
          </v-card-actions>
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
    </v-container>
  </div>
</template>

<script>
export default {
  name: "SearchSetting",
  data: () => ({
    tab: "runSearch",
    items: [
      { title: "Run Search", value: "runSearch" },
      { title: "Upload Report", value: "uploadReport" },
    ], // FIXME: rename to tabItems
    isJobFormValid: false,
    jobDetails: {
      // Store job details including file paths
      q1: "",
      q2: "",
      database: "",
      outdir: "",
      jobid: "",
    },
    advancedSettings: {
      maxRam: {
        title: "Max RAM",
        description: "The maximum RAM usage. (128 GiB by default)",
        parameter: "--max-ram",
        value: 128,
        type: "INTEGER",
        extra: {
          suffix: "GiB",
        },
      },
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
        description:
          "The minimum score to be classified at or below species rank.",
        parameter: "--min-sp-score",
        value: "",
        type: "FLOAT",
      },
      taxonomyPath: {
        title: "Taxonomy Path",
        description:
          "Directory where the taxonomy dump files are stored. (DBDIR/taxonomy by default)",
        parameter: "--taxonomy-path",
        value: "",
        type: "STRING",
        extra: {
          appendIcon: "file",
          file: true,
        },
      },
      reducedAA: {
        title: "Reduced AA",
        description:
          "0. Use 20 alphabets or 1. Use 15 alphabets to encode amino acids. Give the same value used for DB creation.",
        parameter: "--reduced-aa", // FIXME: 엥 왜 안돼
        value: "",
        type: "INTEGER",
      },
      accessionLevel: {
        title: "Accession Level",
        description:
          "Set 1 to use accession level classification (0 by default). It is available when the DB is also built with accession level taxonomy.",
        parameter: "--accession-level",
        value: "",
        type: "INTEGER",
      },
    },
    validationRules: {
      "--max-ram": (value) => {
        // Input must be valid integer
        if (value === "" || value === null || value === undefined) {
          return true;
        }
        return (
          Number.isInteger(Number(value)) || "Input must be a valid integer"
        );
      },
      "--threads": (value) => {
        // Input must be valid integer
        if (value === "" || value === null || value === undefined) {
          return true;
        }
        return (
          Number.isInteger(Number(value)) || "Input must be a valid integer"
        );
      },
      "--min-score": (value) => {
        // Input must be valid float
        if (value === "" || value === null || value === undefined) {
          return true;
        }
        return (
          (!isNaN(value) && parseFloat(value) === Number(value)) ||
          "Input must be a valid float"
        );
      },
      "--min-sp-score": (value) => {
        // Input must be valid float
        if (value === "" || value === null || value === undefined) {
          return true;
        }
        return (
          (!isNaN(value) && parseFloat(value) === Number(value)) ||
          "Input must be a valid float"
        );
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
    jobDetailsSample: {
      // Sample job details
      q1: "SRR14484345_1.fq",
      q2: "SRR14484345_2.fq",
      database: "refseq_virus",
      jobid: "sample_data",
      outdir: "/sample_data",
      maxram: 128,
    },
    file: null, // FIXME: rename to uploadedReportFile or Path
    status: "INITIAL",
    results: "",
    apiDialog: false, // Control the visibility of the API dialog
    endType: "single-end", // FIXME: move this to jobDetails
    expandAdvancedSettings: false,
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
    advancedSettings: {
      handler(newVal) {
        console.log(newVal); // DEBUG
      },
      deep: true,
    },
  },
  computed: {
    computedHint() {
      return `${this.jobDetails.jobid}_report.tsv`;
    },
  },

  methods: {
    requiredRule(value) {
      return value !== "" || "This field is required";
    },
    getAppendInnerIcon(setting) {
      return setting.extra?.appendIcon ? `$${setting.extra.appendIcon}` : null;
    },
    getValidationRules(parameter) {
      if (this.validationRules[parameter]) {
        return [this.validationRules[parameter]];
      }
      return [];
    },
    async handleAdvancedSettingsTextFieldClick(setting) {
      if (setting.extra?.file) {
        const filePath = await this.selectFile(null, "directory");
        setting.value = filePath;
      }
    },
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
        // this.$emit("snackbar", "No file selected", "error");
        this.$emit("error");
        return;
      }

      try {
        this.$emit("job-started", true); // FIXME: true sets isSample as true

        setTimeout(() => {
          const reportFilePath = this.file.path;

          // Process the file content
          this.$emit("report-uploaded", reportFilePath);

          this.triggerSnackbar(
            "Upload successful. Check the results tab!",
            "success",
            "success",
            "View",
            () => {
              this.$router.push({
                name: "ResultsPage",
                query: {
                  reportFilePath: reportFilePath,
                  jobType: "uploadReport",
                },
              });
            }
          );
        }, 2000); // FIXME: add await, wait for file to be processed, if file isnt right format, trigger error snackbar
      } catch (error) {
        console.error("Error processing file: ", error.message); // DEBUG
        this.triggerSnackbar(
          "Error processing file. Please check file and try again.",
          "error",
          "warning",
          "Dismiss"
        );
        this.$emit("error");
      }
    },
    startJob() {
      this.$emit("job-started", false); // Emit job-started event to parent
      // Simulate job process
      this.runBackend();
    },
    async runBackend() {
      const params = ["classify"];

      // Add input
      if (this.endType === "single-end") {
        params.push("--seq-mode", 1, this.jobDetails.q1);
      } else if (this.endType === "paired-end") {
        params.push(this.jobDetails.q1, this.jobDetails.q2);
      } else if (this.endType === "long-read") {
        params.push("--seq-mode", 3, this.jobDetails.q1);
      }

      // Add dbdir, outdir, jobid
      params.push(
        this.jobDetails.database,
        this.jobDetails.outdir,
        this.jobDetails.jobid
      );

      // Add advanced settings
      for (const key in this.advancedSettings) {
        let value;
        const setting = this.advancedSettings[key];
        if (setting.value !== "") {
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
      console.log(params); // DEBUG

      try {
        // Run backend process
        this.status = "RUNNING";
        window.electron.runBackend(params);

        // Poll job status
        await this.pollJobStatus();
        this.handleJobSuccess();
      } catch (error) {
        console.error("Error running backend:", error.message); // DEBUG
        this.handleJobError(error);
      } finally {
        this.status = "INITIAL";
      }
    },

    // Function to track job status
    async pollJobStatus(interval = 500, timeout = 60000) {
      console.log("Running poll");
      const start = Date.now();
      while (Date.now() - start < timeout) {
        try {
          if (this.status === "COMPLETE") {
            return true;
          } else if (this.status === "ERROR") {
            throw new Error("Backend error occurred");
          }
        } catch (error) {
          console.error("Error polling job status:", error); // DEBUG
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
      this.status = "TIMEOUT";
      throw new Error("Polling timed out");
    },

    loadSampleData() {
      this.$emit("job-started", true);

      setTimeout(() => {
        this.$emit("job-completed", {
          outdir: this.jobDetailsSample.outdir,
          jobid: this.jobDetailsSample.jobid,
          isSample: true,
        });

        const completedJob = {
          outdir: this.jobDetailsSample.outdir,
          jobid: this.jobDetailsSample.jobid,
          isSample: true,
          jobType: "runSearch",
        };

        this.triggerSnackbar(
          "Sample data successfully loaded.",
          "success",
          "success",
          "View",
          () => {
            this.$router.push({
              name: "ResultsPage",
              query: {
                ...completedJob,
              },
            });
          }
        );
      }, 2000); // Simulate a job taking 2 seconds
    },

    async selectFile(field, type) {
      // File picker select function for RUN SEARCH TAB
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
          this.triggerSnackbar(
            `File selection error: ${error}`,
            "error",
            "fileAlert",
            "Dismiss"
          );
        }
      } else {
        console.error("File dialog is not supported in the web environment."); // DEBUG
        this.triggerSnackbar(
          "File dialog is not supported in the web environment.",
          "error",
          "warning",
          "Dismiss"
        );
      }
    },
    triggerSnackbar(message, color, icon, buttonText, action) {
      console.log("Snackbar triggered");
      // this.snackbar.show = false; // Reset snackbar to ensure reactivity
      if (this.snackbar.show) return; // If multiple snackbars are triggered, show the first one

      this.snackbar.message = message;
      this.snackbar.color = color || "info";
      this.snackbar.icon = icon || "info";
      this.snackbar.buttonText = buttonText || "";
      this.snackbar.action = action || null;

      this.snackbar.show = true;
      console.log("snackbar executed");
    },
    handleSnackbarAction() {
      if (this.snackbar.action) {
        console.log(this.snackbar.action);
        this.snackbar.action();
      }
      this.snackbar.show = false;
    },
    toggleApiDialog() {
      this.apiDialog = !this.apiDialog;
    },
    closeApiDialog() {
      this.apiDialog = false;
    },
    handleJobSuccess() {
      console.log("Job polling completed successfully."); // DEBUG
      const completedJob = {
        outdir: this.jobDetails.outdir,
        jobid: this.jobDetails.jobid,
        isSample: false,
        jobType: "runSearch",
      };

      this.$emit("job-completed", {
        outdir: this.jobDetails.outdir,
        jobid: this.jobDetails.jobid,
        isSample: false,
      });

      this.triggerSnackbar(
        "Job successfully completed. Check the results tab.",
        "success",
        "success",
        "View",
        () => {
          this.$router.push({
            name: "ResultsPage",
            query: {
              ...completedJob,
            },
          });
        }
      );
    },
    handleJobError(error) {
      console.error("Job polling failed:", error); // DEBUG
      if (this.status === "TIMEOUT") {
        this.$emit("job-timed-out");
        this.triggerSnackbar(
          "Job execution timed out",
          "warning",
          "timer",
          "Retry",
          this.startJob
        );
      } else {
        this.$emit("job-aborted");
        this.triggerSnackbar(
          `Error: ${error.message}`,
          "error",
          "warning",
          "Dismiss"
        );
      }
    },
    handleTimeout() {
      window.electron.cancelBackend();
    },
  },

  mounted() {
    window.electron.onBackendOutput((output) => {
      console.log("Backend Output:", output); //DEBUG
      this.status = "COMPLETE"; // Signal job polling
    });

    window.electron.onBackendError((error) => {
      console.error("Backend Error:", error); // DEBUG
      this.status = "ERROR"; // Signal job polling to stop
      this.handleJobError(new Error("Backend execution error"));
    });

    window.electron.onBackendCancelled((message) => {
      console.log("Backend cancelled:", message); // DEBUG
      if (this.status !== "TIMEOUT") {
        this.status = "ERROR"; // Signal job polling to stop
        this.handleJobError(new Error("Process was cancelled"));
      }
    });
  },
};
</script>

<style scoped>
.status-container {
  display: flex;
  align-items: center;
}

/* SEARCH SETTINGS TAB */
.search-settings-panel {
  position: relative;
}
.search-settings-panel::after {
  content: "";
  background: url("https://raw.githubusercontent.com/steineggerlab/Metabuli/master/.github/marv_metabuli_small.png")
    no-repeat;
  background-size: 300px 300px;
  opacity: 0.5;
  position: absolute;
  top: 110px;
  right: 5px;
  width: 300px;
  height: 300px;
}

/* UPLOAD REPORT TAB */
.upload-container {
  display: flex;
  flex-direction: column;
}

.hidden-input {
  display: none;
}

.dotted-border {
  border: 2px dashed #ccc;
  border-radius: 5px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
}

.dotted-border:hover {
  background-color: #f9f9f9;
}

.uploaded-file {
  margin: 10px 0;
}

/* API DIALOG */
code {
  font-family: Roboto;
  color: grey;
  background-color: #f1f1f1;
  padding: 2px;
  font-size: 12px;
}

.custom-snackbar {
  top: 64px !important; /* Adjust this value to match your app bar height */
}

.v-col {
  padding-bottom: 0px;
}
</style>
