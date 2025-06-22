<template>
  <v-dialog v-model="dialog" max-width="800" persistent>
    <template v-slot:activator="{ props }">
      <slot name="activator" v-bind="{ props }"></slot>
    </template>

    <v-card>
      <v-card-title class="font-weight-bold text-h6 px-6 pt-6 text-button">Quality Control Settings</v-card-title>
      <v-card-text class="dialog-style">
        <v-form ref="form">
          <!-- Short / Paired-end Reads (fastp) -->
          <div v-if="mode === 'single-end' || mode === 'paired-end'">

            <!-- Quality Filtering -->
            <v-card-title class="text-button" color="indigo">Quality Filtering</v-card-title>
            <v-card-text class="w-50">
              <v-switch v-model="params.disable_quality_filtering" label="Disable quality filtering" />
              <v-text-field v-model.number="params.qualified_quality_phred" :disabled="params.disable_quality_filtering"
                label="Min per-base Phred score" type="number" />
              <v-text-field v-model.number="params.unqualified_percent_limit"
                :disabled="params.disable_quality_filtering" label="Max % low-quality bases" type="number" />
              <v-text-field v-model.number="params.average_qual" :disabled="params.disable_quality_filtering"
                label="Min avg quality (optional)" type="number" />
            </v-card-text>
            <v-divider class="my-4" />

            <!-- Length Filtering -->
            <v-card-title class="text-button">Length Filtering</v-card-title>
            <v-card-text class="w-50">
              <v-switch v-model="params.disable_length_filtering" label="Disable length filtering" />
              <v-text-field v-model.number="params.length_required" :disabled="params.disable_length_filtering"
                label="Min read length" type="number" />
              <v-text-field v-model.number="params.length_limit" :disabled="params.disable_length_filtering"
                label="Max read length (optional)" type="number" />
            </v-card-text>
            <v-divider class="my-4" />

            <!-- Adapter Trimming -->
            <v-card-title class="text-button">Adapter Trimming</v-card-title>
            <v-card-text class="w-50">
              <v-switch v-model="params.disable_adapter_trimming" label="Disable adapter trimming" />
              <v-text-field v-model="params.adapter_sequence" :disabled="params.disable_adapter_trimming"
                label="Adapter for read1 (opt.)" />
              <v-text-field v-if="mode === 'paired-end'" v-model="params.adapter_sequence_r2"
                :disabled="params.disable_adapter_trimming" label="Adapter for read2 (opt.)" />
              <v-text-field v-model="params.adapter_fasta" :disabled="params.disable_adapter_trimming"
                prepend-icon="$file" type="text" color="indigo" @click:prepend="selectFile('adapter_fasta', 'file')"
                @focus="scrollToEnd($event)" label="Adapter FASTA file" />
            </v-card-text>
            <v-divider class="my-4" />

            <!-- Low Complexity Filtering -->
            <v-card-title class="text-button">Low Complexity Filtering</v-card-title>
            <v-card-text class="w-50">
              <v-switch v-model="params.low_complexity_filter" label="Enable low complexity filtering" />
              <v-text-field v-model.number="params.complexity_threshold" :disabled="!params.low_complexity_filter"
                label="Complexity threshold (0-100)" type="number" />
            </v-card-text>
            <v-divider class="my-4" />

            <!-- Per-read Cutting -->
            <v-card-title class="text-button">Per-read Cutting</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <v-switch v-model="params.cut_front" label="Cut front by quality" />
                  <v-text-field v-model.number="params.cut_front_window_size" :disabled="!params.cut_front"
                    label="Front window size" type="number" />
                  <v-text-field v-model.number="params.cut_front_mean_quality" :disabled="!params.cut_front"
                    label="Front mean quality" type="number" />
                </v-col>
                <v-col cols="6">
                  <v-switch v-model="params.cut_tail" label="Cut tail by quality" />
                  <v-text-field v-model.number="params.cut_tail_window_size" :disabled="!params.cut_tail"
                    label="Tail window size" type="number" />
                  <v-text-field v-model.number="params.cut_tail_mean_quality" :disabled="!params.cut_tail"
                    label="Tail mean quality" type="number" />
                </v-col>
              </v-row>
            </v-card-text>
            <v-divider class="my-4" />

            <!-- Other Settings -->
            <v-card-title class="text-button">Other</v-card-title>
            <v-card-text class="w-50 mt-4">
              <v-text-field v-model.number="params.thread" label="Threads" type="number" />
              <v-text-field v-model.number="params.compression" label="Compression level" type="number" />
            </v-card-text>
          </div>

          <!-- Long Reads (fastplong) -->
          <div v-else-if="mode === 'long-read'">
            <!-- Quality Filtering -->
            <v-card-title class="text-button">Quality Filtering</v-card-title>
            <v-card-text class="w-50">
              <v-switch v-model="params.disable_quality_filtering" label="Disable quality filtering" />
              <v-text-field v-model.number="params.qualified_quality_phred" :disabled="params.disable_quality_filtering"
                label="Min per-base Phred score" type="number" />
              <v-text-field v-model.number="params.unqualified_percent_limit"
                :disabled="params.disable_quality_filtering" label="Max % low-quality bases" type="number" />
              <v-text-field v-model.number="params.mean_qual" :disabled="params.disable_quality_filtering"
                label="Min avg quality (optional)" type="number" />
            </v-card-text>
            <v-divider class="my-4" />

            <!-- Length Filtering -->
            <v-card-title class="text-button">Length Filtering</v-card-title>
            <v-card-text class="w-50">
              <v-switch v-model="params.disable_length_filtering" label="Disable length filtering" />
              <v-text-field v-model.number="params.length_required" :disabled="params.disable_length_filtering"
                label="Min read length" type="number" />
              <v-text-field v-model.number="params.length_limit" :disabled="params.disable_length_filtering"
                label="Max read length (optional)" type="number" />
            </v-card-text>
            <v-divider class="my-4" />

            <!-- Adapter Trimming -->
            <v-card-title class="text-button">Adapter Trimming</v-card-title>
            <v-card-text class="w-50">
              <v-switch v-model="params.disable_adapter_trimming" label="Disable adapter trimming" />
              <v-text-field v-model="params.start_adapter" :disabled="params.disable_adapter_trimming"
                label="Start adapter seq" />
              <v-text-field v-model="params.end_adapter" :disabled="params.disable_adapter_trimming"
                label="End adapter seq" />
              <v-text-field v-model="params.adapter_fasta" :disabled="params.disable_adapter_trimming"
                prepend-icon="$file" type="text" color="indigo" @click:prepend="selectFile('adapter_fasta', 'file')"
                @focus="scrollToEnd($event)" label="Adapter FASTA file" />
            </v-card-text>
            <v-divider class="my-4" />

            <!-- Low Complexity Filtering -->
            <v-card-title class="text-button">Low Complexity Filtering</v-card-title>
            <v-card-text class="w-50">
              <v-switch v-model="params.low_complexity_filter" label="Enable low complexity filtering" />
              <v-text-field v-model.number="params.complexity_threshold" :disabled="!params.low_complexity_filter"
                label="Complexity threshold (0-100)" type="number" />
            </v-card-text>
            <v-divider class="my-4" />

            <!-- Per-read Cutting -->
            <v-card-title class="text-button">Per-read Cutting</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <v-switch v-model="params.cut_front" label="Cut front by quality" />
                  <v-text-field v-model.number="params.cut_front_window_size" :disabled="!params.cut_front"
                    label="Front window size" type="number" />
                  <v-text-field v-model.number="params.cut_front_mean_quality" :disabled="!params.cut_front"
                    label="Front mean quality" type="number" />
                </v-col>
                <v-col cols="6">
                  <v-switch v-model="params.cut_tail" label="Cut tail by quality" />
                  <v-text-field v-model.number="params.cut_tail_window_size" :disabled="!params.cut_tail"
                    label="Tail window size" type="number" />
                  <v-text-field v-model.number="params.cut_tail_mean_quality" :disabled="!params.cut_tail"
                    label="Tail mean quality" type="number" />
                </v-col>
              </v-row>
            </v-card-text>
            <v-divider class="my-4" />

            <!-- Other Settings -->
            <v-card-title class="text-button">Other</v-card-title>
            <v-card-text class="w-50 mt-4">
              <v-text-field v-model.number="params.thread" label="Threads" type="number" />
              <v-text-field v-model.number="params.compression" label="Compression level" type="number" />
            </v-card-text>
          </div>
          <v-divider class="my‐4"></v-divider>
          <!-- Extra params file -->
          <v-card-title class="text-button">Additional Parameters</v-card-title>
          <v-card-text>
            <!-- TODO -->
            <v-text-field v-model="extraFile" prepend-icon="$file" color="indigo" @click:prepend="loadExtraParamsFile"
              readonly label="Load extra fastp params file" />
            <small class="text-caption">The file should contain one parameter per line, and each line should start with
              the parameter name followed by its value. Parameters here will override the GUI settings. Please use long
              options (e.g., `--disable_quality_filtering`) instead of short options (e.g., `-Q`).</small>
          </v-card-text>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="onCancel">Cancel</v-btn>
        <v-btn color="indigo" variant="tonal" @click="onSave">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'QCSettingsDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      required: true,
    },
    initialParams: {
      type: Object,
      default: () => ({}),
    },
  },
  emits: ['update-fastp-params'],
  data() {
    // Default parameters
    const defaults = {
      // Quality Filtering
      disable_quality_filtering: false,
      qualified_quality_phred: 15,
      unqualified_percent_limit: 40,
      average_qual: null, // fastp
      mean_qual: null, // fastplong

      // Length Filtering
      disable_length_filtering: false,
      length_required: this.mode === 'long-read' ? 1000 : 50,
      length_limit: null, // TODO: is null the right default
      
      // Adapter Trimming
      disable_adapter_trimming: false,
      adapter_sequence: '', // fastp
      adapter_sequence_r2: '', // fastp paired-end
      start_adapter: '', // fastplong
      end_adapter: '', // fastplong
      adapter_fasta: null,

      // Low Complexity Filtering
      low_complexity_filter: false,
      complexity_threshold: 30,
      cut_front: false,
      cut_front_window_size: 4,
      cut_front_mean_quality: 20,
      cut_tail: false,
      cut_tail_window_size: 4,
      cut_tail_mean_quality: 20,

      // Other Settings
      thread: Math.min(navigator.hardwareConcurrency || 4, 16),
      compression: 4,
    };
    return {
      dialog: this.modelValue,
      params: { ...defaults, ...this.initialParams },
      extraFile: null,
      extraParams: [], // parsed lines
    };
  },
  watch: {
    modelValue(val) {
      this.dialog = val;
    },
  },
  methods: {
    onSave() {
      // emit both the GUI params and any extras
      const allArgs = [
        ...this.buildFastpArgs(this.params),
        ...this.extraParams
      ];
      this.$emit('update-fastp-params', allArgs);
      this.dialog = false;
    },
    onCancel() {
      this.dialog = false;
    },
    async selectFile(field, type) {
      if (window.electron) {
        try {
          const options = {
            properties: type === "file" ? ["openFile"] : ["openDirectory"],
          };
          const filePaths = await window.electron.openFileDialog(options);
          if (filePaths && filePaths.length > 0) {
            if (!field) {
              return filePaths[0];
            }
            this.params[field] = filePaths[0];
          }
        } catch (error) {
          console.error("Error selecting file:", error); // DEBUG
          this.$emit("trigger-snackbar", `File selection error: ${error}`, "error", "fileAlert", "Dismiss");
        }
      } else {
        console.error("File dialog is not supported in the web environment."); // DEBUG
        this.$emit("trigger-snackbar", "File dialog is not supported in the web environment.", "error", "warning", "Dismiss");
      }
    },
    scrollToEnd(event) {
      // Scroll to the right end of textfield
      const input = event.target;
      input.scrollLeft = input.scrollWidth;
    },
    async loadExtraParamsFile() {
      try {
        const [filePath] = await window.electron.openFileDialog({
          properties: ["openFile"]
        });
        if (!filePath) return;

        this.extraFile = filePath;
        const text = await window.electron.readFile(filePath);

        this.extraParams = text
          .split(/\r?\n/) // split on each line
          .filter(line => line.trim()) // trim whitespace
          .flatMap(line => line.trim().split(/\s+/)); // Now split each line into [flag, value?] and flatten
          console.log(this.extraParams);
        // e.g. ["--disable_quality_filtering", "--qualified_quality_phred", "20", ...]
      } catch (err) {
        console.error("Error loading extra params file:", err);
        this.$emit(
          "trigger-snackbar",
          `Failed to load params: ${err.message}`,
          "error"
        );
      }
    },
    buildFastpArgs(params) {
      // Function for building fastp command line arguments from params object (gui settings)
      return Object.entries(params)
        .flatMap(([key, val]) => {
          const flag = `--${key}`;
          // Boolean flag: only emit when true
          if (typeof val === "boolean") {
            return val ? [flag] : [];
          }
          // Value option: emit when present
          if (val !== null && val !== undefined && val !== "") {
            return [flag, String(val)];
          }
          return [];
        });
    }
  },
};
</script>

<style scoped>
/* target any V-Label inside this component */
::v-deep .v-label {
  /* style settings for text-caption */
  font-size: 0.75rem;
  font-weight: 400;
  line-height: 1.667;
  letter-spacing: 0.0333333333em;
}

.dialog-style .v-card-title{
  color: #3F51B5  ;
}
</style>
