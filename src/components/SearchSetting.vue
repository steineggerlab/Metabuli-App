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
        </v-toolbar>
        
        <!-- SEARCH SETTINGS -->
        <v-card-text>
          <v-radio-group v-model="endType" inline class="d-flex align-center mb-0">
            <v-radio label="Single-end" value="single-end"></v-radio>
            <v-radio label="Paired-end" value="paired-end"></v-radio>
          </v-radio-group>

          <v-text-field label="Job ID" variant="underlined" v-model="jobDetails.jobid" width="500"></v-text-field>

          <v-sheet class="d-flex align-center mb-2">
            <v-btn @click="selectFile('q1', 'file')">Select q1 File</v-btn>
            <div class="ml-3">Selected File: {{ jobDetails.q1 }}</div>
          </v-sheet>

          <v-sheet class="d-flex align-center mb-2" v-if="endType==='paired-end'">
            <v-btn @click="selectFile('q2', 'file')">Select q2 File</v-btn>
            <div class="ml-3">Selected File: {{ jobDetails.q2 }}</div>
          </v-sheet>

          <v-sheet class="d-flex align-center mb-2">
            <v-btn @click="selectFile('database', 'directory')">Select Database</v-btn>
            <div class="ml-3">Selected Directory: {{ jobDetails.database }}</div>
          </v-sheet>

          <v-sheet class="d-flex align-center mb-2">
            <v-btn @click="selectFile('outdir', 'directory')">Select Output Directory</v-btn>
            <div class="ml-3">Selected Directory: {{ jobDetails.outdir }}</div>
          </v-sheet>

          <v-text-field label="Max RAM" variant="underlined" v-model="jobDetails.maxram" width="500"></v-text-field>

          <!-- BUTTONS -->
          <v-sheet class="d-flex align-center mb-2">
            <v-btn 
              :loading="loading"
              @click="sendRequest"
              color="indigo"
            >
              Run Metabuli
              <template v-slot:loader>
                <v-progress-circular indeterminate></v-progress-circular>
              </template>
            </v-btn>

            <v-btn class="ml-3"
              @click="loadSampleData"
              color="indigo"
            >
              Load Sample Data
            </v-btn>
          </v-sheet>

        </v-card-text>
      </v-card>

      <!-- API Dialog -->
      <v-dialog v-model="apiDialog" max-width="800">
        <v-card>
          <v-card-title>
            cURL Command
          </v-card-title>
          <v-card-text>
            Use this command to get a submit a file in FASTA or FASTQ format to the Metabuli search server. Replace the ‘PATH_TO_FILE’ and '@PATH_TO_DIRECTORY' string with the path to the file or directory.
          </v-card-text>
          <v-card-text>
            <code>curl -X POST -F q1=@PATH_TO_FILE -F q2=@PATH_TO_FILE -F 'database[]=@PATH_TO_DIRECTORY' -F 'mode=3diaa' -F outdir=@PATH_TO_DIRECTORY -F jobid='test' "http://localhost:8081/api/ticket"</code>
          </v-card-text> 
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue darken-1" text @click="closeApiDialog">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Snackbar -->
      <v-snackbar
        v-model="snackbar.show"
        :timeout="snackbar.timeout"
      >
        <v-icon :color="snackbar.color" :icon="`$${snackbar.icon}`"></v-icon>
        {{ snackbar.message }}
        <template v-slot:actions>
          <v-btn :color="snackbar.color" variant="text" @click="snackbar.show = false">Close</v-btn>
        </template>
      </v-snackbar>
    </v-container>

  </div>
</template>

<script>
import axios from '@/plugins/axios';

