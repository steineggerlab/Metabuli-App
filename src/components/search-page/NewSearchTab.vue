<template>
  <v-container>
    <!-- Loading Dialog -->
    <v-dialog v-model="loadingDialog" persistent>
      <v-card class="mx-auto" width="700">
        <v-list>
          <!-- Title -->
          <v-list-item class="font-weight-bold text-h6 py-0 pl-8 text-button">
            <span>Processing Job...</span>
            <template v-slot:append>
              <v-img src="assets/marv_metabuli_animated.gif" width="60"></v-img>
            </template>
          </v-list-item>

          <!-- Hide Progress Bar + Log Output + Cancel Button on Load Sample -->
          <div v-if="!isSampleJob">
            <v-list-item>
              <v-progress-linear
                v-model="currentBatchIdx"
                :max="jobDetails.entries.length"
                color="blue-grey"
                height="20"
                :striped="status !== 'COMPLETE'"
              >
                <template v-slot:default="{}">
                  <strong
                    >{{ currentBatchIdx }}/{{
                      jobDetails.entries.length
                    }}</strong
                  >
                </template>
              </v-progress-linear>
            </v-list-item>

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
              <v-btn variant="plain" color="primary" @click="cancelBackend"
                >Cancel</v-btn
              >
            </v-card-actions>
          </div>
        </v-list>
      </v-card>
    </v-dialog>

    <!-- Required Fields -->
    <v-form ref="jobForm" v-model="isJobFormValid">
      <v-card-title class="text-button font-weight-bold"
        >Required Fields</v-card-title
      >
      <div class="d-flex">
        <div class="w-66 search-required-fields">
          <v-container>
            <!-- End Type (single-end, paired-end, long-read) -->
            <v-row align="center">
              <v-col cols="3">
                <v-list-subheader class="pr-0">
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }">
                      <v-icon
                        v-bind="props"
                        icon="$helpCircle"
                        size="16"
                        color="grey lighten-2"
                      >
                      </v-icon>
                    </template>
                    Sequencing type of your samples.
                  </v-tooltip>
                  <span class="font-weight-bold"> Mode</span>
                </v-list-subheader>
              </v-col>

              <v-col>
                <v-btn-toggle
                  v-model="jobDetails.mode"
                  variant="outlined"
                  color="primary"
                  density="compact"
                  divided
                  mandatory
                >
                  <v-btn
                    value="paired-end"
                    class="rounded-s-lg rounded-e-0 text-caption"
                    >Paired-end</v-btn
                  >
                  <v-btn
                    value="single-end"
                    class="rounded-e-0 rounded-s-0 text-caption"
                    >Single-end</v-btn
                  >
                  <v-btn
                    value="long-read"
                    class="rounded-e-lg rounded-s-0 text-caption"
                    >Long-read</v-btn
                  >
                </v-btn-toggle>
              </v-col>
            </v-row>

            <!-- Fastp Toggle Switch -->
            <v-row align="center">
              <v-col cols="3">
                <v-list-subheader>
                  <div class="d-flex gc-1">
                    <v-tooltip location="top">
                      <template v-slot:activator="{ props }">
                        <v-icon
                          v-bind="props"
                          icon="$helpCircle"
                          size="16"
                          color="grey lighten-2"
                          class="mt-1"
                        >
                        </v-icon>
                      </template>
                      Enable it to preprocess raw reads before classification.
                    </v-tooltip>
                    <div class="d-flex flex-column">
                      <span class="font-weight-bold"> Quality Control</span>
                      <small class="text-caption grey--text">
                        ({{
                          jobDetails.mode === "long-read"
                            ? "fastplong"
                            : "fastp"
                        }})
                      </small>
                    </div>
                  </div>
                </v-list-subheader>
              </v-col>

              <v-col cols="1">
                <v-switch
                  v-model="jobDetails.enableQC"
                  color="primary"
                  hide-details="true"
                ></v-switch>
              </v-col>

              <v-col>
                <QCSettingsDialog
                  :mode="jobDetails.mode"
                  :initialParams="jobDetails.fastpParams"
                  @update-fastp-params="jobDetails.fastpParams = $event"
                >
                  <template v-slot:activator="{ props }">
                    <v-btn
                      v-bind="props"
                      :disabled="!jobDetails.enableQC"
                      variant="text"
                      size="small"
                      prepend-icon="$tune"
                      color="primary"
                      >Settings</v-btn
                    >
                  </template>
                </QCSettingsDialog>
              </v-col>
            </v-row>

            <!-- Job ID -->
            <v-row>
              <v-col cols="3">
                <v-list-subheader>
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }">
                      <v-icon
                        v-bind="props"
                        icon="$helpCircle"
                        size="16"
                        color="grey lighten-2"
                      >
                      </v-icon>
                    </template>
                    Result files are saved in a folder named Job ID under the
                    Output Directory selected below.
                  </v-tooltip>
                  <span class="font-weight-bold"> Job ID</span>
                </v-list-subheader>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="jobDetails.jobid"
                  :rules="[requiredRule]"
                  :hint="computedHint"
                  persistent-hint
                  variant="outlined"
                  density="compact"
                  color="primary"
                  rounded="lg"
                  class="mb-2"
                ></v-text-field>
              </v-col>
            </v-row>

            <!-- Query Files -->
            <v-row>
              <v-col cols="3">
                <v-list-subheader class="pr-0">
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }">
                      <v-icon
                        v-bind="props"
                        icon="$helpCircle"
                        size="16"
                        color="grey lighten-2"
                      >
                      </v-icon>
                    </template>
                    (gzipped) FASTA/Q query read files.
                  </v-tooltip>
                  <span class="font-weight-bold"> Query Files</span>
                </v-list-subheader>
              </v-col>

              <v-col cols="9" class="search-files">
                <v-row
                  v-for="(entry, index) in jobDetails.entries"
                  :key="index"
                >
                  <!-- Read 1 -->
                  <v-col cols="5">
                    <div v-if="!entry.q1">
                      <v-btn
                        @click="pickFile('file', 'q1', index)"
                        prepend-icon="$file"
                        density="comfortable"
                        size="default"
                        class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                      >
                        Read 1 File
                      </v-btn>
                    </div>
                    <v-chip
                      v-else
                      label
                      color="primary"
                      density="comfortable"
                      class="filename-chip"
                    >
                      <v-icon
                        icon="$delete"
                        @click="clearFile('q1', index)"
                        class="mr-1"
                      ></v-icon>
                      {{ extractFilename(entry.q1) }}
                    </v-chip>
                    <v-text-field
                      v-model="entry.q1"
                      :rules="[requiredRule]"
                      style="display: none"
                    ></v-text-field>
                  </v-col>

                  <!-- Read 2 -->
                  <v-col cols="5" v-if="jobDetails.mode === 'paired-end'">
                    <div v-if="!entry.q2">
                      <v-btn
                        @click="pickFile('file', 'q2', index)"
                        prepend-icon="$file"
                        density="comfortable"
                        size="default"
                        class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                      >
                        Read 2 File
                      </v-btn>
                    </div>
                    <v-chip
                      v-else
                      label
                      color="primary"
                      density="comfortable"
                      class="filename-chip"
                    >
                      <v-icon
                        icon="$delete"
                        @click="clearFile('q2', index)"
                        class="mr-1"
                      ></v-icon>
                      {{ extractFilename(entry.q2) }}
                    </v-chip>
                    <v-text-field
                      v-model="entry.q2"
                      :rules="[
                        jobDetails.mode === 'paired-end'
                          ? requiredRule
                          : () => true,
                      ]"
                      style="display: none"
                    ></v-text-field>
                  </v-col>

                  <!-- Remove Row Button -->
                  <v-col cols="1" v-if="jobDetails.entries.length > 1">
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
                  <v-col cols="4">
                    <v-btn
                      variant="text"
                      prepend-icon="$plusBox"
                      @click="addEntry"
                      >Add Entry</v-btn
                    >
                  </v-col>
                </v-row>

                <!-- Database Directory -->
                <v-row>
                  <v-col cols="6">
                    <div class="d-flex flex-column align-start mb-0 gc-3">
                      <v-btn
                        @click="pickFile('directory', 'database')"
                        prepend-icon="$folder"
                        density="comfortable"
                        size="default"
                        class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                        >Select Database</v-btn
                      >
                      <v-text-field
                        v-model="jobDetails.database"
                        :rules="[requiredRule]"
                        style="display: none"
                      ></v-text-field>

                      <div class="mt-2">
                        <!-- Database Download Button -->
                        <v-btn
                          color="primary"
                          prepend-icon="$download"
                          variant="text"
                          class="text-caption font-weight-medium ml-2"
                          size="small"
                          rounded="xl"
                          href="https://metabuli.steineggerlab.workers.dev/"
                          target="_blank"
                        >
                          Download Database
                        </v-btn>

                        <!-- Go to Custom Database page -->
                        <v-btn
                          color="secondary"
                          prepend-icon="$databasePlus"
                          variant="text"
                          class="text-caption font-weight-medium ml-2"
                          size="small"
                          rounded="xl"
                          @click="$router.push({ name: 'CustomDatabasePage' })"
                        >
                          Create New Database
                        </v-btn>

                        <!-- Go directly to the “Update” tab of Custom Database page -->
                        <v-btn
                          color="secondary"
                          prepend-icon="$databaseImport"
                          variant="text"
                          class="text-caption font-weight-medium ml-2"
                          size="small"
                          rounded="xl"
                          @click="
                            $router.push({
                              name: 'CustomDatabasePage',
                              query: { tab: 'updateDatabase' },
                            })
                          "
                        >
                          Update Existing Database
                        </v-btn>
                      </div>
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
                      {{ extractFilename(jobDetails.database) }}</v-chip
                    >
                  </v-col>
                </v-row>

                <!-- Output Directory -->
                <v-row>
                  <v-col cols="6">
                    <v-btn
                      @click="pickFile('directory', 'outdir')"
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
                      {{ extractFilename(jobDetails.outdir) }}</v-chip
                    >
                  </v-col>
                </v-row>
              </v-col>
            </v-row>

            <!-- --max-ram -->
            <v-row class="mt-3">
              <v-col cols="3">
                <v-list-subheader>
                  <v-tooltip location="top">
                    <template v-slot:activator="{ props }">
                      <v-icon
                        v-bind="props"
                        icon="$helpCircle"
                        size="16"
                        color="grey lighten-2"
                      >
                      </v-icon>
                    </template>
                    Maximum RAM to be used for the job.
                  </v-tooltip>
                  <span class="font-weight-bold"> Max RAM</span>
                </v-list-subheader>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model="jobDetails.maxram"
                  :rules="[...getValidationRules('--max-ram'), requiredRule]"
                  variant="outlined"
                  density="compact"
                  color="primary"
                  rounded="lg"
                  suffix="GiB"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </div>

        <!-- <v-divider vertical></v-divider> -->

        <!-- Output Format -->
        <!-- <v-card class="w-33" variant="text" >
					<v-card-title class="text-button font-weight-bold">Output Format</v-card-title>
					<v-card-subtitle>Lorem ipsum</v-card-subtitle>
				</v-card> -->

        <v-img
          class="w-33 marv-metabuli-opaque"
          :width="200"
          aspect-ratio="1/1"
          src="assets/marv_metabuli_small.png"
        >
        </v-img>
      </div>

      <!-- ADVANCED SETTINGS -->
      <v-divider class="my-2"></v-divider>
      <v-card-actions>
        <v-btn
          text="Advanced Settings"
          :append-icon="expandAdvancedSettings ? '$collapse' : '$expand'"
          @click="expandAdvancedSettings = !expandAdvancedSettings"
          class="font-weight-bold"
        ></v-btn>
      </v-card-actions>

      <!-- EXPANDABLE PANEL -->
      <v-expand-transition>
        <div
          v-if="expandAdvancedSettings"
          class="search-advanced-settings w-66 pt-0 pb-2"
        >
          <!-- Parameters for precision mode -->
          <v-container class="py-0">
            <v-card variant="outlined" color="primary">
              <v-card-title
                class="text-subtitle-2 pb-0"
                style="white-space: normal; word-break: break-word"
              >
                Parameters for Precision Mode (Metabuli-P) <br />
                <span class="font-weight-regular" style="font-style: normal">
                  Recommended values below increase precision maintaing the F1
                  score. <br />
                  These values are determined from score distributions of false
                  and true positives in synthetic benchmarks.
                  <br />
                  (Details in Supp. Fig. 4-7 in the
                  <a
                    href="https://www.nature.com/articles/s41592-024-02273-y.epdf?sharing_token=je_2D5Su0-xVOSjuKSAXF9RgN0jAjWel9jnR3ZoTv0M7gE7NDF_xi_3sW8QdRiwfSJNwqaXItSoeCvr7cvcoQxKLt0oROgWc6urmki9tP80cXEuHPN0D7b4y9y3i8Yv7sZw8MxxhAj7W6p9eZE2zaK3eozdOkXvwADVfso9cXIM%3D"
                    target="_blank"
                    rel="noopener"
                    class="text--primary"
                  >
                    Metabuli paper </a
                  >)
                </span>
              </v-card-title>
              <v-card-title class="text-caption">
                <span v-if="jobDetails.mode === 'long-read'">
                  <strong>PacBio HiFi reads:</strong> --min-score 0.07
                  --min-sp-score 0.3<br />
                  <strong>PacBio Sequel II reads:</strong> --min-score 0.005<br />
                  <strong>ONT reads:</strong> --min-score 0.008
                </span>
                <span v-else>
                  <strong>Illumina short reads:</strong>
                  <code> --min-score 0.15 --min-sp-score 0.5 </code>
                </span>
              </v-card-title>
            </v-card>
          </v-container>

          <!-- Input fields -->
          <v-container fluid>
            <v-row v-for="(setting, key) in advancedSettings" :key="key">
              <v-col cols="8">
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
                <!-- Toggle switch for boolean settings -->
                <v-switch
                  v-if="setting.type === 'BOOLEAN'"
                  v-model="setting.value"
                  color="primary"
                  density="compact"
                  :true-value="1"
                  :false-value="0"
                  hide-details
                ></v-switch>

                <!-- Text field for other settings -->
                <v-text-field
                  v-else
                  variant="outlined"
                  rounded="lg"
                  density="compact"
                  color="primary"
                  :placeholder="setting.extra?.file ? 'Select Folder' : none"
                  v-model="setting.value"
                  :prepend-icon="getAppendInnerIcon(setting)"
                  :rules="getValidationRules(setting.parameter)"
                  :suffix="setting.extra?.suffix || ''"
                  v-on:click="handleAdvancedSettingsTextFieldClick(setting)"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
        </div>
      </v-expand-transition>

      <!-- BUTTONS -->
      <v-sheet class="d-flex align-center my-2">
        <v-btn :disabled="!isJobFormValid" @click="startJob" color="primary">
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
        <v-spacer />
        <v-btn
          text="Output Format"
          variant="plain"
          color="primary"
          :prepend-icon="showOutputFormat ? '$collapse' : '$expand'"
          @click="showOutputFormat = !showOutputFormat"
          class="font-weight-bold"
        ></v-btn>
      </v-sheet>
    </v-form>

    <!-- OUTPUT FORMAT -->
    <v-expand-transition>
      <div v-if="showOutputFormat">
        <!-- Input fields -->
        <v-card variant="flat" theme="light" class="force-light">
          <v-card-text style="overflow-y: auto">
            <div v-html="readmeHtml" class="markdown-body"></div>
          </v-card-text>
        </v-card>
        <!-- <v-container fluid>
          </v-container> -->
      </div>
    </v-expand-transition>
  </v-container>
