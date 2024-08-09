<template>
  <v-container>
    <v-data-table
      :headers="headers"
      :items="jobsHistory"
      :items-per-page="5"
      class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar flat>
          <v-toolbar-title>Job History</v-toolbar-title>
          <v-spacer></v-spacer>
        </v-toolbar>
      </template>

      <!-- <template v-slot:item.actions="{ item }">
        <v-btn icon @click="viewDetails(item)">
          <v-icon>mdi-eye</v-icon>
        </v-btn>
        <v-btn icon @click="deleteJob(item.id)">
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </template> -->
    </v-data-table>
  </v-container>
</template>

<script>
export default {
  name: "HistoryPage",
  data() {
    return {
      headers: [
        { title: "Completed At", value: "timestamp" },
        { title: "Type ", value: "jobType" },
        { title: "Status", value: "jobStatus" },
        { title: "Backend Output", value: "backendOutput" },
        // { text: 'Job ID', value: 'id' },
        // { text: 'Time Taken', value: 'timeTaken' },
        // { text: 'Actions', value: 'actions', sortable: false },
      ],
      jobsHistory: [], // To store the retrieved history
    };
  },
  mounted() {
    // Load job history from localStorage when the component is mounted
    this.jobsHistory = JSON.parse(localStorage.getItem("jobsHistory") || "[]");
    console.log(this.jobsHistory);
  },
  methods: {
    viewDetails(job) {
      // Logic to view job details (could route to a detailed view page)
      console.log("View job details:", job);
    },
    deleteJob(jobId) {
      // Remove the job from jobsHistory
      this.jobsHistory = this.jobsHistory.filter((job) => job.id !== jobId);
      // Update localStorage
      localStorage.setItem("jobsHistory", JSON.stringify(this.jobsHistory));
    },
  },
};
</script>

<style scoped>
/* Add any custom styles here */
</style>
