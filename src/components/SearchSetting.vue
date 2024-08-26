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
              <!-- Required Fields -->
              <v-form ref="jobForm" v-model="isJobFormValid">
                <v-card-title class="text-button font-weight-bold"
                  >Required Fields</v-card-title
                >
                <div class="w-66 search-required-fields">
                  <v-container>
                    <!-- End Type (single-end, paired-end, long-read) -->
                    <v-row>
                      <v-col cols="3">
                        <v-list-subheader>Mode</v-list-subheader>
                      </v-col>

                      <v-col>
                        <v-btn-toggle
                          v-model="endType"
                          :disabled="showAll"
                          variant="outlined"
                          color="primary"
                          divided
                          mandatory
                        >
                          <v-btn
                            value="single-end"
                            height="30"
                            class="rounded-s-lg rounded-e-0 text-caption"
                            >Single-end</v-btn
                          >
                          <v-btn
                            value="paired-end"
                            height="30"
                            class="rounded-e-0 rounded-s-0 text-caption"
                            >Paired-end</v-btn
                          >
                          <v-btn
                            value="long-read"
                            height="30"
                            class="rounded-e-lg rounded-s-0 text-caption"
                            >Long-end</v-btn
                          >
                        </v-btn-toggle>
                      </v-col>
                    </v-row>

                    <!-- Job ID -->
                    <v-row>
                      <v-col cols="3">
                        <v-list-subheader>Job ID</v-list-subheader>
                      </v-col>
                      <v-col>
                        <v-text-field
                          v-model="jobDetails.jobid"
                          :rules="[requiredRule]"
                          :hint="computedHint"
                          persistent-hint
                          variant="outlined"
                          density="compact"
                          color="primary"
                          rounded="lg"
                          class="mb-2 form-textfield"
                        ></v-text-field>
                      </v-col>
                    </v-row>

                    <!-- Select Files -->
                    <v-row>
                      <v-col cols="3">
                        <v-list-subheader class="pr-0"
                          >Select Files</v-list-subheader
                        >
                      </v-col>

                      <v-col cols="9" class="search-files">
                        <!-- Q1 File -->
                        <v-row>
                          <v-col cols="6">
                            <v-btn
                              @click="selectFile('q1', 'file')"
                              prepend-icon="$file"
                              density="comfortable"
                              size="default"
                              class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                              >Read 1 File</v-btn
                            >
                            <v-text-field
                              v-model="jobDetails.q1"
                              :rules="[requiredRule]"
                              style="display: none"
                            ></v-text-field>
                          </v-col>
                          <v-col cols="6" class="filename-col">
                            <v-chip
                              v-if="jobDetails.q1"
                              label
                              color="primary"
                              density="comfortable"
                              class="filename-chip"
                            >
                              <v-icon
                                icon="$delete"
                                @click="clearFile('q1')"
                                class="mr-1"
                              ></v-icon>
                              {{ this.extractFilename(jobDetails.q1) }}</v-chip
                            >
                          </v-col>
                        </v-row>

                        <!-- Q2 File -->
                        <v-row v-if="endType === 'paired-end'">
                          <v-col cols="6">
                            <v-btn
                              @click="selectFile('q2', 'file')"
                              prepend-icon="$file"
                              density="comfortable"
                              size="default"
                              class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                              >Read 2 File</v-btn
                            >
                            <v-text-field
                              v-model="jobDetails.q2"
                              :rules="[
                                endType === 'paired-end'
                                  ? requiredRule
                                  : () => true,
                              ]"
                              style="display: none"
                            ></v-text-field>
                          </v-col>

                          <v-col cols="6" class="filename-col">
                            <v-chip
                              v-if="jobDetails.q2"
                              label
                              color="primary"
                              density="comfortable"
                              class="filename-chip"
                            >
                              <v-icon
                                icon="$delete"
                                @click="clearFile('q2')"
                                class="mr-1"
                              ></v-icon>
                              {{ this.extractFilename(jobDetails.q2) }}</v-chip
                            >
                          </v-col>
                        </v-row>

                        <!-- Database Directory -->
                        <v-row>
                          <v-col cols="6">
                            <div class="d-flex align-center mb-0 gc-3">
                              <v-btn
                                @click="selectFile('database', 'directory')"
                                prepend-icon="$folder"
                                density="comfortable"
                                size="default"
                                class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                                >Database</v-btn
                              >
                              <v-text-field
                                v-model="jobDetails.database"
                                :rules="[requiredRule]"
                                style="display: none"
                              ></v-text-field>
                            </div>

                            <!-- Database Download Links Table -->
                            <div v-if="false">
                              <v-menu
                                v-model="menu"
                                :close-on-content-click="false"
                                offset-y
                              >
                                <template v-slot:activator="{ props }">
                                  <v-btn
                                    variant="text"
                                    density="compact"
                                    color="primary"
                                    class="text-caption font-weight-medium mt-0 py-1 pl-0 d-flex align-start"
                                    v-bind="props"
                                  >
                                    <div class="d-flex align-center gc-1">
                                      <v-icon
                                        icon="$helpCircleOutline"
                                      ></v-icon>
                                      Database Download Links
                                    </div>
                                  </v-btn>
                                </template>

                                <v-card rounded="lg">
                                  <v-card-text>
                                    <v-data-table
                                      :headers="databaseDownloadHeaders"
                                      :items="databaseDownloadItems"
                                      hide-default-footer
                                    >
                                      <template v-slot:[`item.name`]="{ item }">
                                        <a
                                          :href="item.link"
                                          target="_blank"
                                          class="font-weight-medium text-decoration-none"
                                          >{{ item.name }}</a
                                        >
                                      </template>
                                    </v-data-table>

                                    <!-- Download Tip -->
                                    <v-divider class="my-4"></v-divider>
                                    <p>
                                      For faster downloads, consider using
                                      <code class="font-weight-medium"
                                        >aria2c</code
                                      >.
                                      <a
                                        href="https://aria2.github.io/"
                                        target="_blank"
                                        class="text-caption text-decoration-none"
                                        >Learn more</a
                                      >
                                    </p>
                                  </v-card-text>
                                </v-card>
                              </v-menu>
                            </div>
                          </v-col>

                          <v-col cols="6" class="filename-col">
                            <v-chip
                              v-if="jobDetails.database"
                              label
                              color="primary"
                              density="comfortable"
                              class="filename-chip"
                            >
                              <v-icon
                                icon="$delete"
                                @click="clearFile('database')"
                                class="mr-1"
                              ></v-icon>
                              {{
                                this.extractFilename(jobDetails.database)
                              }}</v-chip
                            >
                          </v-col>
                        </v-row>

                        <!-- Output Directory -->
                        <v-row>
                          <v-col cols="6">
                            <v-btn
                              @click="selectFile('outdir', 'directory')"
                              prepend-icon="$folder"
                              density="comfortable"
                              size="default"
                              class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                              >Output Directory</v-btn
                            >
                            <v-text-field
                              v-model="jobDetails.outdir"
                              :rules="[requiredRule]"
                              style="display: none"
                            ></v-text-field>
                          </v-col>

                          <v-col cols="6" class="filename-col">
                            <v-chip
                              v-if="jobDetails.outdir"
                              label
                              color="primary"
                              density="comfortable"
                              class="filename-chip"
                            >
                              <v-icon
                                icon="$delete"
                                @click="clearFile('outdir')"
                                class="mr-1"
                              ></v-icon>
                              {{
                                this.extractFilename(jobDetails.outdir)
                              }}</v-chip
                            >
                          </v-col>
                        </v-row>
                      </v-col>
                    </v-row>

                    <!-- --max-ram -->
                    <v-row class="mt-2">
                      <v-col cols="3">
                        <v-list-subheader>Max RAM</v-list-subheader>
                      </v-col>
                      <v-col>
                        <v-text-field
                          v-model="jobDetails.maxram"
                          :rules="[
                            ...getValidationRules('--max-ram'),
                            requiredRule,
                          ]"
                          variant="outlined"
                          density="compact"
                          color="primary"
                          rounded="lg"
                          suffix="GiB"
                          class="form-textfield"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-container>
                </div>

                <!-- ADVANCED SETTINGS -->
                <v-divider class="my-2"></v-divider>
                <v-card-actions>
                  <v-btn
                    text="Advanced Settings"
                    :append-icon="
                      expandAdvancedSettings ? '$collapse' : '$expand'
                    "
                    @click="expandAdvancedSettings = !expandAdvancedSettings"
                    class="font-weight-bold"
                  ></v-btn>
                </v-card-actions>

                <!-- EXPANDABLE PANEL -->
                <v-expand-transition>
                  <div v-if="expandAdvancedSettings" class="search-advanced-settings w-66 pt-0 pb-2">
                    <v-container fluid>
                      <v-row
                        v-for="(setting, key) in advancedSettings"
                        :key="key"
                      >
                        <v-col cols="4" class="search-advanced-settings-title">
                          <v-list-subheader class="pr-0">
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

                        <v-col>
                          <v-text-field
                            variant="outlined"
                            rounded="lg"
                            density="compact"
                            color="primary"
                            :placeholder="setting.extra?.file ? 'Select Directory' : none"
                            v-model="setting.value"
                            :prepend-icon="getAppendInnerIcon(setting)"
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
                <v-sheet class="d-flex align-center my-2">
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
                    color="blue-accent-4"
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
import { trimAndStoreJobsHistory } from "@/plugins/storageUtils.js";

