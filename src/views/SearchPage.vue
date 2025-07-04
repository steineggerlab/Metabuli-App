<template>
  <div>
    <SearchSetting @job-completed="handleJobComplete" />

    <!-- Footer: Reference to Paper -->
    <v-container class="pt-0">
      <v-card>
        <v-toolbar
          image="assets/toolbar_background.png"
          class="custom-toolbar"
          density="compact"
          >Reference</v-toolbar
        >
        <v-card-text>
          Kim J, Steinegger M.
          <a
            href="https://www.nature.com/articles/s41592-024-02273-y"
            target="_blank"
            class="text-blue-accent-4"
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
import SearchSetting from "@/components/search-page/SearchSetting.vue";

export default {
  name: "SearchPage",
  components: {
    SearchSetting,
  },
  data() {
    return {
      loadingDialog: false,
    };
  },
  methods: {
    // Show/hide dialog
    hideDialog() {
      this.loadingDialog = false;
    },

    // Job handling
    handleJobComplete(completedJob) {
      // Close loading dialog
      this.hideDialog();

      // Show results tab & badge in navigation drawer
      // Show/hide krona tab depending on jobType
      if (completedJob.jobType === "runSearch") {
        this.$emit("job-complete");
      } else if (completedJob.jobType === "uploadReport") {
        this.$emit("report-uploaded");
      }
    },
  },
};
</script>
