<template>
  <div>
    <v-container>
      <!-- SEARCH SETTINGS PANEL -->
      <v-card class="mb-3 search-settings-panel">
        <!-- HEADER TOOLBAR -->
        <v-toolbar class="custom-toolbar" density="compact">
          Search Settings
          <v-spacer></v-spacer>

          <!-- TABS -->
          <template v-slot:extension>
            <v-tabs v-model="tab">
              <v-tab
                v-for="item in tabItems"
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
            :value="tabItems[0].value"
          >
            <NewSearchTab
            @job-started="emitJobStarted"
            @job-completed="emitJobCompleted"
            @backend-realtime-output="emitBackendRealtimeOutput"
            @job-timed-out="emitJobTimedOut"
             @job-aborted="emitJobAborted"
             @trigger-snackbar="triggerSnackbar"
             @store-job="storeJob"
            ></NewSearchTab>

          </v-tabs-window-item>

          <!-- UPLOAD REPORT -->
          <v-tabs-window-item
            transition="fade-transition"
            reverse-transition="fade-transition"
            :value="tabItems[1].value"
          >
            <v-container
              class="gr-2 upload-container"
              @drop="handleDrop"
              @dragover.prevent
            >
              <!-- TITLE -->
              <v-card flat>
                <v-card-title class="text-button font-weight-bold"
                  >Upload Previous Report</v-card-title
                >
                <v-card-text
                  >Upload report.tsv file directly to see
                  visualization.</v-card-text
                >
              </v-card>

              <v-sheet class="d-flex flex-column w-66 gr-2 mb-2">
                <!-- Upload Box -->
                <div
                  class="d-flex flex-column align-center dotted-border gr-3"
                  @click="triggerFilePicker"
                >
                  <v-file-input
                    v-model="file"
                    ref="fileInput"
                    class="hidden-input"
                    @change="handleFileSelect"
                    accept=".tsv"
                  ></v-file-input>
                  <v-icon
                    size="50"
                    icon="$fileUpload"
                    color="primary"
                  ></v-icon>
                  <p class="text-body-2">
                    Drag & drop your file here or choose from files.
                  </p>
                </div>

                <!-- Show Uploaded Files -->
                <div v-if="file" class="uploaded-file">
                  <v-card-subtitle>Uploaded File</v-card-subtitle>
                  <v-card-text class="py-1">
                    <v-chip
                      label
                      closable
                      prepend-icon="$file"
                      color="primary"
                      @click:close="removeFile"
                      >{{ file.name }}</v-chip
                    >
                  </v-card-text>
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
import NewSearchTab from "@/components/NewSearchTab.vue";
import { trimAndStoreJobsHistory } from "@/plugins/storageUtils.js";

