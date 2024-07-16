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

      <v-btn :loading="waiting" @click="clickButton">
        Click
      </v-btn>
    </v-card>

    
  
  </v-container>

  <v-container>
    <v-card>
    <v-toolbar title="Status"></v-toolbar>
    <v-file-input clearable density="compact" label="q1" variant="underlined"></v-file-input>
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
      jobid: "TEST78",
      outdir: "/Users/sunnylee/Documents/Steinegger Lab/metabuli_example",
      maxram: 128
    },
    waiting: false
  }),
  
  methods: {
    async clickButton () {
      this.formData.append('q1', this.jobDetails.q1);
      this.formData.append('q2', this.jobDetails.q2);
      this.formData.append('database[]', this.jobDetails.database);
      this.formData.append('jobid', this.jobDetails.jobid);
      this.formData.append('outdir', this.jobDetails.outdir);
      this.formData.append('maxram', this.jobDetails.maxram);


      axios.post('/api/ticket', this.formData) //FIXME: JSONPlaceholder API -> replace with Metabuli endpoint
        .then(response => {
          console.log('Response:', response.data);
          // this.results.push(response.data); // Add the response to results
          // this.saveResults(); // Save the results content
        })
        .catch(error => {
          console.error('Error posting data:', error);
        });
    }

  } 
}

</script>
