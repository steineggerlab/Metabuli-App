<template>
  <div>
    <CustomDatabaseSetting
      @job-started="showDialog"
      @job-aborted="hideDialog"
      @job-completed="handleJobComplete"
      @backend-realtime-output="updateRealtimeOutput"
    />

    <!-- Loading Dialog -->
    <v-dialog v-model="loadingDialog" persistent>
      <v-card class="mx-auto" width="700">
        <v-list>
          <!-- Title -->
          <v-list-item class="font-weight-bold text-h6 py-0 pl-8 text-button">
            <span>{{
              statusComplete ? "Job Complete!" : "Processing Job..."
            }}</span>
            <template v-slot:append>
              <v-img src="assets/marv_metabuli_animated.gif" width="60"></v-img>
            </template>
          </v-list-item>

          <!-- Hide Log Output + Cancel Button on Load Sample -->
          <div v-if="!isSampleJob">
            <!-- Display Real-time Output -->
            <v-list-item class="pt-1">
              <template v-slot:subtitle>
                <v-textarea
                  variant="outlined"
                  v-if="backendOutput"
                  v-model="backendOutput"
                  label="Command Line Output"
                  rows="15"
                  no-resize
                  readonly
                  hide-details="true"
                  bg-color="white"
                  class="mt-3 mx-0 text-caption"
                  ref="outputTextarea"
                ></v-textarea>
              </template>
            </v-list-item>

            <!-- Cancel Button -->
            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn v-if="statusComplete" color="primary" @click="hideDialog"
                >Close</v-btn
              >
              <v-btn
                v-else
                variant="plain"
                color="primary"
                @click="cancelBackend"
                >Cancel</v-btn
              >
            </v-card-actions>
          </div>
        </v-list>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
/* eslint-disable */
import CustomDatabaseSetting from "@/components/custom-database-page/CustomDatabaseSetting.vue";

export default {
  name: "CustomDatabasePage",
  components: {
    CustomDatabaseSetting,
  },
  data() {
    return {
      statusComplete: false,
      loadingDialog: false,
      backendOutput: "", // Data property to store real-time output
    };
  },
  methods: {
    // Show/hide dialog
    showDialog() {
      this.loadingDialog = true;
    },
    hideDialog() {
      this.loadingDialog = false;
      this.statusComplete = false;
      this.backendOutput = ""; // Clear backend output
    },

    // Loading dialog log textarea
    updateRealtimeOutput(output) {
      this.backendOutput = output; // Update real-time output
      this.$nextTick(() => {
        // Scroll to the bottom
        const textarea =
          this.$refs.outputTextarea.$el.querySelector("textarea");
        textarea.scrollTop = textarea.scrollHeight;
      });
    },

    // Job handling
    handleJobComplete() {
      this.statusComplete = true;
    },
    cancelBackend() {
      this.hideDialog();
      window.electron.cancelBackend();
    },
  },
};
</script>

<style scoped>
/* Log textarea */
:deep(.v-textarea .v-field__input) {
  font-family: Roboto;
  background-color: white;
  font-size: 12px;
  margin-top: 16px;
  /* -webkit-mask-image: none; */
}
</style>
