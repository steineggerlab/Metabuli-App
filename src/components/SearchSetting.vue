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
          <v-tabs-window-item :value="items[0].value">
            <v-container>
              <v-radio-group
                v-model="endType"
                inline
                class="d-flex align-center mb-0"
              >
                <v-radio label="Single-end" value="single-end"></v-radio>
                <v-radio label="Paired-end" value="paired-end"></v-radio>
              </v-radio-group>

              <v-text-field
                label="Job ID"
                variant="underlined"
                v-model="jobDetails.jobid"
                width="500"
              ></v-text-field>

              <!-- FIXME: refactor -->
              <v-sheet class="d-flex align-center mb-2">
                <v-btn @click="selectFile('q1', 'file')">Select q1 File</v-btn>
                <div class="ml-3">Selected Path: {{ jobDetails.q1 }}</div>
              </v-sheet>

              <v-sheet
                class="d-flex align-center mb-2"
                v-if="endType === 'paired-end'"
              >
                <v-btn @click="selectFile('q2', 'file')">Select q2 File</v-btn>
                <div class="ml-3">Selected Path: {{ jobDetails.q2 }}</div>
              </v-sheet>

              <v-sheet class="d-flex align-center mb-2">
                <v-btn @click="selectFile('database', 'directory')"
                  >Select Database</v-btn
                >
                <div class="ml-3">Selected Path: {{ jobDetails.database }}</div>
              </v-sheet>

              <v-sheet class="d-flex align-center mb-2">
                <v-btn @click="selectFile('outdir', 'directory')"
                  >Select Output Directory</v-btn
                >
                <div class="ml-3">Selected Path: {{ jobDetails.outdir }}</div>
              </v-sheet>

              <v-text-field
                label="Max RAM"
                variant="underlined"
                v-model="jobDetails.maxram"
                width="500"
              ></v-text-field>

              <!-- BUTTONS -->
              <v-sheet class="d-flex align-center mb-2">
                <v-btn :loading="loading" @click="startJob" color="primary">
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
            </v-container>
          </v-tabs-window-item>

          <!-- UPLOAD REPORT -->
          <v-tabs-window-item :value="items[1].value">
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
                  Upload File
                </v-card-title>
                <v-card-text
                  >Upload report.tsv file to visualize directly.</v-card-text
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
      <v-snackbar v-model="snackbar.show" :timeout="snackbar.timeout">
        <v-icon :color="snackbar.color" :icon="`$${snackbar.icon}`"></v-icon>
        {{ snackbar.message }}
        <template v-slot:actions>
          <v-btn
            :color="snackbar.color"
            variant="text"
            @click="snackbar.show = false"
            >Close</v-btn
          >
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
    ],
    jobDetails: {
      // Store job details including file paths
      q1: "",
      q2: "",
      database: "",
      outdir: "",
      jobid: "",
      maxram: null,
    },
    jobDetailsSample: {
      // Sample job details
      q1: "SRR14484345_1.fq",
      q2: "SRR14484345_2.fq",
      database: "refseq_virus",
      jobid: "sample_data",
      outdir: "/sample_data",
      maxram: 128,
    },
    file: null,
    status: "INITIAL",
    results: "",
    loading: false,
    apiDialog: false, // Control the visibility of the API dialog
    endType: "single-end",
    snackbar: {
      show: false,
      message: "",
      color: "",
      icon: "",
      timeout: 3000,
    },
  }),

  methods: {
    handleDrop(event) {
      const file = event.dataTransfer.files[0];
      if (file) {
        console.log("File path:", file.path); //DELETE
        // You can now use the file path as needed
        // this.handleFilePath(file.path);
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
        this.$emit("job-started", true);
        
        // Process the file content as needed
        this.$emit("report-uploaded", this.file.path);
        
        setTimeout(() => {
        this.$emit("job-completed", {
          outdir: this.jobDetailsSample.outdir,
          jobid: this.jobDetailsSample.jobid,
          isSample: true,
        });
        this.triggerSnackbar("success");
      }, 2000); // FIXME: add await, wait for file to be processed, if file isnt right format, trigger error snackbar
      } catch (error) {
        console.error("Error processing file:", error);
        this.$emit("error");
      }
    },

    startJob() {
      this.$emit("job-started", false); // Emit job-started event to parent
      // Simulate job process
      this.runBackend();
    },
    async runBackend() {
      const params = [
        "classify",
        this.jobDetails.q1,
        this.jobDetails.q2,
        this.jobDetails.database,
        this.jobDetails.outdir,
        this.jobDetails.jobid,
      ];
      if (this.jobDetails.maxram) {
        params.push("--max-ram", this.jobDetails.maxram);
      }

      try {
        // Run backend metabuli classify
        window.electron.runBackend(params);

        // Handle backend SUCCESS
        window.electron.onBackendOutput((output) => {
          console.log("Backend Output:", output); //DEBUG

          this.status = "COMPLETE"; //FIXME: remove if unneeded

          // Process the backend output
          this.$emit("job-completed", {
            outdir: this.jobDetails.outdir,
            jobid: this.jobDetails.jobid,
            isSample: false,
          });
          this.triggerSnackbar("success");
        });

        // Handle backend ERROR
        window.electron.onBackendError((error) => {
          console.error("Backend Error:", error); // DEBUG

          // Handle the backend error
          this.$emit("job-aborted");
          this.triggerSnackbar("error");
        });

        // Handle backend CANCELLATION
        window.electron.onBackendCancelled((message) => {
          console.log("Backend cancelled:", message); // DEBUG

          // Handle cancellation
          this.$emit("job-aborted");
          this.triggerSnackbar("error");
          // this.triggerSnackbar('info', 'Process was cancelled.');
        });
      } catch (error) {
        console.log("Error running backend:", error.message); //DEBUG

        this.$emit("job-aborted");
        this.triggerSnackbar("error");
      }
    },

    loadSampleData() {
      this.$emit("job-started", true);

      setTimeout(() => {
        this.$emit("job-completed", {
          outdir: this.jobDetailsSample.outdir,
          jobid: this.jobDetailsSample.jobid,
          isSample: true,
        });
        this.triggerSnackbar("success");
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
            this.jobDetails[field] = filePaths[0];
          }
        } catch (error) {
          console.error("Error selecting file:", error);
        }
      } else {
        console.error("File dialog is not supported in the web environment.");
      }
    },
    triggerSnackbar(type) {
      // Change parameters to icon, message, color
      this.snackbar.show = false; // Reset snackbar to ensure reactivity
      if (type === "success") {
        this.snackbar.message = "Job complete. Check the results tab!";
        this.snackbar.color = "green";
        this.snackbar.icon = "success";
      } else if (type === "error") {
        this.snackbar.message =
          "An error occurred. Please check query and try again.";
        this.snackbar.color = "red";
        this.snackbar.icon = "warning";
      }
      this.snackbar.show = true;
    },
    // Function to track job status
    // FIXME: delete if unneeded
    async pollJobStatus(ticketid, interval = 500, timeout = 2000) {
      // Check job status every 0.5 seconds, timeout after 30 seconds
      const start = Date.now();
      while (Date.now() - start < timeout) {
        try {
          // const response = await axios.get(`/api/ticket/${ticketid}`); // Get job status
          if (status === "COMPLETE") {
            this.status = "COMPLETE";
            this.triggerSnackbar("success");
            this.$emit("job-completed", {
              outdir: this.jobDetails.outdir,
              jobid: this.jobDetails.jobid,
              isSample: false,
            });

            return true;
          }
        } catch (error) {
          console.error("Error polling job status:", error);
        }
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
      this.$emit("job-aborted");
      this.triggerSnackbar("error");
      throw new Error("Polling timed out");
    },
    toggleApiDialog() {
      this.apiDialog = !this.apiDialog;
    },
    closeApiDialog() {
      this.apiDialog = false;
    },
  },

  mounted() {
    //
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
  bottom: 10px;
  right: 10px;
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
</style>