export default {
  name: 'SearchSetting',
  data: () => ({
    formData: new FormData(), // Initialize FormData object
    jobDetails: { // Store job details including file paths
      q1: '',
      q2: '',
      database: "",
      jobid: "",
      outdir: "",
      maxram: 0
    },
    jobDetailsSample: { // Sample job details
      q1: 'SRR14484345_1.fq',
      q2: 'SRR14484345_2.fq',
      database: "refseq_virus",
      jobid: "sample_data",
      outdir: "/sample_data",
      maxram: 128
    },
    status: 'INITIAL',
    results: '',
    loading: false,
    apiDialog: false, // Control the visibility of the API dialog
    endType: 'single-end',
    snackbar: {
        show: false,
        message: '',
        color: '',
        icon: '',
        timeout: 3000,
      },
  }),

  methods: {
    toggleApiDialog() {
      this.apiDialog = !this.apiDialog;
    },
    closeApiDialog() {
      this.apiDialog = false;
    },
    async selectFile(field, type) {
      if ((window.electron)) {
        try {
          const options = {
            properties: type === 'file' ? ['openFile'] : ['openDirectory']
          };
          const filePaths = await window.electron.openFileDialog(options);
          if (filePaths && filePaths.length > 0) {
            this.jobDetails[field] = filePaths[0];
          }
        } catch (error) {
          console.error('Error selecting file:', error);
        }
      } else {
        console.error('File dialog is not supported in the web environment.');
      }
    },
    loadSampleData() {
      this.jobDetails = { ...this.jobDetailsSample };
      this.$emit('job-complete', { 
        outdir: this.jobDetailsSample.outdir, 
        jobid: this.jobDetailsSample.jobid
      });
      this.triggerSnackbar('success');
    },
    // Function to populate formData
    populateFormData() {
      this.formData.append('q1', this.jobDetails.q1);
      this.formData.append('q2', this.jobDetails.q2);
      this.formData.append('database[]', this.jobDetails.database);
      this.formData.append('jobid', this.jobDetails.jobid);
      this.formData.append('outdir', this.jobDetails.outdir);
      this.formData.append('maxram', this.jobDetails.maxram);
    },
    async sendRequest () {
      this.loading = true; // Start loading
      this.populateFormData();

      // Send the POST API request
      axios.post('/api/ticket', this.formData)
        .then(async response => {
          try {
            await this.pollJobStatus(response.data.id); // Wait until job completes

          } catch (error) {
            console.error('Error waiting for job completion:', error);
            this.loading = false; // Stop loading
          } finally {
            this.loading = false; // Stop loading
          }
        })
        .catch(() => {
          // Invalid query error
          this.triggerSnackbar('error');

          this.loading = false;
        });
    },
    // Function to track job status
    async pollJobStatus(ticketid, interval = 500, timeout = 60000) { // Check job status every 0.5 seconds, timeout after 30 seconds
      const start = Date.now();
      while (Date.now() - start < timeout) {
        try {
          const response = await axios.get(`/api/ticket/${ticketid}`); // Get job status
          const status = response.data.status;
          if (status !== 'COMPLETE') {
            this.status = status;
          }
          else if (status === 'COMPLETE') {
            this.status = "COMPLETE"
            this.triggerSnackbar('success');
            this.$emit('job-complete', { 
              outdir: this.jobDetails.outdir, 
              jobid: this.jobDetails.jobid 
            });

            return true;
          }
        } catch (error) {
          console.error('Error polling job status:', error);
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
      this.loading = false; // Stop loading
      throw new Error('Polling timed out');
    },
    triggerSnackbar(type) {
      this.snackbar.show = false; // Reset snackbar to ensure reactivity
      if (type === 'success') {
        this.snackbar.message = "Job complete. Check the results tab!";
        this.snackbar.color = 'green';
        this.snackbar.icon = 'success';
      } else if (type === 'error') {
        this.snackbar.message = "An error occurred. Please check query and try again.";
        this.snackbar.color = 'red';
        this.snackbar.icon = 'warning';
      }
      this.snackbar.show = true;
    },
  },
}
</script>



<style scoped>

.status-container {
  display: flex;
  align-items: center;
}
.search-settings-panel {
  position: relative;
}
.search-settings-panel::after {
  content: '';
  background: url('../../public/assets/marv_metabuli_small.png') no-repeat;
  background-size: 300px 300px; 
  opacity: 0.5;
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 300px;
  height: 300px;
}
code {
  font-family: Roboto;
  color: grey;
  background-color: #f1f1f1;
  padding: 2px;
  font-size: 12px;
}
</style>