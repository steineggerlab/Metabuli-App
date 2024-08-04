<template>
  <v-dialog v-model="localDialog" max-width="window.innerWidth" scrollable>
    <v-card>
      <!-- Close Dialog Button -->
      <v-card-actions class="py-0">
        <v-btn icon="$close"  color="gray" @click="closeDialog"></v-btn>
      </v-card-actions>

      <v-card-item class="mx-0 pt-0 summary">
        <!-- Taxon Name Title -->
        <v-card-title class="font-weight-black">{{ nodeDetails.data.name }}</v-card-title>
        
        <v-row class="mt-2">
          <!-- Rank Column -->
          <v-col>
            <v-card-subtitle>Rank</v-card-subtitle>
            <v-chip density="compact"  color="primary" label>{{ nodeDetails.data.trueRank }}</v-chip>
          </v-col>

          <!-- Proportion Column -->
          <v-col>
            <v-card-subtitle>Proportion</v-card-subtitle>
            <v-card-text >{{ nodeDetails.data.proportion }}%</v-card-text>
          </v-col>

          <!-- Clade Reads Column -->
          <v-col>
            <v-card-subtitle>Clade Reads</v-card-subtitle>
            <v-card-text>{{ nodeDetails.data.clade_reads }}</v-card-text>
            </v-col>

            <!-- Taxon Reads Column -->
          <v-col>
            <v-card-subtitle>Taxon Reads</v-card-subtitle>
            <v-card-text>{{ nodeDetails.data.taxon_reads }}</v-card-text>
          </v-col>

          <v-spacer></v-spacer>

          <!-- Tax ID Column -->
          <v-col style="text-align: right;">
            <v-card-subtitle>Tax ID</v-card-subtitle>
            <v-card-text>{{ nodeDetails.data.taxon_id }}</v-card-text>
          </v-col>

          <v-col class="d-flex flex-column justify-start">
            <v-btn
          color="primary"
          append-icon="$openInNew"
          text="NCBI"
          class="button-text-right text-none"
          size="small"
          variant="text"
          :href="`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${nodeDetails.data.taxon_id}`"
          target="_blank"
        ></v-btn>
        <v-btn
          color="primary"
          append-icon="$openInNew"
          text="Assemblies"
          class="button-text-right text-none"
          size="small"
          variant="text"
           :href="`https://www.ncbi.nlm.nih.gov/assembly/?term=txid${nodeDetails.data.taxon_id}[Organism:exp]`"
              target="_blank"
        ></v-btn>
          </v-col>
        </v-row>
      </v-card-item>
      
      <v-divider></v-divider>

      <!-- Full Lineage & Subtree Sankey -->
      <v-card-item>
          <v-card-subtitle class="opacity-100 font-weight-bold">Full Lineage</v-card-subtitle>
          <v-card-text class="px-0 py-0">
            {{
              nodeDetails.data.lineage
                .map((n) => `${n.name} (${n.rank})`)
                .join(" > ")
            }}
          </v-card-text>
          
          <!-- NODE SUBTREE SANKEY DIAGRAM -->
          <SankeyNodeDialogDiagram
            :data="nodeDetails.subtreeData"
            :instanceId="uniqueInstanceId"
          />
      </v-card-item>
    </v-card>
  </v-dialog>
</template>

<script>
import SankeyNodeDialogDiagram from "./SankeyNodeDialogDiagram.vue";
import { v4 as uuidv4 } from "uuid";

export default {
  name: "SankeyNodeDialog",
  components: {
    SankeyNodeDialogDiagram,
  },
  props: {
    nodeDetails: Object,
    dialog: Boolean,
  },
  data() {
    return {
      localDialog: this.dialog,
      uniqueInstanceId: "",
    };
  },
  watch: {
    dialog(newVal) {
      this.localDialog = newVal;
    },
    localDialog(newVal) {
      if (!newVal) {
        this.$emit("close-dialog");
      }
    },
  },
  methods: {
    closeDialog() {
      this.localDialog = false;
    },
  },
  mounted() {
    this.uniqueInstanceId = uuidv4();
  },
};
</script>

<style scoped>
/* Node Summary */
.summary .v-card-subtitle {
  margin-bottom: 8px;
}
.summary .v-card-text {
  padding-top: 3px;
  padding-inline: 0px;
  font-weight: 500;
}
.button-text-right {
  justify-content: flex-end !important;
}
</style>
