<template>
  <v-container>
    <v-card class="mb-3">
      <!-- HEADER TOOLBAR -->
      <v-toolbar image="assets/toolbar_background.png" class="custom-toolbar" density="compact">
        Quality Control
        <v-spacer></v-spacer>
      </v-toolbar>

      <v-form ref="jobForm" v-model="isJobFormValid">
        <div class="d-flex search-required-fields">

          <v-container>
            <!-- End Type (single-end, paired-end, long-read) -->
            <v-row align="center">
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
              <v-row>
                <v-col cols="2">
                  <v-list-subheader>Output File Suffix</v-list-subheader>
                </v-col>
                <v-col cols="4">
                  <v-text-field
                    v-model="jobDetails.outFileSuffix"
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
              <v-row>
                <v-col cols="2">
                  <v-list-subheader class="pr-0">Upload Files</v-list-subheader>
                </v-col>

                <v-col cols="10" class="search-files">
                  <v-row>
                    <!-- Read 1 File -->
                    <v-col cols="3">
                      <v-btn @click="selectFile('q1', 'file')" prepend-icon="$file" density="comfortable" size="default" class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                        >Read 1 File</v-btn
                      >
                      <v-text-field v-model="jobDetails.q1" :rules="[requiredRule]" style="display: none"></v-text-field>
                    </v-col>
                      <!-- <v-col cols="6" class="filename-col">
                      <v-chip v-if="jobDetails.q1" label color="primary" density="comfortable" class="filename-chip">
                        <v-icon icon="$delete" @click="clearFile('q1')" class="mr-1"></v-icon>
                        {{ this.extractFilename(jobDetails.q1) }}</v-chip
                      >
                      </v-col> -->

                    <!-- Read 2 File -->
                    <v-col cols="3" v-if="jobDetails.mode === 'paired-end'">
                      <v-btn @click="selectFile('q2', 'file')" prepend-icon="$file" density="comfortable" size="default" class="w-100 text-caption font-weight-medium rounded-lg text-uppercase"
                        >Read 2 File</v-btn
                      >
                      <v-text-field v-model="jobDetails.q2" :rules="[jobDetails.mode === 'paired-end' ? requiredRule : () => true]" style="display: none"></v-text-field>
                    </v-col>

									<!-- <v-col cols="6" class="filename-col">
										<v-chip v-if="jobDetails.q2" label color="primary" density="comfortable" class="filename-chip">
											<v-icon icon="$delete" @click="clearFile('q2')" class="mr-1"></v-icon>
											{{ this.extractFilename(jobDetails.q2) }}</v-chip
										>
									</v-col> -->
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
        q1: "",
        q2: "",
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

</style>