</template>

<script>
import TSVParser from "@/plugins/tsvParser";
import QCSettingsDialog from "@/components/quality-control-page/QCSettingsDialog.vue";
import { makeCompletedJob, makeFailedJob } from "@/plugins/jobHistoryStruct.js";
import { CITATIONS, formatCitations } from "@/citations.js";
import { marked } from "marked";

const isDev = process.env.NODE_ENV !== "production";

export default {
  name: "NewSearchTab",
  components: {
    QCSettingsDialog,
  },
  data() {
    return {
      // Properties for Run New Search tab
      isJobFormValid: false,
      jobDetails: isDev
        ? {
            // Store job details including file paths
            mode: "paired-end", // "paired-end" | "single-end" | "long-read"
            enableQC: true,
            entries: [
              {
                q1: "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-revision/SRR14484345_10000_1.fq",
                q2: "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-revision/SRR14484345_10000_2.fq",
                batchName: "",
              },
              {
                q1: "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-revision/SRR14484345_10000_3.fq",
                q2: "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-revision/SRR14484345_10000_4.fq",
                batchName: "",
              },
              {
                q1: "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-revision/SRR24315757_1.fastq",
                q2: "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-revision/SRR24315757_2.fastq",
                batchName: "",
              },
            ],
            database:
              "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-revision/refseq_virus",
            outdir:
              "/Users/sunnylee/Documents/SteineggerLab/metabuli-app-revision/OUTDIR",
            jobid: "",
            maxram: "",
            fastpParams: {}, // Parameters for quality control (fastp/fastplong)
            forceError: 0,
          }
        : {
            // Store job details including file paths
            mode: "paired-end", // "paired-end" | "single-end" | "long-read"
            enableQC: true,
            entries: [{ q1: "", q2: "", batchName: "" }],
            database: "",
            outdir: "",
            jobid: "",
            maxram: "",
            fastpParams: {}, // Parameters for quality control (fastp/fastplong)
          },
      jobDetailsSample: {
        // Sample job details
        mode: "paired-end",
        enableQC: false,
        q1: "SRR14484345_1.fq",
        q2: "SRR14484345_2.fq",
        database: "refseq_virus",
        outdir: "/sample_data",
        jobid: "sample_data",
        maxram: 32,
      },
      expandAdvancedSettings: false,
      showOutputFormat: false,
      readmeHtml: "",

      advancedSettings: {
        minScore: {
          title: "--min-score",
          description:
            "Search results of scores lower than this are discarded to reduce false positives at the cost of sensitivity. ",
          parameter: "--min-score",
          value: "0",
          type: "FLOAT",
        },
        minSpScore: {
          title: "--min-sp-score",
          description:
            "Reads with scores below this threshold are assigned to genus‐ or higher‐rank to avoid overconfident calls.",
          parameter: "--min-sp-score",
          value: "0",
          type: "FLOAT",
        },
        taxonomyPath: {
          title: "--taxonomy-path",
          description:
            "Use it when your database lacks 'taxonomy' directory or 'taxonomyDB' file to provide tax dump files.",
          parameter: "--taxonomy-path",
          value: "",
          type: "STRING",
          extra: {
            appendIcon: "folder",
            file: true,
          },
        },
        accessionLevel: {
          title: "--accession-level",
          description:
            "Set 1 to use accession level classification. It is available when the DB is also built with accession level taxonomy.",
          parameter: "--accession-level",
          value: "0",
          type: "INTEGER",
        },
        thread: {
          title: "--threads",
          description: "The number of threads used (all by default)",
          parameter: "--threads",
          value: "",
          type: "INTEGER",
        },
        validateDb: {
          title: "--validate-db",
          description: "Validate DB files (activated by default)",
          parameter: "--validate-db",
          value: 0,
          type: "BOOLEAN",
        },
        validateInput: {
          title: "--validate-input",
          description: "Validate query file format (activated by default)",
          parameter: "--validate-input",
          value: 1,
          type: "BOOLEAN",
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

          return (
            isEmpty || validInputs.includes(value) || "Value must be 0 or 1"
          );
        },
        "--accession-level": (value) => {
          // Input can be empty, or either numerical 0 or 1
          const isEmpty = value === "" || value === null || value === undefined;
          const validInputs = ["0", "1"];

          return (
            isEmpty || validInputs.includes(value) || "Value must be 0 or 1"
          );
        },
      }, // FIXME: move requiredRule to here

      // Properties for job processing status, response, and results
      status: "INITIAL", // "INITIAL" | "RUNNING" | "COMPLETE" | "ERROR" | "CANCELLED"
      results: "",

      // Dialog
      isSampleJob: false,
      loadingDialog: false,
      currentBatchIdx: 0,
      backendOutput: "",

      processedResults: null,
      errorHandled: false,
    };
  },

  computed: {
    computedHint() {
      return `${this.jobDetails.jobid}_report.tsv`;
    },
    modeTag() {
      if (this.jobDetails.mode === "paired-end") {
        return "_PE";
      } else if (this.jobDetails.mode === "single-end") {
        return "_SE";
      } else {
        return "_LR";
      }
    },
  },

  watch: {
    // Watch both mode and entries array — update batch names when either changes
    "jobDetails.mode": "updateBatchNames",
    "jobDetails.entries": {
      handler: "updateBatchNames",
      deep: true,
      immediate: true,
    },
  },

  methods: {
    // Button actions for adding/removing entry rows
    addEntry() {
      this.jobDetails.entries.push({ q1: "", q2: "", batchName: "" });
    },
    removeEntry(index) {
      if (this.jobDetails.entries.length > 1) {
        this.jobDetails.entries.splice(index, 1);
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
        this.$refs.jobForm?.validate();
      }
    },
    clearFile(field, index = null) {
      if (index !== null) {
        // clear a row entry
        this.jobDetails.entries[index][field] = "";
      } else {
        // clear a top-level field
        this.jobDetails[field] = null;
      }
      // re-validate the form
      this.$refs.jobForm?.validate();
    },

    updateBatchNames() {
      this.jobDetails.entries.forEach((entry) => {
        if (entry.q1) {
          const { base } = window.electron.stripFileExtension(entry.q1);
          entry.batchName = base + this.modeTag;
        } else {
          entry.batchName = "";
        }
      });
    },

    // Functions for handling filenames
    extractFilename(path) {
      return window.electron.extractFilename(path);
    },
    joinPath(...segments) {
      return window.electron.joinPath(...segments);
    },

    // Functions handling validation rules
    requiredRule(value) {
      if (value === "" || value === null || value === undefined) {
        return "Required field *";
      }
      return true;
    },
    getValidationRules(parameter) {
      if (this.validationRules[parameter]) {
        return [this.validationRules[parameter]];
      }
      return [];
    },

    // Textfield functions for Advanced Settings (currently only applies to taxonomy path)
    getAppendInnerIcon(setting) {
      return setting.extra?.appendIcon ? `$${setting.extra.appendIcon}` : null;
    },
    async handleAdvancedSettingsTextFieldClick(setting) {
      if (setting.extra?.file) {
        const filePath = await this.pickFile("directory");
        setting.value = filePath;
      }
    },

    // Function for loading sample data report file
    async loadSampleData() {
      // Start loading dialog
      this.showDialog(true);

      // Process report file
      await this.processResults(true);

      // Set log message
      this.backendOutput = "Sample data was loaded successfully.";

      const sampleReportFilePath = await window.electron.resolveFilePath(
        this.joinPath(
          this.jobDetailsSample.outdir,
          this.jobDetailsSample.jobid + "_report.tsv",
        ),
        true,
      );
      setTimeout(() => {
        // Object storing info about completedJob
        const completedJob = makeCompletedJob({
          jobDetails: this.jobDetailsSample,
          q1: this.jobDetailsSample.q1,
          q2: this.jobDetailsSample.q2,
          database: this.jobDetailsSample.database,
          sampleFiles: ["SRR14484345_1.fastq", "SRR14484345_2.fastq"],
          batchFolder: this.jobDetailsSample.outdir,
          isSample: true,
          jobType: "runSearch",
          backendOutput: this.backendOutput,
          processedResults: this.processedResults,
          reportFilePath: sampleReportFilePath,
        });

        // Store latest job in local storage for results rendering
        localStorage.setItem("processedResults", JSON.stringify(completedJob));

        // Store completed job in local storage
        this.$emit("store-job", completedJob);

        // Emit job-completed event: close loading dialog and expose results tab in navigation drawer
        this.$emit("job-completed", completedJob);

        // Clear backendOutput
        this.backendOutput = "";
      }, 2000); // Simulate a job taking 2 seconds
    },

    // Main job processing function
    async startJob() {
      // Reset job state
      this.status = "INITIAL";
      this.errorHandled = false;
      this.backendOutput = "";

      // Loop over each entry and run the job for each
      for (let i = 0; i < this.jobDetails.entries.length; i++) {
        this.currentBatchIdx = i;
        const entry = this.jobDetails.entries[i];

        // Before each batch, reset status & backend‐output
        this.status = "RUNNING";
        this.errorHandled = false;
        this.backendOutput = "";
        this.showDialog(false);

        try {
          // 1) Run that one batch's backend process
          await this.runOneEntry(entry);

          // 2) Poll until it flips to COMPLETE/ERROR (or times out)
          await this.pollJobStatus();

          // 3) If it succeeded, handle results for that batch:
          if (this.status === "COMPLETE") {
            await this.processResults(false, entry); // you can pass an argument pointing at batch folder if needed
            this.handleBatchSuccess(entry);
          }
        } catch (error) {
          console.error(`Batch ${entry.batchName} failed:`, error.message);
          this.handleJobError(entry, error);
        } finally {
          // Save log file
          const logFilePath = this.joinPath(
            this.jobDetails.outdir,
            this.jobDetails.jobid,
            entry.batchName,
            `${this.jobDetails.jobid}_${entry.batchName}_log.txt`,
          );
          window.electron
            .writeFile(logFilePath, this.backendOutput)
            .catch(console.error);
        }

        /* Exit loop if one batch hits CANCEL/ERROR */
        if (this.status === "CANCELLED" || this.status === "ERROR") {
          break;
        }
      }
      this.currentBatchIdx += 1; // Increment one last time so that the progress bar fills

      // After batch iterations is complete
      if (this.status === "COMPLETE") {
        // Gather citations to export
        const citations = [
          CITATIONS.metabuli,
          ...(this.jobDetails.enableQC ? [CITATIONS.fastp] : []),
        ];

        // Write citations to file in job_id folder
        const jobIDPath = this.joinPath(
          this.jobDetails.outdir,
          this.jobDetails.jobid,
          "citations.txt",
        );
        const citationsContent = formatCitations(citations);
        await window.electron.writeFile(jobIDPath, citationsContent);
      }

      // Once all batches are done (or attempted), reset top‐level UI state
      this.status = "INITIAL";
      this.errorHandled = false;
    },

    async runOneEntry(entry) {
      // 1) Build the batch‐specific output folder: `${outdir}/${jobid}/${batchName}`
      const outdir = this.jobDetails.outdir;
      const jobid = this.jobDetails.jobid;
      const batchName = entry.batchName;
      const batchFolder = this.joinPath(outdir, jobid, batchName);
      // ensure that directory exists (recursively)
      await window.electron.mkdir(batchFolder); // returns a Promise if you exposed it; `await` in caller

      // Figure out file‐base names:
      const { base: base1, ext: ext1 } = window.electron.stripFileExtension(
        entry.q1,
      );
      let base2 = "",
        ext2 = "";
      if (this.jobDetails.mode === "paired-end" && entry.q2) {
        ({ base: base2, ext: ext2 } = window.electron.stripFileExtension(
          entry.q2,
        ));
      }

      // 2) If QC is enabled, run fastp first:
      let classifyRead1 = entry.q1;
      let classifyRead2 = entry.q2;

      if (this.jobDetails.enableQC) {
        const suffixQC = "_qc"; // you had this as const suffix = "_qc"

        const qcCmd =
          this.jobDetails.mode === "long-read" ? "fastplong" : "fastp";

        const qcParams = [
          qcCmd,
          "-h",
          this.joinPath(batchFolder, batchName + ".html"),
          "-j",
          this.joinPath(batchFolder, batchName + ".json"),
          "-i",
          entry.q1,
          "-o",
          this.joinPath(batchFolder, base1 + suffixQC + ext1),
        ];
        if (this.jobDetails.mode === "paired-end" && entry.q2) {
          qcParams.push(
            "-I",
            entry.q2,
            "-O",
            this.joinPath(batchFolder, base2 + suffixQC + ext2),
          );
        }

        // Append fastp params from dialog
        if (
          this.jobDetails.fastpParams &&
          this.jobDetails.fastpParams.length > 0
        ) {
          qcParams.push(...this.jobDetails.fastpParams);
        }

        console.log("🚀 fastp job requested:", qcParams);

        await new Promise((resolve, reject) => {
          const cleanupFastp = () => {
            window.electron.offFastpListeners();
          };

          // 2. Attach listeners
          window.electron.onFastpOutput((output) => {
            this.updateRealtimeOutput(output);
            this.status = "RUNNING"; // Keep the status as RUNNING
          });
          window.electron.onFastpError((err) => {
            if (!this.errorHandled) {
              this.errorHandled = true; // Prevent multiple error handling
              this.updateRealtimeOutput(`Error: ${err.toString()}\n`);
              this.status = "ERROR"; // Signal job polling to stop
              cleanupFastp();
              reject(new Error(err.toString()));
            }
          });
          window.electron.onFastpComplete((msg) => {
            if (this.status !== "RUNNING") return; // Prevent processing if not in RUNNING state
            this.updateRealtimeOutput(`${msg}\n`);
            this.status = "COMPLETE";
            cleanupFastp();
            resolve();
          });
          window.electron.onFastpCancelled((msg) => {
            if (!this.errorHandled) {
              this.errorHandled = true; // Prevent multiple error handling
              this.updateRealtimeOutput(`${msg}\n`);
              this.status = "CANCELLED";
              cleanupFastp();
              reject(new Error("QC process was cancelled"));
            }
          });

          // 3. Start backend process
          if (isDev && this.jobDetails.forceError) {
            console.warn("⚠️ Simulating fastp error for testing");
            window.electron.simulateFastpError();
          } else {
            window.electron.runFastp(qcParams, this.jobDetails.mode);
          }
        });

        // After fastp finishes, update classifyRead1/2 so that classify uses QC outputs:
        classifyRead1 = `${batchFolder}/${base1}_qc${ext1}`;
        if (this.jobDetails.mode === "paired-end" && entry.q2) {
          classifyRead2 = `${batchFolder}/${base2}_qc${ext2}`;
        } else {
          classifyRead2 = null;
        }
      } // end if enableQC

      // 3) Now run “classify” on classifyRead1 (and classifyRead2 if paired)
      const classifyParams = ["classify"];
      if (this.jobDetails.mode === "single-end") {
        classifyParams.push("--seq-mode", 1, classifyRead1);
      } else if (this.jobDetails.mode === "paired-end") {
        classifyParams.push(classifyRead1, classifyRead2);
      } else {
        classifyParams.push("--seq-mode", 3, classifyRead1);
      }

      // Add dbdir, outdir (this batchFolder), jobid
      classifyParams.push(this.jobDetails.database, batchFolder, jobid);

      // Add max-ram if set
      if (this.jobDetails.maxram) {
        classifyParams.push("--max-ram", parseInt(this.jobDetails.maxram));
      }

      // Add any advancedSettings
      Object.values(this.advancedSettings).forEach((setting) => {
        if (setting.value !== "" && setting.value !== undefined) {
          let val;
          if (setting.type === "INTEGER") val = parseInt(setting.value);
          else if (setting.type === "FLOAT") val = parseFloat(setting.value);
          else val = setting.value;
          classifyParams.push(setting.parameter, val);
        }
      });

      console.log("🚀 classify job requested:", classifyParams);

      // Return a promise that resolves when classify finishes (or rejects on error)
      return new Promise((resolve, reject) => {
        const cleanupClassify = () => {
          window.electron.offBackendRealtimeOutput();
          window.electron.offBackendComplete();
          window.electron.offBackendError();
          window.electron.offBackendCancelled();
        };

        window.electron.onBackendRealtimeOutput((output) => {
          this.updateRealtimeOutput(output);
          this.status = "RUNNING";
        });

        window.electron.onBackendComplete((msg) => {
          if (this.status !== "RUNNING") return;
          this.updateRealtimeOutput(msg);
          this.status = "COMPLETE";
          cleanupClassify();
          resolve();
        });

        window.electron.onBackendError((err) => {
          if (!this.errorHandled) {
            this.errorHandled = true;
            this.updateRealtimeOutput(`Error: ${err.toString()}\n`);
            this.status = "ERROR";
            cleanupClassify();
            reject(new Error(err.toString()));
          }
        });

        window.electron.onBackendCancelled((msg) => {
          if (!this.errorHandled) {
            this.errorHandled = true;
            this.updateRealtimeOutput(`${msg}\n`);
            this.status = "CANCELLED";
            cleanupClassify();
            reject(new Error("classify cancelled"));
          }
        });

        if (isDev && this.jobDetails.forceError) {
          console.warn("⚠️ Simulating classify error for testing");
          window.electron.simulateMetabuliError();
        } else {
          window.electron.runBackend(classifyParams);
        }
      });
    },

    // Poll for status flips to “COMPLETE” or “ERROR” (or TIMEOUT)
    async pollJobStatus(interval = 500, timeout = Infinity) {
      console.log("🚀 classify job running");
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (this.errorHandled || this.status === "COMPLETE") return true;
        if (this.status === "ERROR") throw new Error("Backend signaled ERROR");
        await new Promise((r) => setTimeout(r, interval));
      }
    },
    updateRealtimeOutput(output) {
      this.backendOutput += output; // Update real-time output
      this.$nextTick(() => {
        // Scroll to the bottom
        const textarea =
          this.$refs.outputTextarea.$el.querySelector("textarea");
        textarea.scrollTop = textarea.scrollHeight;
      });
    },
    cancelBackend() {
      this.hideDialog();
      window.electron.cancelBackend();
    },

    // Show/hide dialog
    showDialog(isSample) {
      this.loadingDialog = true;
      this.isSampleJob = isSample;
    },
    hideDialog() {
      this.loadingDialog = false;
    },

    // Function for processing results (shared for both tabs)
    async processResults(isSample, entry = null) {
      let reportFilePath;
      let kronaFilePath;

      // Resolve outdir path
      let resolvedOutdirPath;
      let jobId;

      let batchFolder = "";
      if (!isSample) {
        // Grab the last entry from jobDetails.entries
        // const lastEntry = this.jobDetails.entries[this.jobDetails.entries.length - 1];
        batchFolder = `${this.jobDetails.outdir}/${this.jobDetails.jobid}/${entry.batchName}`;
      }

      resolvedOutdirPath = isSample
        ? this.jobDetailsSample.outdir
        : batchFolder;
      jobId = isSample ? this.jobDetailsSample.jobid : this.jobDetails.jobid;

      // Set file paths for report and krona
      reportFilePath = await window.electron.resolveFilePath(
        this.joinPath(resolvedOutdirPath, jobId + "_report.tsv"),
        isSample,
      );
      kronaFilePath = await window.electron.resolveFilePath(
        this.joinPath(resolvedOutdirPath, jobId + "_krona.html"),
        isSample,
      );

      // Store report file path in session storage for later use (taxonomy verification)
      sessionStorage.setItem("reportFilePath", reportFilePath);

      // Read and process TSV and Krona HTML here
      const tsvData = await TSVParser.readTSVFile(reportFilePath);
      const jsonData = TSVParser.tsvToJSON(tsvData);
      const kronaContent = await this.readKronaHTML(kronaFilePath);

      // Store in component for emission
      this.processedResults = { jsonData, kronaContent };
    },
    async readKronaHTML(filePath) {
      if (!filePath) {
        // Results tab will hide krona tab for null
        return null;
      }

      try {
        const kronaHtml = await window.electron.readFile(filePath); //FIXME: too messy, edit readFile preload function
        return kronaHtml;
      } catch (error) {
        console.error("Error opening Krona viewer:", error);
      }
    },

    // Called once classify for one batch completes
    handleBatchSuccess(entry) {
      const jobid = this.jobDetails.jobid;
      const batchFolder = this.joinPath(
        this.jobDetails.outdir,
        jobid,
        entry.batchName,
      );

      // processResults(false) should look in batchFolder for jobid_report.tsv, etc.
      // this.processResults(false, entry).then(() => {
      const completedJob = makeCompletedJob({
        jobDetails: this.jobDetails,
        q1: entry.q1,
        q2: entry.q2,
        database: this.jobDetails.database,
        sampleFiles:
          this.jobDetails.mode === "paired-end"
            ? [this.extractFilename(entry.q1), this.extractFilename(entry.q2)]
            : [this.extractFilename(entry.q1)],
        batchFolder: batchFolder,
        isSample: false,
        jobType: "runSearch",
        backendOutput: this.backendOutput,
        processedResults: this.processedResults,
        reportFilePath: this.joinPath(batchFolder, `${jobid}_report.tsv`),
      });

      this.$emit("store-job", completedJob);
      localStorage.setItem(`processedResults`, JSON.stringify(completedJob));

      // Emit job-completed only if this is the last entry in the batch
      const isLastEntry =
        entry === this.jobDetails.entries[this.jobDetails.entries.length - 1];
      if (isLastEntry) {
        this.$emit("job-completed", completedJob);
      }
      // });
    },

    handleJobError(entry, error) {
      // Enters when "CANCELLED" || "ERROR"
      this.errorHandled = true; // Ensure flag is set to prevent further handling

      // Create failed job object to store in local storage
      const failedJob = makeFailedJob({
        jobDetails: this.jobDetails,
        q1: entry.q1,
        q2: entry.q2,
        database: this.jobDetails.database,
        sampleFiles:
          this.jobDetails.mode === "paired-end"
            ? [this.extractFilename(entry.q1), this.extractFilename(entry.q2)]
            : [this.extractFilename(entry.q1)],
        backendOutput: this.backendOutput,
        status: this.status,
        jobType: "runSearch",
        isSample: false,
      });
      // Store completed job in local storage
      this.$emit("store-job", failedJob);

      // Trigger snackbar corresponding to case
      if (this.status === "CANCELLED") {
        this.$emit(
          "trigger-snackbar",
          "Job was cancelled.",
          "info",
          "cancel",
          "Dismiss",
        );
      } else if (this.status === "ERROR") {
        this.$emit("trigger-snackbar", error, "error", "warning", "Dismiss");
      } else {
        this.updateRealtimeOutput(
          "\nError: An unexpected error occurred. Please try again.\n",
        );
        this.$emit(
          "trigger-snackbar",
          "An unexpected error occurred. Please try again.",
          "error",
          "warning",
          "Dismiss",
        );
        // TODO: leaves record in job history as 'INCOMPLETE', find out why
      }
    },

    // Other helper functions
    getCurrentDateTime() {
      const now = new Date();

      // Format the date and time (YYYY-MM-DD_HH-MM-SS)
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-based
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
    },
  },

  async mounted() {
    // On every page reload
    this.errorHandled = false; // Flag to ensure errors are handled only once

    // Prefill Job Details
    const totalRam = window.electron.getTotalRam(); // Get total RAM of current computer
    this.jobDetails.maxram = totalRam; // Set maxram to total RAM in GB
    this.jobDetails.jobid = this.getCurrentDateTime(); // Prefill Job ID with current timestamp

    const helpMarkdown = `
#### 1. JobID_classifications.tsv: It contains the classification results for each read. The columns are as follows.
1. \`is_classified\`: Classified or not
2. \`name\`: Read ID
3. \`taxID\`: Tax. ID in the tax. dump files used in database creation
4. \`query_length\`: Effective read length
5. \`score\`: DNA level identity score
6. \`rank\`: Taxonomic rank of the taxon
7. \`taxID:match_count\`: List of "taxID : k-mer match count"
\`\`\`
#query_id       name    taxID   query_length    score   rank    taxID:match_count
0       SRR14484345.1.1 0       141     0       -       -
1       SRR14484345.8.1 2697049 141     0.808511        no rank 2697049:25
\`\`\`

#### 2. JobID_report.tsv: It follows Kraken2's report format. The first line is a header, and the rest of the lines are tab-separated values. The columns are as follow.

1. \`clade_proportion\`: Percentage of reads classified to the clade rooted at this taxon
2. \`clade_count\`: Number of reads classified to the clade rooted at this taxon
3. \`taxon_count\`: Number of reads classified directly to this taxon
4. \`rank\`: Taxonomic rank of the taxon
5. \`taxID\`: Tax ID according to the taxonomy dump files used in the database creation
6. \`name\`: Taxonomic name of the taxon

\`\`\`
#clade_proportion       clade_count     taxon_count     rank    taxID   name
6.3491  1403612 1403612 no rank 0       unclassified
93.6509 20703786        5550    no rank 1       root
93.5580 20683246        8058    no rank 131567    cellular organisms
93.3781 20643465        680714  superkingdom    2           Bacteria
58.9608 13034701        105888  clade   1783272       Terrabacteria group
54.7279 12098906        472184  phylum  1239            Bacillota
50.0354 11061529        743978  class   186801            Clostridia
24.4574 5406894 402967  order   186802              Eubacteriales
18.2228 4028593 206645  family  216572                Oscillospiraceae
8.4570  1869631 950213  genus   216851                  Faecalibacterium
3.0276  669332  655324  species 853                       Faecalibacterium prausnitzii
0.0238  5271    5271    strain  718252                      Faecalibacterium prausnitzii L2-6
0.0199  4407    4407    strain  657322                      Faecalibacterium prausnitzii SL3/3
\`\`\`
`;

    this.readmeHtml = marked(helpMarkdown);
  },
};
</script>

<style scoped>
.v-col {
  padding-bottom: 0px;
}

.v-row {
  margin-top: 0px;
  margin-bottom: 0px;
}

.search-required-fields .v-col {
  padding-top: 0px;
}

.search-required-fields .v-list-subheader {
  min-height: 30px;
}

.search-required-fields .search-files .v-row {
  margin-bottom: 12px;
}

.search-required-fields .search-files .filename-col {
  padding-left: 0px;
}

:deep(.v-field__input),
:deep(.v-text-field__suffix) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  min-height: 30px;
  font-size: 12px;
}

.filename-chip {
  padding-left: 8px;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.search-advanced-settings .v-list-subheader {
  min-height: 0px;
}

/* Log textarea */
:deep(.v-textarea .v-field__input) {
  font-family: Roboto;
  background-color: white;
  font-size: 12px;
  margin-top: 16px;
  /* -webkit-mask-image: none; */
}

/* :deep so the rule reaches into the markdown-body */
:deep(.force-light .markdown-body) {
  background: #fff !important;
  color: #24292f !important;
}
</style>
