<template>
  <div>
    <v-container>
      <!-- SEARCH SETTINGS PANEL -->
      <v-card class="mb-3 search-settings-panel">
        <!-- HEADER TOOLBAR -->
        <v-toolbar
          image="assets/toolbar_background.png"
          class="custom-toolbar"
          density="compact"
        >
          Taxonomic Classification
          <v-spacer></v-spacer>

          <div>
            <v-btn rounded="xs" @click="showReadme = true" variant="tonal">
              MANUAL
            </v-btn>

            <!-- ReadMe Manual Bottom Sheet -->
            <v-bottom-sheet class="markdown-body" v-model="showReadme">
              <v-card>
                <v-card-text style="max-height: 90vh; overflow-y: auto">
                  <div v-html="readmeHtml"></div>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn text @click="showReadme = false">Close</v-btn>
                </v-card-actions>
              </v-card>
            </v-bottom-sheet>
          </div>

          <!-- TABS -->
          <template v-slot:extension>
            <v-tabs v-model="tab">
              <v-tab
                v-for="item in tabItems"
                :text="item.title"
                :key="item.value"
                :value="item.value"
              ></v-tab>
            </v-tabs>
          </template>
        </v-toolbar>

        <v-tabs-window v-model="tab">
          <!-- RUN SEARCH TAB -->
          <v-tabs-window-item
            transition="fade-transition"
            reverse-transition="fade-transition"
            :value="tabItems[0].value"
          >
            <NewSearchTab
              @job-completed="emitJobCompleted"
              @trigger-snackbar="triggerSnackbar"
              @store-job="storeJob"
            >
            </NewSearchTab>
          </v-tabs-window-item>

          <!-- UPLOAD REPORT TAB-->
          <v-tabs-window-item
            transition="fade-transition"
            reverse-transition="fade-transition"
            :value="tabItems[1].value"
          >
            <UploadReportTab
              @job-started="emitJobStarted"
              @job-completed="emitJobCompleted"
              @job-aborted="emitJobAborted"
              @trigger-snackbar="triggerSnackbar"
              @store-job="storeJob"
            ></UploadReportTab>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>

      <!-- Snackbar -->
      <v-snackbar
        v-model="snackbar.show"
        :timeout="snackbar.timeout"
        location="top"
        color="white"
      >
        <v-icon :color="snackbar.color" :icon="`$${snackbar.icon}`"></v-icon>
        {{ snackbar.message }}
        <template v-slot:actions>
          <v-btn
            v-if="snackbar.buttonText"
            :color="snackbar.color"
            variant="text"
            @click="handleSnackbarAction"
            >{{ snackbar.buttonText }}</v-btn
          >
          <v-btn
            v-else
            :color="snackbar.color"
            variant="text"
            @click="snackbar.show = false"
          >
            Close
          </v-btn>
        </template>
      </v-snackbar>
    </v-container>
  </div>
</template>

<script>
import NewSearchTab from "@/components/search-page/NewSearchTab.vue";
import UploadReportTab from "@/components/search-page/UploadReportTab.vue";
import {
  trimAndStoreJobsHistory,
  loadJobsHistory,
} from "@/plugins/storageUtils.js";
import { loadMarkdownAsHtml } from "@/plugins/markdownLoader";

export default {
  name: "SearchSetting",
  components: {
    NewSearchTab,
    UploadReportTab,
  },
  data: () => ({
    tab: "runSearch",
    tabItems: [
      { title: "Run New Job", value: "runSearch" },
      { title: "Upload Report", value: "uploadReport" },
    ],
    snackbar: {
      show: false,
      message: "",
      color: "",
      icon: "",
      buttonText: "",
      action: null,
      timeout: 4000,
    },

    // ReadMe Manual Handling
    showReadme: false,
    readmeHtml: "",
  }),

  methods: {
    // Cascade emit from tabs
    emitJobStarted(bool) {
      this.$emit("job-started", bool);
    },
    emitJobCompleted(completedJobObject) {
      this.$emit("job-completed", completedJobObject);
    },
    emitJobAborted() {
      this.$emit("job-aborted");
    },

    // Function managing job history storage
    async storeJob(job) {
      // Create a new job entry with additional details
      const jobHistoryEntry = {
        ...JSON.parse(JSON.stringify(job)),
        timestamp: new Date().toISOString(),
      };

      try {
        // Load existing jobs from file using Electron API
        let jobsHistory = await loadJobsHistory();

        // Add the new job to the history array
        jobsHistory.push(jobHistoryEntry);

        // Trim and store the latest 10 jobs in the file
        await trimAndStoreJobsHistory(jobsHistory);
      } catch (error) {
        console.error("Error storing job:", error);
      }
    },

    // Functions managing snackbar
    triggerSnackbar(
      message,
      color = "info",
      icon = "info",
      buttonText = "",
      action = null,
    ) {
      if (this.snackbar.show) return; // If multiple snackbars are triggered, show the first one

      this.snackbar.message = message;
      this.snackbar.color = color;
      this.snackbar.icon = icon;
      this.snackbar.buttonText = buttonText;
      this.snackbar.action = action;

      this.snackbar.show = true;
    },
    handleSnackbarAction() {
      if (this.snackbar.action) {
        this.snackbar.action();
      }
      this.snackbar.show = false;
    },
  },

  async mounted() {
    try {
      this.readmeHtml = await loadMarkdownAsHtml("docs/classification.md");
    } catch (err) {
      console.error("Failed to load README.md:", err);
      // Fallback content
      this.readmeHtml = `
				<p>
					⚠️ Ran into an error while loading the instructions.<br>
					You can still view them at
					<a href="https://github.com/steineggerlab/Metabuli-App" target="_blank" style="text-decoration: underline;">
						steineggerlab/Metabuli-App</a>
				</p>
			`;
    }
  },
};
</script>

<style scoped>
/* STYLE APPLYING TO BOTH TABS */
.search-setting-title {
  font-family: Roboto;
  font-weight: 600;
  font-size: 16px;
  letter-spacing: 2px;
  text-transform: uppercase;
}

.v-col {
  padding-bottom: 0px;
}

.v-row {
  margin-top: 0px;
  margin-bottom: 0px;
}

.custom-snackbar {
  top: 64px !important;
  /* Adjust this value to match your app bar height */
}
</style>