export default {
  name: "SearchSetting",
  components: {
    NewSearchTab,
  },
  data: () => ({
    // Properties for Search Settings Tab Panel
    tab: "runSearch",
    tabItems: [
      { title: "New Search", value: "runSearch" },
      { title: "Upload Report", value: "uploadReport" },
    ],

    // Properties for Upload Report tab
    file: null, // FIXME: rename to uploadedReportFile or Path

    // Properties for job processing status, response, and results
    status: "INITIAL",
    results: "",
    backendOutput: "",

    processedResults: null,
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

  methods: {
    // Cascade emit from NewSearchTab
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

    // UPLOAD REPORT TAB
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
        this.triggerSnackbar(
          "No file selected.",
          "error",
          "warning",
          "Dismiss"
        );
        return;
      }

      try {
        // Starting loading dialog
        this.$emit("job-started", true); // FIXME: true sets isSample as true

        // Process the file content
        await this.processResults("uploadReport", false);
        console.log("processed:", this.processedResults); // DEBUG

        // Throw error if invalid report.tsv file
        if (!this.processedResults.jsonData) {
          throw new Error("Invalid report file.");
        }

        // Set log message
        this.backendOutput = `Report file was processed successfully.\nFile path: ${this.file.path}`;

        setTimeout(() => {
          // Object storing info about completedJob
          const completedJob = {
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
          localStorage.setItem(
            "processedResults",
            JSON.stringify(completedJob)
          );

          // Store completed job in local storage
          console.log("uploadfile completedjob", completedJob); // DEBUG
          this.storeJob(completedJob);

          // Emit job-completed event: close loading dialog and expose results tab in navigation drawer
          this.$emit("job-completed", completedJob);

          // Trigger snackbar
          this.triggerSnackbar(
            "Upload successful. Check the results tab!",
            "success",
            "success",
            "View",
            () => {
              this.$router.push({ name: "ResultsPage" });
            }
          );
        }, 2000);
      } catch (error) {
        console.error("Error processing file: ", error.message); // DEBUG

        // Set log message
        this.backendOutput = "Error processing file: " + error.message;
        this.$emit("job-aborted");

        this.status = "ERROR";
        // Create failed job object to store in local storage
        const failedJob = {
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
        this.storeJob(failedJob);

        // Trigger snackbar
        this.triggerSnackbar(
          "Error processing file. Please check file and try again.",
          "error",
          "warning",
          "Dismiss"
        );
      }
    },


    // // Function for processing results (shared for both tabs)
    async processResults(jobType, isSample) {
      let reportFilePath;
      let kronaFilePath;

      if (jobType === "runSearch") {
        // Resolve outdir path
        let resolvedOutdirPath;
        let jobId;

        resolvedOutdirPath = isSample
          ? this.jobDetailsSample.outdir
          : this.jobDetails.outdir;
        jobId = isSample ? this.jobDetailsSample.jobid : this.jobDetails.jobid;

        // Set file paths for report and krona
        reportFilePath = `${resolvedOutdirPath}/${jobId}_report.tsv`;
        kronaFilePath = `${resolvedOutdirPath}/${jobId}_krona.html`;
      } else if (jobType === "uploadReport") {
        // Set file path for report directly
        reportFilePath = this.file.path;
        kronaFilePath = null;
      }

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
        (firstRecord.rank === "no rank" &&
          firstRecord.taxon_id === "0" &&
          firstRecord.name === "unclassified") ||
        (firstRecord.rank === "no rank" &&
          firstRecord.taxon_id === "1" &&
          firstRecord.name === "root")
      );
    },
    tsvToJSON(tsv) {
      const headers = [
        "proportion",
        "clade_reads",
        "taxon_reads",
        "rank",
        "taxon_id",
        "name",
      ];
      const records = tsv
        .split("\n")
        .map((line) => {
          const data = line.split("\t").map((item) => item.trim()); // Strip leading and trailing whitespace
          return Object.fromEntries(
            headers.map((header, index) => [header, data[index]])
          );
        })
        .filter(
          (record) =>
            !Object.values(record).every(
              (field) => field === "" || field === undefined || field === null
            )
        ); // Filter out empty rows

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

    // Function managing job history storage
    storeJob(job) {
      // Create a new job entry with additional details
      const jobEntry = {
        jobId: job.jobid,
        timestamp: new Date().toISOString(), // Timestamp of job completion
        jobType: job.jobType,
        isSample: job.isSample,
        jobStatus: job.jobStatus,
        backendOutput: job.backendOutput,
        results: job.resultsJSON,
        kronaContent: job.kronaContent,
      };

      // Retrieve existing jobs from localStorage
      let jobsHistory = JSON.parse(localStorage.getItem("jobsHistory") || "[]");
      // Add the new job to the history array
      jobsHistory.push(jobEntry);
      // Trim and store latest 10
      jobsHistory = trimAndStoreJobsHistory(jobsHistory);

      // Clear backendOutput
      this.backendOutput = "";
    },

    // Functions managing snackbar
    triggerSnackbar(
      message,
      color = "info",
      icon = "info",
      buttonText = "",
      action = null
    ) {
      console.log("Snackbar shown"); // DEBUG
      if (this.snackbar.show) return; // If multiple snackbars are triggered, show the first one

      this.snackbar.message = message;
      this.snackbar.color = color;
      this.snackbar.icon = icon;
      this.snackbar.buttonText = buttonText;
      this.snackbar.action = action;

      this.snackbar.show = true;
      console.log("snackbar executed"); // DEBUG
    },
    handleSnackbarAction() {
      if (this.snackbar.action) {
        console.log(this.snackbar.action);
        this.snackbar.action();
      }
      this.snackbar.show = false;
    },
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

.search-settings-panel::after {
  content: "";
  background: url("https://raw.githubusercontent.com/steineggerlab/Metabuli/master/.github/marv_metabuli_small.png")
    no-repeat;
  background-size: 300px 300px;
  opacity: 0.5;
  position: absolute;
  top: 140px;
  right: 20px;
  width: 300px;
  height: 300px;
}

.v-col {
  padding-bottom: 0px;
}
.v-row {
  margin-top: 0px;
  margin-bottom: 0px;
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
</style>
