<template>
  <v-container>
    <v-card >
      <!-- HEADER TOOLBAR -->
      <v-toolbar image="assets/toolbar_background.png" class="custom-toolbar" density="compact">
        Quality Control
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

            </v-container>
          </div>
      </v-form>
    </v-card>
  </v-container>
</template>

<script>

export default {
  name: "QualityControlPage",
	data() {
    return {
      isJobFormValid: false,
      jobDetails: {
        // Store job details
        mode: "single-end",
        outFileSuffix: "_out",
        entries: [
        { q1: "", q2: "" }
      ],
        database: "",
        outdir: "",
        maxram: "",
      },


			// Job Details dialog
			snackbar: false,
			snackbarMessage: "",
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
					this.$emit("trigger-snackbar", `File selection error: ${error}`, "error", "fileAlert", "Dismiss");
				}
			} else {
				console.error("File dialog is not supported in the web environment."); // DEBUG
				this.$emit("trigger-snackbar", "File dialog is not supported in the web environment.", "error", "warning", "Dismiss");
			}
		},
		extractFilename(path) {
			return path.split("/").pop();
		},
		clearFile(field) {
			this.jobDetails[field] = null;
			this.$refs.jobForm.validate();
		},

    // Functions handling validation rules
    requiredRule(value) {
      if (value === "" || value === null || value === undefined) {
        return "Required field *";
      }
      return true;
    },

		showSnackbar(message) {
			this.snackbarMessage = message;
			this.snackbar = true;
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
