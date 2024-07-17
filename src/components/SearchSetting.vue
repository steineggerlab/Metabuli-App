<template>
  <div>
  <v-container> 
    <v-card>
      <v-toolbar title="Search Settings"></v-toolbar>

      <v-card-text>
        <v-text-field label="Job ID" variant="underlined" v-model="jobDetails.jobid"></v-text-field>

        <v-sheet class="d-flex align-center mb-2">
          <v-btn @click="selectFile('q1', 'file')">Select File</v-btn>
          <div class="ml-3">Selected File: {{ jobDetails.q1 }}</div>
        </v-sheet>

        <v-sheet class="d-flex align-center mb-2">
          <v-btn @click="selectFile('q2', 'file')">Select File</v-btn>
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

        <v-text-field label="Max RAM" variant="underlined" v-model="jobDetails.maxram"></v-text-field>

        <v-sheet class="d-flex align-center mb-2">
          <v-btn @click="sendRequest">Run Metabuli</v-btn>
          <v-btn @click="sendRequest(true)">Run Sample</v-btn>
        </v-sheet>
      </v-card-text>
    </v-card>

  </v-container>

  <v-container>
    <v-card>
      <v-toolbar>
        <v-toolbar-title>Status: {{ status }}</v-toolbar-title>
      </v-toolbar>

      <div class="status-container">
        <v-img :src="statusImage" alt="Status Image" height="200"></v-img>
        <div>{{ statusMessage }}</div>
        <v-spacer></v-spacer>
      </div>

    </v-card>
  </v-container>


  </div>
</template>

<script>
import axios from '../plugins/axios';

export default {
  name: 'SearchSetting',

  data: () => ({
    results: '',
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
      q1: '/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/SRR14484345_1.fq',
      q2: '/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/SRR14484345_2.fq',
      database: "/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/refseq_virus",
      jobid: "TEST99",
      outdir: "/Users/sunnylee/Documents/Steinegger Lab/metabuli_example",
      maxram: 128
    },
    status: 'INITIAL',
  }),

  computed: {
    statusMessage() {
      switch (this.status) {
        case 'INITIAL':
          return 'Input search settings and run.';
        case 'PENDING':
          return "JOB PENDING";
        case 'RUNNING':
          return "JOB IS RUNNING";
        case 'COMPLETE':
          return 'Job is complete. Check results in comparison results table.';
        default:
          return 'An error occurred, please try again.';
      }
    },
    statusImage() {
      switch (this.status) {
        case 'INITIAL':
          return '/assets/marv_metabuli_small.png';
        case 'PENDING', 'RUNNING':
          return "/assets/marv_metabuli_small.png";
        case 'COMPLETE':
          return "/assets/simple_marv_love.png";
        default:
          return "/assets/simple_marv_sad.png";
      }
    },
  },

  methods: {
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
          console.log(this.jobDetails);
        } catch (error) {
          console.error('Error selecting file:', error);
        }
      } else {
        console.error('File dialog is not supported in the web environment.');
      }
    },
    // Function to populate formData
    populateFormData(sample = false) {
      if (sample) {
        this.jobDetails = { ...this.jobDetailsSample };
      }
      this.formData.append('q1', this.jobDetails.q1);
      this.formData.append('q2', this.jobDetails.q2);
      this.formData.append('database[]', this.jobDetails.database);
      this.formData.append('jobid', this.jobDetails.jobid);
      this.formData.append('outdir', this.jobDetails.outdir);
      this.formData.append('maxram', this.jobDetails.maxram);

      console.log(this.jobDetails);
    },
    async sendRequest (sample = false) {
      this.populateFormData(sample);

      // Send the POST API request
      axios.post('/api/ticket', this.formData)
        .then(async response => {
          console.log('success', response.data);

          try {
            await this.pollJobStatus(response.data.id); // Wait until job completes
            console.log("COMPLETE") //DELETE
          } catch (error) {
            console.error('Error waiting for job completion:', error);
          }
        })
        .catch(error => {
          console.error('error', error);
        });
    },
    // Function to track job status
    async pollJobStatus(ticketid, interval = 500, timeout = 300000) { // Check job status every 0.5 seconds, timeout after 30 seconds
      const start = Date.now();
      while (Date.now() - start < timeout) {
        try {
          const response = await axios.get(`/api/ticket/${ticketid}`); // Get job status
          const status = response.data.status;
          console.log(status) //DELETE
          if (status !== 'COMPLETE') {
            this.status = status
          }
          else if (status === 'COMPLETE') {
            this.status = "COMPLETE"
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
      throw new Error('Polling timed out');
    },

  } 
}

</script>

<style scoped>
.status-container {
  display: flex;
  align-items: center;
}
</style>