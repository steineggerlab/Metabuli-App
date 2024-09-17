<template>
  <v-container class="w-100">
    <v-card>
      <v-data-table
        v-model="selectedItems"
        :headers="headers"
        :items="jobsHistory"
        item-value="timestamp"
        :items-per-page="10"
        class="elevation-1"
        :sort-by="[{ key: 'timestamp', order: 'desc' }]"
        select-strategy="page"
        show-select
        hide-default-footer
      >
        <template v-slot:top>
          <v-toolbar image='assets/toolbar_background.png' class="custom-toolbar py-3" density="compact">
            <div class="d-flex flex-column">
              <div>Job History</div>
              <v-list-item-subtitle
                >Metabuli stores the latest 10 job histories</v-list-item-subtitle
              >
            </div>
          </v-toolbar>
        </template>

        <!-- Job ID Column -->
        <template v-slot:[`item.jobId`]="{ item }">
          <span v-if="item.jobId === '' || item.jobId === null">-</span>
          <span v-else>{{ item.jobId }}</span>
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
            color="success"
            prepend-icon="$success"
            density="comfortable"
          >
            Completed
          </v-chip>

          <v-chip
            v-else-if="item.jobStatus === 'ERROR'"
            color="error"
            prepend-icon="$warning"
            density="comfortable"
          >
            Failed
          </v-chip>

          <v-chip
            v-else-if="item.jobStatus === 'TIMEOUT'"
            color="grey"
            prepend-icon="$timelapse"
            density="comfortable"
          >
            Timeout
          </v-chip>

          <v-chip
            v-else-if="item.jobStatus === 'CANCELLED'"
            color="warning"
            prepend-icon="$cancel"
            density="comfortable"
          >
            Cancelled
          </v-chip>

          <v-chip
            v-else
            color="grey"
            prepend-icon="$helpCircle"
            density="comfortable"
          >
            Incomplete
          </v-chip>
        </template>

        <template v-slot:[`item.backendOutput`]="{ item }">
          <v-btn
            variant="text"
            size="small"
            prepend-icon="$openInNew"
            class="text-body-2"
            :disabled="!item.backendOutput"
            @click="viewBackendOutput(item.backendOutput)"
          >
            View Log
          </v-btn>
        </template>

        <!-- Action Column -->
        <template v-slot:[`item.actions`]="{ item }">
          <div class="d-flex align-center justify-center">
            <v-btn
              prepend-icon="$eye"
              variant="tonal"
              color="primary"
              size="small"
              class="text-body-2"
              :disabled="!item.results"
              @click="viewDetails(item)"
              >See Results
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

      <!-- Floating Action Box for Selected Items -->
      <v-fade-transition>
        <div
          v-if="selectedItems.length > 0"
          class="floating-action-box bg-white py-2 px-3 elevation-3 rounded-lg"
        >
          <v-chip variant="text">{{ selectedItems.length }} selected</v-chip>
          <v-btn
            variant="outlined"
            color="error"
            icon="$trash"
            size="small"
            density="comfortable"
            class="px-2"
            @click="deleteSelectedItems"
            ></v-btn
          >
        </div>
      </v-fade-transition>

      <!-- Dialog to display the backend output -->
      <v-dialog v-model="dialog" max-width="800px">
        <v-card class="text-break">
          <v-card-title
            class="headline pl-4 d-flex justify-space-between align-center"
          >
            Job Process Output Log
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
        { title: "Job ID", value: "jobId" },
        { title: "Completed At", value: "timestamp" },
        { title: "Type ", value: "jobType", align: "center" },
        { title: "Status", value: "jobStatus", align: "center" },
        { title: "Process Log", value: "backendOutput", align: "center" },
        {
          title: "Actions",
          value: "actions",
          align: "center",
          sortable: false,
        },
      ],
      jobsHistory: [], // To store the retrieved history
      selectedItems: [], // To track selected items

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
    deleteSelectedItems() {
      // Remove the selected jobs from jobsHistory
      this.jobsHistory = this.jobsHistory.filter(
        (job) => !this.selectedItems.includes(job.timestamp)
      );
      // Clear selected items
      this.selectedItems = [];
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
.floating-action-box {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}
</style>
