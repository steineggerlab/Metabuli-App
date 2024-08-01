<template>
  <div>
    <SearchSetting
      @job-started="showDialog"
      @job-aborted="hideDialog"
      @job-completed="handleJobComplete"
      @report-uploaded="handleReportUpload"
    />

    <!-- Loading Dialog -->
    <v-dialog v-model="loadingDialog" max-width="320" persistent>
      <v-list class="py-2" color="primary" elevation="12" rounded="lg">
        <v-list-item prepend-icon="$setting" title="Processing Job...">
          <template v-slot:prepend>
            <div class="pe-4">
              <v-icon color="primary" size="x-large"></v-icon>
            </div>
          </template>
          <template v-slot:append>
            <v-progress-circular
              color="primary"
              indeterminate="disable-shrink"
              size="16"
              width="2"
            ></v-progress-circular>
          </template>
        </v-list-item>
        <v-list-item v-if="!isSampleJob">
          <v-btn class="ma-2" @click="cancelBackend">Cancel</v-btn>
        </v-list-item>
      </v-list>
    </v-dialog>

    <!-- Footer: Reference to Paper -->
    <v-container>
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
