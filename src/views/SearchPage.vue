<template>
  <div>
    <SearchSetting
      @job-started="showDialog"
      @job-aborted="hideDialog"
      @job-timed-out="handleJobTimeOut"
      @job-completed="handleJobComplete"
      @report-uploaded="handleReportUpload"
    />

    <!-- Loading Dialog -->
    <v-dialog v-model="loadingDialog" max-width="320" persistent>
      <v-list class="d-flex flex-column" elevation="12" rounded="lg">
        <div class="d-flex flex-column align-center">
          <v-list-item>
            <v-img
              src="assets/marv_metabuli_animated.gif"
              width="130px"
            ></v-img>
          </v-list-item>

          <v-list-item title="Processing Job..."></v-list-item>
        </div>
        <div v-if="!isSampleJob" class="d-flex justify-end mr-2">
          <v-btn variant="plain" color="primary" @click="cancelBackend"
            >Cancel</v-btn
          >
        </div>
      </v-list>
    </v-dialog>

    <!-- Footer: Reference to Paper -->
    <v-container class="pt-0">
      <v-card>
        <v-toolbar class="custom-toolbar" density="compact"
          >Reference</v-toolbar
        >
        <v-card-text>
          Kim J, Steinegger M.
          <a
            href="https://www.nature.com/articles/s41592-024-02273-y"
            target="_blank"
          >
            Metabuli: sensitive and specific metagenomic classification via
            joint analysis of amino acid and DNA.
          </a>
          Nature Methods (2024).
        </v-card-text>
      </v-card>
    </v-container>
  </div>
</template>

<script>
import SearchSetting from "@/components/SearchSetting.vue";

export default {
  name: "SearchPage",
  components: {
    SearchSetting,
  },
  data() {
    return {
      loadingDialog: false,
      isSampleJob: false,
    };
  },
  methods: {
    showDialog(isSample) {
      this.loadingDialog = true;
      this.isSampleJob = isSample;
    },
    hideDialog() {
      this.loadingDialog = false;
    },

    handleJobComplete(payload) {
      this.hideDialog();
      this.$emit("job-complete", {
        outdir: payload.outdir,
        jobid: payload.jobid,
        isSample: payload.isSample,
      });

    },
    handleJobTimeOut() {
      this.cancelBackend();
    },
    handleReportUpload(filePath) {
      this.hideDialog();
      this.$emit("report-uploaded", filePath);
    },
    cancelBackend() {
      this.hideDialog();
      window.electron.cancelBackend();
    },
  },
};
</script>
