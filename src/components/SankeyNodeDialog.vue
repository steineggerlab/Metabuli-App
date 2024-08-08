<template>
  <v-dialog height="100%" max-width="window.innerWidth" scrollable>
    <v-card>
      <!-- Close Dialog Button -->
      <v-card-actions class="py-0">
        <v-btn
          rounded="xl"
          icon="$close"
          color="gray"
          @click="$emit('close-dialog')"
        ></v-btn>
      </v-card-actions>

      <v-card-item class="mx-0 pt-0 summary">
        <!-- Taxon Name Title -->
        <v-card-title class="font-weight-black">{{
          nodeDetails.data.name
        }}</v-card-title>

        <v-row class="mt-2">
          <!-- Rank Column -->
          <v-col>
            <v-card-subtitle>Rank</v-card-subtitle>
            <v-chip density="compact" color="primary font-weight-bold" label>{{
              nodeDetails.data.trueRank
            }}</v-chip>
          </v-col>

          <!-- Proportion Column -->
          <v-col>
            <v-card-subtitle>Proportion</v-card-subtitle>
            <v-card-text>{{ nodeDetails.data.proportion }}%</v-card-text>
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
          <v-col style="text-align: right">
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
      <v-card-item class="pb-0">
        <v-card-subtitle class="opacity-100 font-weight-bold"
          >Full Lineage</v-card-subtitle
        >
        <v-card-text class="px-0 py-0 mb-4">
          {{
            nodeDetails.data.lineage
              .map((n) => `${n.name} (${n.rank})`)
              .join(" > ")
          }}
        </v-card-text>

        <!-- NODE SUBTREE SANKEY DIAGRAM -->
        <SankeyDiagram
          :id="sankeyId"
          :isSubtree="true"
          :instanceId="uniqueInstanceId"
          :rawData="nodeDetails.subtreeData"
          :taxaLimit="configureMenuSettings.taxaLimit"
          :minCladeReadsMode="configureMenuSettings.minCladeReadsMode"
          :minReads="configureMenuSettings.minCladeReads"
          :showUnclassified="configureMenuSettings.showUnclassified"
          :figureHeight="configureMenuSettings.figureHeight"
          :labelOption="configureMenuSettings.labelOption"
          :showAll="configureMenuSettings.showAll"
          @updateConfigureMenu="updateConfigureMenu"
        />
      </v-card-item>

      <!-- Floating Action Button -->
      <div
        v-if="nodeDetails.hasSourceLinks"
        class="fab-container d-flex align-center gc-1 mb-6"
      >
        <SankeyDownloadMenu
          :menuLocation="'top end'"
          @format-selected="emitSubtreeDownloadFormat"
        >
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="$download"
              size="x-small"
              rounded="circle"
            >
            </v-btn>
          </template>
        </SankeyDownloadMenu>

        <ConfigureSankeyMenu
          :initialTaxaLimit="configureMenuSettings.taxaLimit"
          :maxTaxaLimit="configureMenuSettings.maxTaxaLimit"
          :initialMinCladeReadsMode="configureMenuSettings.minCladeReadsMode"
          :initialMinCladeReads="configureMenuSettings.minCladeReads"
          :initialShowUnclassified="configureMenuSettings.showUnclassified"
          :initialFigureHeight="configureMenuSettings.figureHeight"
          :initialLabelOption="configureMenuSettings.labelOption"
          :menuLocation="'top end'"
          @updateSettings="updateSettings"
        >
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              extended
              color="indigo"
              text="Configure"
              prepend-icon="$edit"
              rounded
            >
            </v-btn>
          </template>
        </ConfigureSankeyMenu>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import SankeyDiagram from "@/components/SankeyDiagram.vue";
import SankeyDownloadMenu from "@/components/SankeyDownloadMenu.vue";
import ConfigureSankeyMenu from "@/components/ConfigureSankeyMenu.vue";
import { v4 as uuidv4 } from "uuid";

export default {
  name: "SankeyNodeDialog",
  components: {
    SankeyDiagram,
    SankeyDownloadMenu,
    ConfigureSankeyMenu,
  },
  props: {
    nodeDetails: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      sankeyId: "subtree-sankey-svg",
      uniqueInstanceId: "",

      configureMenuSettings: {
        taxaLimit: 20,
        maxTaxaLimit: 100,
        minCladeReadsMode: "#",
        minCladeReads: 1,
        showUnclassified: true,
        figureHeight: 500,
        labelOption: "cladeReads",
        showAll: false,
      },
    };
  },
  computed: {
    roundedMaxTaxaLimit() {
      // Round up maxTaxaLimit to the nearest increment of 5
      return Math.ceil(this.configureMenuSettings.maxTaxaLimit / 5) * 5;
      // return Math.ceil(this.maxTaxaLimit / 5) * 5;
    },
  },
  methods: {
    // Configuration Menu
    updateConfigureMenu(sankeyData) {
      if (sankeyData) {
        this.configureMenuSettings.maxTaxaLimit =
          Math.ceil(sankeyData.maxTaxaPerRank / 5) * 5;
      }
    },

    // Sankey Diagram
    updateSettings(settings) {
      this.configureMenuSettings.showAll = settings.showAll;
      if (settings.showAll) {
        this.configureMenuSettings.taxaLimit =
          this.configureMenuSettings.maxTaxaLimit;
        this.configureMenuSettings.minCladeReadsMode = "#";
        this.configureMenuSettings.minCladeReads = 0;
        this.configureMenuSettings.showUnclassified = true;
      } else {
        this.configureMenuSettings.taxaLimit = settings.taxaLimit;
        this.configureMenuSettings.minCladeReadsMode =
          settings.minCladeReadsMode;
        this.configureMenuSettings.minCladeReads = settings.minCladeReads;
        this.configureMenuSettings.showUnclassified = settings.showUnclassified;
      }

      this.configureMenuSettings.figureHeight = settings.figureHeight;
      this.configureMenuSettings.labelOption = settings.labelOption;
    },

    // Sankey Download Functions
    emitSubtreeDownloadFormat(format) {
      this.$emit("download-sankey", { sankeyId: this.sankeyId, format });
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

/* Floating Action Button Container */
.fab-container {
  position: fixed;
  bottom: 16px;
  right: 30px;
}
</style>
