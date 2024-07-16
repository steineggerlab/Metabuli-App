<template>
  <div>
  <v-container> 
    <v-card>


      <v-toolbar title="Search Settings"></v-toolbar>
      <v-file-input clearable density="compact" label="q1" variant="underlined"></v-file-input>
      <v-file-input clearable density="compact" label="q2" variant="underlined"></v-file-input>
      <v-file-input clearable density="compact" label="db" variant="underlined"></v-file-input>
      <v-file-input clearable density="compact" label="outdir" variant="underlined"></v-file-input>
      <v-text-field label="Job ID" variant="underlined"></v-text-field>
      <v-text-field label="Max RAM" variant="underlined"></v-text-field>

      <v-btn @click="sendRequest">Run Metabuli</v-btn>
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
      q1: '/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/SRR14484345_1.fq',
      q2: '/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/SRR14484345_2.fq',
      database: "/Users/sunnylee/Documents/Steinegger Lab/metabuli_example/refseq_virus",
      jobid: "TEST99",
      outdir: "/Users/sunnylee/Documents/Steinegger Lab/metabuli_example",
      maxram: 128
    },
    status: 'INITIAL'
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
      this.populateFormData();

      axios.post('/api/ticket', this.formData) //FIXME: JSONPlaceholder API -> replace with Metabuli endpoint
        .then(async response => {
          console.log('success', response.data);

          try {
            await this.pollJobStatus(response.data.id); // Wait until job completes
            console.log("COMPLETE") //DELETE
            // const reportFilePath = `${this.jobDetails.jobid}_report.tsv`;
            // this.readTSVFile(`${this.jobDetails.outdir}/${reportFilePath}`);
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
          console.log(response.data.status) //DELETE
          if (response.data.status === 'RUNNING') {
            this.status = "RUNNING"
          }
          else if (response.data.status === 'COMPLETE') {
            this.status = "COMPLETE"
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