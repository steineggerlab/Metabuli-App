<template>
  <v-container class="w-100">
    <v-card>
      <v-data-table
        :headers="headers"
        :items="jobsHistory"
        :items-per-page="10"
        class="elevation-1"
        :sort-by="[{ key: 'timestamp', order: 'desc' }]"
      >
        <template v-slot:top>
          <v-toolbar class="custom-toolbar" density="compact">
            Job History
            <v-spacer></v-spacer>
          </v-toolbar>
        </template>

        <!-- Timestamp Column -->
        <template v-slot:[`item.timestamp`]="{ item }">
          {{ formatTimestamp(item.timestamp) }}
        </template>

        <!-- Job Type Column -->
        <template v-slot:[`item.jobType`]="{ item }">
          <span v-if="item.jobType === 'runSearch' && item.isSample"
            >Load Sample</span
          >
          <span v-else-if="item.jobType === 'runSearch' && !item.isSample"
            >New Search</span
          >
          <span v-else-if="item.jobType === 'uploadReport'">Upload Report</span>
          <span v-else>Unknown</span>
        </template>

        <!-- Status Column -->
        <template v-slot:[`item.jobStatus`]="{ item }">
          <v-chip
            v-if="item.jobStatus === 'Completed'"
            color="green"
            prepend-icon="$complete"
            density="comfortable"
          >
            Completed
          </v-chip>

          <v-chip
            v-else-if="item.jobStatus === 'Error'"
            color="red"
            prepend-icon="$close"
            density="comfortable"
          >
            Failed
          </v-chip>

          <v-chip
            v-else
            color="grey"
            prepend-icon="$timelapse"
            density="comfortable"
          >
            Incomplete
          </v-chip>
        </template>

        <template v-slot:[`item.backendOutput`]="{ item }">
          <v-btn
            variant="tonal"
            color="primary"
            size="small"
            prepend-icon="$openInNew"
            class="text-body-2"
            :disabled="!item.backendOutput"
            @click="viewBackendOutput(item.backendOutput)"
          >
            View Details
          </v-btn>
        </template>

        <!-- Action Column -->
        <template v-slot:[`item.actions`]="{ item }">
          <div class="d-flex align-center justify-center">
            <v-btn
              variant="text"
              icon="$eye"
              size="small"
              rounded="xl"
              @click="viewDetails(item)"
            >
            </v-btn>
            <v-btn
              variant="text"
              icon="$trash"
              size="small"
              rounded="xl"
              @click="deleteJob(item.timestamp)"
            >
            </v-btn>
          </div>
        </template>
      </v-data-table>

      <!-- Dialog to display the backend output -->
      <v-dialog v-model="dialog" max-width="800px">
        <v-card class="text-break">
          <v-card-title
            class="headline d-flex justify-space-between align-center"
          >
            Backend Output
            <v-btn
              icon="$clipboard"
              variant="text"
              density="comfortable"
              size="large"
              color="primary"
              @click="copyToClipboard"
            >
            </v-btn>
          </v-card-title>
          <v-card-subtitle
            >Metabuli Classify Command Line Output</v-card-subtitle
          >
          <v-card-text
            class="w-100 text-break"
            style="
              white-space: pre-wrap;
              word-wrap: break-word;
              overflow-wrap: break-word;
            "
          >
            <div class="text-caption">{{ selectedBackendOutput }}</div>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" @click="dialog = false">Close</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Snackbar -->
      <v-snackbar v-model="snackbar" location="top" timeout="3000">
        {{ snackbarMessage }}
      </v-snackbar>
    </v-card>
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
        { title: "Status", value: "jobStatus", align: "center" },
        { title: "Job Details", value: "backendOutput", align: "center" },
        // { text: 'Job ID', value: 'id' },
        // { text: 'Time Taken', value: 'timeTaken' },
        {
          title: "Actions",
          value: "actions",
          align: "center",
          sortable: false,
        },
      ],
      jobsHistory: [], // To store the retrieved history

      // Job Details dialog
      dialog: false,
      selectedBackendOutput: "",
      snackbar: false,
      snackbarMessage: "",
    };
  },
  mounted() {
    // Load job history from localStorage when the component is mounted
    this.jobsHistory = JSON.parse(localStorage.getItem("jobsHistory") || "[]");
    console.log(this.jobsHistory);
  },
  methods: {
    viewDetails(jobItem) {
      const completedJob = {
        jobType: "runSearch",
        resultsJSON: jobItem.results,
        kronaContent: jobItem.kronaContent,
      };

      localStorage.setItem("processedResults", JSON.stringify(completedJob));
      this.$router.push({ name: "ResultsPage" });
    },
    deleteJob(timestamp) {
      // Remove the job from jobsHistory
      this.jobsHistory = this.jobsHistory.filter(
        (job) => job.timestamp !== timestamp
      );
      // Update localStorage
      localStorage.setItem("jobsHistory", JSON.stringify(this.jobsHistory));
    },
    formatTimestamp(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString(); // You can customize this as needed
    },
    viewBackendOutput(output) {
      this.selectedBackendOutput = output;
      this.dialog = true;
    },
    copyToClipboard() {
      navigator.clipboard
        .writeText(this.selectedBackendOutput)
        .then(() => {
          this.showSnackbar("Copied to clipboard!"); // Optional: Show a snackbar or notification
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err);
        });
    },
    showSnackbar(message) {
      this.snackbarMessage = message;
      this.snackbar = true;
    },
  },
};
</script>

<style scoped>
/* Add any custom styles here */
</style>