export default {
  name: "SearchSetting",
  data: () => ({
    // Properties for Search Settings Tab Panel
    tab: "runSearch",
    items: [
      { title: "New Search", value: "runSearch" },
      { title: "Upload Report", value: "uploadReport" },
    ], // FIXME: rename to tabItems
    menu: false,
    // Properties for Run New Search tab
    isJobFormValid: false,
    jobDetails: {
      // Store job details including file paths
      q1: "",
      q2: "",
      database: "",
      outdir: "",
      jobid: "",
      maxram: "",
    },
    advancedSettings: {
      // maxRam: {
      //   title: "Max RAM",
      //   description: "The maximum RAM usage. (128 GiB by default)",
      //   parameter: "--max-ram",
      //   value: 128,
      //   type: "INTEGER",
      //   extra: {
      //     suffix: "GiB",
      //   },
      // },
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
          appendIcon: "folder",
          file: true,
        },
      },
      // reducedAA: {
      //   title: "Reduced AA",
      //   description:
      //     "0. Use 20 alphabets or 1. Use 15 alphabets to encode amino acids. Give the same value used for DB creation.",
      //   parameter: "--reduced-aa", // FIXME: 엥 왜 안돼
      //   value: "",
      //   type: "INTEGER",
      // },
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
      // Input is required
      "--max-ram": (value) => {
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
    endType: "single-end", // FIXME: move this to jobDetails
    expandAdvancedSettings: false,

    // Database Download Table
    databaseDownloadHeaders: [
      { title: "Name", value: "name" },
      { title: "Uploaded", value: "uploaded" },
      { title: "Size", value: "size" },
    ],
    databaseDownloadItems: [
      {
        name: "gtdb.tar.gz",
        uploaded: "Mon, 01 Apr 2024 03:37:39 GMT", // Use a date format that suits your needs
        size: "68.8 GB", // Size can be in different formats (MB, GB, etc.)
        link: "https://metabuli.steineggerlab.workers.dev/gtdb.tar.gz",
      },
      {
        name: "refseq_prokaryote_virus.tar.gz",
        uploaded: "Mon, 01 Apr 2024 09:32:29 GMT",
        size: "88.7 GB",
        link: "https://metabuli.steineggerlab.workers.dev/refseq_prokaryote_virus.tar.gz",
      },
      {
        name: "refseq_release217+human.tar.gz",
        uploaded: "Tue, 04 Jul 2023 13:48:16 GMT",
        size: "306.4 GB",
        link: "https://metabuli.steineggerlab.workers.dev/refseq_release217+human.tar.gz",
      },
      {
        name: "refseq_virus.tar.gz",
        uploaded: "Mon, 01 Apr 2024 02:42:58 GMT",
        size: "4.0 GB",
        link: "https://metabuli.steineggerlab.workers.dev/refseq_virus.tar.gz",
      },
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
    errorHandled: false,
  }),

  computed: {
    computedHint() {
      return `${this.jobDetails.jobid}_report.tsv`;
    },
  },

  watch: {
    advancedSettings: {
      handler(newVal) {
        console.log(newVal); // DEBUG
      },
      deep: true,
    },
  },

  methods: {
    // Run Search
    extractFilename(path) {
      return path.split("/").pop();
    },
    clearFile(field) {
      this.jobDetails[field] = null;
      this.$refs.jobForm.validate();
    },
    requiredRule(value) {
      if (value === "" || value === null || value === undefined) {
        return "Required field *";
      }
      return true;
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
          this.storeResults(completedJob);

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
        this.storeResults(failedJob);

        // Trigger snackbar
        this.triggerSnackbar(
          "Error processing file. Please check file and try again.",
          "error",
          "warning",
          "Dismiss"
        );
      }
    },

    // RUN SEARCH TAB
    // Function for loading sample data report file
    async loadSampleData() {
      // Start loading dialog
      this.$emit("job-started", true);

      // Process report file
      await this.processResults("runSearch", true);

      // Set log message
      this.backendOutput = "Sample data was loaded successfully.";

      setTimeout(() => {
        // Object storing info about completedJob
        const completedJob = {
          outdir: this.jobDetailsSample.outdir,
          jobid: this.jobDetailsSample.jobid,
          isSample: true,
          jobStatus: "Completed",
          jobType: "runSearch",
          backendOutput: this.backendOutput,
          resultsJSON: this.processedResults.jsonData.results,
          kronaContent: this.processedResults.kronaContent,
        };

        // Store latest job in local storage for results rendering
        localStorage.setItem("processedResults", JSON.stringify(completedJob));

        // Store completed job in local storage
        console.log("sample completedjob", completedJob); // DEBUG
        this.storeResults(completedJob);

        // Emit job-completed event: close loading dialog and expose results tab in navigation drawer
        this.$emit("job-completed", completedJob);

        // Trigger snackbar
        this.triggerSnackbar(
          "Sample data successfully loaded.",
          "success",
          "success",
          "View",
          () => {
            this.$router.push({ name: "ResultsPage" });
          }
        );
      }, 2000); // Simulate a job taking 2 seconds
    },
    // File picker select function for new run search
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
          await this.processResults("runSearch", false); // Make sure this is called after backend completion
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
      }
    },

    async runBackend() {
      let params = ["classify"];

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

      // Add max-ram
      if (this.jobDetails.maxram !== "") {
        params.push("--max-ram", parseInt(this.jobDetails.maxram));
      }

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
      console.log("params:", params); // DEBUG

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

      // Return a promise that resolves or rejects based on backend success or failure
      return new Promise((resolve, reject) => {
        window.electron.runBackend(params);

        // Real-time output
        window.electron.onBackendRealtimeOutput((output) => {
          console.log("Backend Real-time Output:", output); // DEBUG

          this.backendOutput += output; // Append output in real-time
          this.$emit("backend-realtime-output", this.backendOutput); // Emit the final output to the parent
          this.status = "RUNNING"; // Keep the status as RUNNING
        });

        window.electron.onBackendComplete((message) => {
          if (this.status !== "RUNNING") return; // Prevent processing if not in RUNNING state

          console.log("Backend Complete:", message); // DEBUG
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
      console.log("Running poll"); // DEBUG
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

    // Function for processing results (shared for both tabs)
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
    handleJobSuccess() {
      console.log("Job polling completed successfully."); // DEBUG

      // Object storing info about completedJob
      const completedJob = {
        outdir: this.jobDetails.outdir,
        jobid: this.jobDetails.jobid,
        isSample: false,
        jobStatus: "Completed",
        jobType: "runSearch",
        backendOutput: this.backendOutput,
        resultsJSON: this.processedResults.jsonData.results,
        kronaContent: this.processedResults.kronaContent,
      };
      this.storeResults(completedJob);

      // Store latest job in local storage for results rendering
      localStorage.setItem("processedResults", JSON.stringify(completedJob));

      // Store completed job in local storage
      console.log("newrun completedJob:", completedJob); // DEBUG

      // Trigger snackbar
      this.triggerSnackbar(
        "Job successfully completed. Check the results tab.",
        "success",
        "success",
        "View",
        () => {
          this.$router.push({ name: "ResultsPage" });
        }
      );

      // Emit job-completed event: close loading dialog and expose results tab in navigation drawer
      this.$emit("job-completed", completedJob);
    },
    storeResults(job) {
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

    handleJobError() {
      this.errorHandled = true; // Ensure flag is set to prevent further handling

      // Additional error handling logic (save failed job to local storage, trigger snackbar)

      // Create failed job object to store in local storage
      const failedJob = {
        outdir: this.jobDetails.outdir,
        jobid: this.jobDetails.jobid,
        isSample: false,
        jobStatus: this.status,
        jobType: "runSearch",
        backendOutput: this.backendOutput,
        resultsJSON: null,
        kronaContent: null,
      };

      // Store completed job in local storage
      this.storeResults(failedJob);

      // Trigger snackbar corresponding to case
      if (this.status === "TIMEOUT") {
        this.$emit("job-timed-out");
        this.triggerSnackbar(
          "Job execution timed out.",
          "warning",
          "timer",
          "Retry",
          this.startJob
        );
      } else if (this.status === "CANCELLED") {
        this.triggerSnackbar("Job was cancelled.", "info", "cancel", "Dismiss");
      } else if (this.status === "ERROR") {
        this.$emit("job-aborted");
        this.triggerSnackbar(
          "Invalid request. Check your query and try again.",
          "error",
          "warning",
          "Dismiss"
        );
      } else {
        this.$emit("job-aborted");
        this.triggerSnackbar(
          "An unexpected error occurred. Please try again.",
          "error",
          "warning",
          "Dismiss"
        );
      }

      this.status = "ERROR"; // FIXME: do i need this; Set status to ERROR
    },

    handleTimeout() {
      window.electron.cancelBackend();
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

  mounted() {
    this.errorHandled = false; // Flag to ensure errors are handled only once
  },
};
</script>

<style scoped>
.status-container {
  display: flex;
  align-items: center;
}

.search-setting-title {
  font-family: Roboto;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

/* SEARCH SETTINGS TAB */
.search-settings-panel {
  position: relative;
}
.search-settings-panel .search-required-fields .v-col {
  padding-top: 0px;
}
.search-settings-panel .search-required-fields .v-list-subheader {
  min-height: 30px;
}
.search-settings-panel .search-required-fields .search-files .v-row {
  margin-bottom: 12px;
}
.search-settings-panel .search-required-fields .search-files .filename-col {
  padding-left: 0px;
}
:deep(.search-settings-panel .v-field__input),
:deep(.search-settings-panel .v-text-field__suffix) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  min-height: 30px;
  font-size: 12px;
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
.filename-chip {
  padding-left: 8px;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
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

.v-col {
  padding-bottom: 0px;
}
.v-row {
  margin-top: 0px;
  margin-bottom: 0px;
}
</style>
