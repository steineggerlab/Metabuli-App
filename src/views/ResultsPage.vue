<template>
  <v-card class="d-flex flex-column flex-shrink-1 h-100">
    <v-tabs v-model="tab" color="primary">
      <v-tab value="table">Table</v-tab>
      <v-tab value="sankey">Sankey</v-tab>
      <v-tab value="krona" v-if="kronaContent">Krona</v-tab>
    </v-tabs>

    <v-card-text class="d-flex flex-column h-100 pb-0">
      <v-tabs-window v-model="tab" class="h-100">
        <!-- NODE DETAILS DIALOG (SHARED BY TABLE & SANKEY) -->
        <SankeyNodeDialog
          v-if="dialogData"
          v-model="isDialogVisible"
          :nodeDetails="dialogData"
          :configureMenuSettings="sankeyConfigurationSettings"
          @close-dialog="hideDialog"
          class="align-top"
        />

        <!-- TABLE TAB -->
        <v-tabs-window-item value="table" class="h-100">
          <ResultsTable
            :data="results"
            :isSample="isSample"
            class="h-100"
            @row-click="handleRowClick"
          />
        </v-tabs-window-item>

        <!-- SANKEY TAB-->
        <v-tabs-window-item value="sankey" class="h-100">
          <!-- TOOLBAR ABOVE SANKEY DIAGRAM -->
          <div class="d-flex justify-space-around my-5 mx-2 gc-1">
            <!-- SEARCH BAR -->
            <div class="d-flex flex-column">
              <v-text-field
                v-model="searchQuery"
                prepend-inner-icon="$magnify"
                density="compact"
                label="Search Name or Taxon ID"
                variant="outlined"
                rounded="lg"
                single-line
                color="indigo"
                clearable
              ></v-text-field>
              <div class="d-flex align-center">
                Click on a node to see lineage and subtree.
              </div>
            </div>

            <!-- BUTTON TO OPEN ISSUE WHEN SANKEY VERIFICATION FAILS -->
            <v-tooltip location="end">
              <template #activator="{ props }">
                <v-btn
                  v-if="!taxonomyVerification"
                  v-bind="props"
                  icon="$alert"
                  color="amber-darken-2"
                  variant="text"
                  rounded="xl"
                  class="ml-2"
                  @click="openGithubIssue"
                ></v-btn>
              </template>
              Taxonomy report mismatch detected. Notify the developer!
            </v-tooltip>

            <v-spacer></v-spacer>

            <!-- SANKEY DOWNLOAD MENU -->
            <SankeyDownloadMenu
              :menuLocation="'bottom center'"
              @format-selected="downloadFullSankey"
            >
              <template v-slot:activator="{ props }">
                <v-btn
                  v-bind="props"
                  append-icon="$download"
                  variant="text"
                  rounded
                >
                  Download
                </v-btn>
              </template>
            </SankeyDownloadMenu>

            <!-- CONFIGURE SANKEY MENU -->
            <ConfigureSankeyMenu
              :maxTaxaLimit="roundedMaxTaxaLimit"
              :menuLocation="'bottom end'"
              v-model:color-scheme="colorScheme"
              v-model:show-all="showAll"
              v-model:min-clade-reads-mode="minCladeReadsMode"
              v-model:min-clade-reads="minCladeReads"
              v-model:taxa-limit="taxaLimit"
              v-model:figure-height="figureHeight"
              v-model:label-option="labelOption"
              v-model:margin-bottom="marginBottom"
              v-model:margin-right="marginRight"
              v-model:node-width="nodeWidth"
              v-model:node-padding="nodePadding"
              v-model:node-label-font-size="nodeLabelFontSize"
              v-model:node-value-font-size="nodeValueFontSize"
              v-model:rank-label-font-size="rankLabelFontSize"
              v-model:selectedRanks="ranksToShow"
            >
              <template v-slot:activator="{ props }">
                <v-btn color="indigo" rounded="xl" v-bind="props"
                  >Configure Diagram</v-btn
                >
              </template>
            </ConfigureSankeyMenu>
          </div>

          <!-- SANKEY DIAGRAM -->
          <TaxoView
            v-if="originalData"
            :rawData="originalData"
            :colorScheme="colorScheme"
            :taxaLimit="taxaLimit"
            :minThresholdMode="minCladeReadsMode"
            :minThreshold="minCladeReads"
            :figureHeight="figureHeight"
            :labelOption="labelOption === 'proportion' ? 1 : 0"
            :showAll="showAll"
            :searchQuery="searchQuery"
            :marginBottom="marginBottom"
            :marginRight="marginRight"
            :nodeWidth="nodeWidth"
            :nodePadding="nodePadding"
            :nodeLabelFontSize="nodeLabelFontSize"
            :nodeValueFontSize="nodeValueFontSize"
            :rankLabelFontSize="rankLabelFontSize"
            ref="taxoview"
            @node-clicked="handleNodeClick"
            :ranksToShow="ranksToShow"
          />
        </v-tabs-window-item>

        <!-- KRONA TAB -->
        <v-tabs-window-item value="krona" class="h-100">
          <div class="pa-4 tab-fill-height" style="overflow-y: hidden">
            <iframe
              :srcdoc="kronaContent"
              style="width: 100%; height: 100%; border: none"
            ></iframe>
          </div>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
  </v-card>
</template>

<script>
import ResultsTable from "@/components/results-page/ResultsTable.vue";
import ConfigureSankeyMenu from "@/components/results-page/ConfigureSankeyMenu.vue";
import SankeyDownloadMenu from "@/components/results-page/SankeyDownloadMenu.vue";
import SankeyNodeDialog from "@/components/results-page/SankeyNodeDialog.vue";
import { v4 as uuidv4 } from "uuid";
import { sankeyRankColumns } from "@/plugins/rankUtils";
import {
  extractTaxonomyArray,
  compareTSVContents,
} from "@/plugins/sankeyUtils";
import { exportSankeyDiagram } from "@/plugins/downloadUtils";

// TODO: import these from TaxoView component
// e.g. import TaxoView, { isRootNode, isUnclassifiedNode, parseData } from "taxoview"
function isRootNode(node) {
  return parseInt(node.taxon_id) === 1;
}
function isUnclassifiedNode(node) {
  return parseInt(node.taxon_id) === 0;
}
function parseData(data) {
  const nodes = [];
  const nodesByRank = {};
  const nodesByDepth = {};

  let currentLineage = [];
  let rootNode = null;
  let unclassifiedNode = null;

  // Step 1: Create nodes and save lineage data for all nodes
  data.forEach((d) => {
    let node = {
      id: d.taxon_id,
      taxon_id: d.taxon_id,
      name: d.name,
      nameWithIndentation: d.nameWithIndentation,
      rank: d.rank,
      rankDisplayName: d.rank,
      hierarchy: parseInt(d.depth),
      proportion: parseFloat(d.proportion),
      clade_reads: parseInt(d.clade_reads),
      taxon_reads: d.taxon_reads,
      lineage: null,
      isUnclassifiedNode: false,
      children: [], // FIXME: change to null?
    };

    // Add node to its corresponding depth collection
    if (!Object.keys(nodesByDepth).map(Number).includes(node.hierarchy)) {
      nodesByDepth[node.hierarchy] = [];
    }
    nodesByDepth[node.hierarchy].push(node);

    // Add node to its corresponding rank collection
    // Consider root node and unclassified node separately
    if (sankeyRankColumns.includes(d.rank)) {
      if (!nodesByRank[d.rank]) {
        nodesByRank[d.rank] = [];
      }
      nodesByRank[d.rank].push(node);
    } else if (isUnclassifiedNode(node)) {
      // FIXME: figure out which rank to put unclassified node in
      if (!nodesByRank["no rank"]) {
        nodesByRank["no rank"] = [];
      }
      // nodesByRank["root"].push(node); // FIXME: overlapping issue with root node when i put this in

      // Reassign some attributes specific to unclassified node
      node.rank = "no rank";
      node.rankDisplayName = node.name;
      node.isUnclassifiedNode = true;

      unclassifiedNode = node;
    } else if (isRootNode(node)) {
      if (!nodesByRank["no rank"]) {
        nodesByRank["no rank"] = [];
      }
      nodesByRank["no rank"].push(node);

      // Reassign some attributes specific to root node
      node.rank = "no rank"; // FIXME: remove this after fixing logic to leave it as "no rank", same as taxonomyreport
      node.rankDisplayName = node.name;

      rootNode = node;
      nodes.push(rootNode);
    }

    // Store lineage for each node
    let lastLineageNode = currentLineage[currentLineage.length - 1];
    if (lastLineageNode) {
      let currentDepth = node.hierarchy;
      let lastDepth = lastLineageNode.hierarchy;

      while (lastLineageNode && currentDepth <= lastDepth) {
        currentLineage.pop();

        lastLineageNode = currentLineage[currentLineage.length - 1];
        if (!lastLineageNode) {
          break; // Exit the loop if no more nodes in the lineage (i.e. traced back to root node)
        }

        lastDepth = lastLineageNode.hierarchy; // Update lastRank for the next iteration comparison
      }
    }
    // Append current node to currentLineage array + store lineage data
    currentLineage.push(node);
    node.lineage = [...currentLineage];

    // Store current node to parent's children collection (for sankey verification taxonomyreport regeneration)
    const parent = node.lineage[node.lineage.length - 2];
    if (parent) {
      parent.children.push(node);
    }
  });

  // Step 2: Store all nodes and store rank-filtered nodes separately
  sankeyRankColumns.forEach((rank) => {
    if (nodesByRank[rank]) {
      // Store all nodes
      nodes.push(...nodesByRank[rank]);
    }
  });

  // Step 4: Create node for Unclassified Sequences linked to the root node
  if (unclassifiedNode && rootNode) {
    // FIXME: remove rootNode if unneeded
    // Add to selected and all nodes (always present, excluded from taxa limit)
    nodes.push(unclassifiedNode);
    // Add link from root node to unclassified node
    // selectedLinks.push({
    // 	sourceName: rootNode.name,
    // 	source: rootNode.id,
    // 	targetName: unclassifiedNode.name,
    // 	target: unclassifiedNode.id,
    // 	value: totalUnclassifiedCladeReads,
    // });
    // allLinks.push({
    // 	sourceName: rootNode.name,
    // 	source: rootNode.id,
    // 	targetName: unclassifiedNode.name,
    // 	target: unclassifiedNode.id,
    // 	value: totalUnclassifiedCladeReads,
    // });
    // }
  }
  return { nodes, nodesByDepth };
}

export default {
  name: "ResultsPage",
  components: {
    ResultsTable,
    SankeyDownloadMenu,
    ConfigureSankeyMenu,
    SankeyNodeDialog,
  },

  data() {
    return {
      // Overall
      tab: "TABLE",
      results: [],
      kronaContent: null,
      isSample: null,
      taxonomyVerification: null,

      // Sankey Diagram
      uniqueInstanceId: "",
      maxTaxaLimit: 100,

      showAll: false,
      taxaLimit: 10, // FIXME: refactor, make this into dictionary storing info about configuration
      minCladeReadsMode: 1,
      minCladeReads: 0.01,
      figureHeight: 500,
      labelOption: "proportion",

      marginBottom: 50, // Margin for rank labels
      marginRight: 150,
      nodeWidth: 20,
      nodePadding: 13,
      nodeLabelFontSize: 10,
      nodeValueFontSize: 10,
      rankLabelFontSize: 14,
      // superkingdom --> domain
      // rankList: sankeyRankColumns,
      // rankListWithRoot: [ "no rank", ...sankeyRankColumns ],
      ranksToShow: ["no rank", ...sankeyRankColumns],
      colorScheme: [
        "#C14C32", // dark red
        "#506432", // dark green
        "#FFCD73", // yellow
        "#6C3400", // light brown
      ],
      unclassifiedLabelColor: "#696B7E",

      searchQuery: "",
      searchQueryMatchNodes: new Set(),

      // Sankey Node Dialog
      isDialogVisible: false,
      dialogData: null,

      // Data for sankey in dialog
      nodes: [],
      nodesByDepth: {},

      originalData: "",
    };
  },

  watch: {
    results: {
      immediate: true,
      async handler(newResults) {
        /* 1 ▸ skip empty or placeholder objects/arrays */
        if (
          !newResults || // null / undefined
          (Array.isArray(newResults) && newResults.length === 0) ||
          (typeof newResults === "object" &&
            Object.keys(newResults).length === 0)
        ) {
          return; // bail out – nothing to verify yet
        }
        /* 1. Regular rendering work (already non-blocking) */
        const { nodes, nodesByDepth } = parseData(newResults);
        this.nodes = nodes;
        this.nodesByDepth = nodesByDepth;

        /* 2. Kick off background verification  */

        /* 2-A.  Get original TSV text in the renderer (asynchronously) */
        const originalReportFilePath = sessionStorage.getItem("reportFilePath");
        if (!originalReportFilePath) {
          console.warn("⚠️ No original report file → verification skipped");
          this.taxonomyVerification = null;
          return;
        }
        const originalReportContent = await window.electron.readFile(
          originalReportFilePath,
        );

        /* 2-B.  Launch worker (⚡ zero UI blocking) */
        const worker = new Worker(
          new URL("@/workers/verify-sankey.worker.js", import.meta.url),
          { type: "module" },
        );

        worker.onmessage = ({ data }) => {
          const res = data.result; // true / false / null
          this.taxonomyVerification = res;

          if (res === true)
            console.log("🟩 Taxonomy verification passed", nodesByDepth);
          else if (res === false)
            console.log("🟥 Taxonomy verification failed", nodesByDepth);
          else console.warn("⚠️ Verification skipped");

          worker.terminate(); // tidy-up
        };

        /*  Send only the data the worker needs  */
        worker.postMessage({
          originalReportContent,
          nodesByDepth,
        });
      },
    },
  },

  computed: {
    roundedMaxTaxaLimit() {
      // Round up maxTaxaLimit to the nearest increment of 5
      return Math.ceil(this.maxTaxaLimit / 5) * 5;
    },
    sankeyConfigurationSettings() {
      // Automatically recalculates when any fields change
      const settings = {
        showAll: this.showAll,
        taxaLimit: this.taxaLimit,
        minCladeReadsMode: this.minCladeReadsMode,
        minCladeReads: this.minCladeReads,
        figureHeight: this.figureHeight,
        labelOption: this.labelOption,
        colorScheme: this.colorScheme,
      };
      return settings;
    },
  },

  methods: {
    handleNodeClick(data) {
      if (!data) return;
      const taxId = data.taxon_id || data.id;
      const nodeData = this.lookupTaxonNode(taxId);
      this.showDialog(nodeData);
    },
    // TODO: if TaxoView accepts a data object this shouldn't be necessary
    // addRoot currently needed to get past TSVParser
    generateTsvReport(array, addRoot = false) {
      const properties = [
        "proportion",
        "clade_reads",
        "taxon_reads",
        "rank",
        "taxon_id",
        "nameWithIndentation",
      ];
      let rows = array;
      rows.forEach((row) => {
        if (row.rank === "superkingdom") row.rank = "domain";
      });
      if (addRoot) {
        let root = {
          rank: "no rank",
          taxon_id: "0",
          name: "unclassified",
          nameWithIndentation: "unclassified",
          proportion: "0",
          clade_reads: "0",
          taxon_reads: "0",
        };
        let root2 = Object.assign({}, array[0], {
          rank: "no rank",
          taxon_id: "1",
          name: "root",
          nameWithIndentation: "root",
        });
        rows = [root, root2, ...array];
      }
      return rows
        .map((node) =>
          properties
            .map((property) =>
              node[property] !== undefined && node[property] !== null
                ? node[property]
                : "",
            )
            .join("\t"),
        )
        .join("\n");
    },
    // Functions handling Details Dialog (shared between Table and Sankey tab)
    // Data processing functions for Subtree Sankey
    extractSubtreeRawData(selectedNode) {
      // Used only when isSubtree === false
      let startIdx = -1;
      let endIdx = -1;
      let startedAdding = false;
      const selectedNodeHierarchy = selectedNode.hierarchy;

      for (let i = 0; i < this.results.length; i++) {
        const comparingNode = this.results[i];
        if (comparingNode.taxon_id === selectedNode.taxon_id) {
          // Found the selected node; mark the start of the subtree
          startIdx = i;
          startedAdding = true;
          continue; // Move to the next iteration
        }

        if (startedAdding) {
          const comparingNodeDepth = comparingNode.depth;
          if (comparingNodeDepth > selectedNodeHierarchy) {
            endIdx = i;
          } else {
            // Stop when we encounter a node at the same or higher rank
            break;
          }
        }
      }

      const subtreeRawData = this.results.slice(startIdx, endIdx + 1);
      return subtreeRawData;
    },
    lookupTaxonNode(taxon_id) {
      const node = this.nodes.find((node) => node.taxon_id === taxon_id);
      const nodeData = {
        proportion: node.proportion,
        clade_reads: node.clade_reads,
        taxon_reads: node.taxon_reads,
        taxon_id: node.taxon_id,
        name: node.name,
        rank: node.rank,
        hierarchy: node.hierarchy,
        lineage: node.lineage,
      };
      return nodeData;
    },
    // // Event handling to show/hide Details Dialog
    handleRowClick(rowData) {
      const nodeData = this.lookupTaxonNode(rowData.taxon_id);
      this.showDialog(nodeData);
    },
    showDialog({
      proportion,
      clade_reads,
      taxon_reads,
      taxon_id,
      name,
      rank,
      hierarchy,
      lineage,
    } = {}) {
      // if (proportion === undefined || clade_reads === undefined || taxon_id === undefined || rank === undefined || hierarchy === undefined ) {
      // 	throw new Error("Missing required properties: proportion, clade_reads, or taxon_id");
      // }
      const nodeData = {
        proportion,
        clade_reads,
        taxon_reads,
        taxon_id,
        name,
        rank,
        hierarchy,
        lineage,
      };
      const subtreeRawData = this.extractSubtreeRawData(nodeData); // Extract subtree raw data for clicked node
      const rankList = subtreeRawData
        .map((row) => (row.rank === "superkingdom" ? "domain" : row.rank))
        .filter(
          (v, i, a) =>
            a.indexOf(v) === i && v !== "no rank" && !v.startsWith("sub"),
        );
      const subtreeRawTsv = this.generateTsvReport(subtreeRawData, true);
      const hasSourceLinks = subtreeRawData.length > 1 ? true : false; // Determine if the subtree has more than 1 node
      this.dialogData = {
        type: "node",
        data: nodeData,
        subtreeData: subtreeRawData,
        subtreeDataTsv: subtreeRawTsv,
        hasSourceLinks: hasSourceLinks,
        rankList: rankList,
      };
      this.isDialogVisible = true;
    },
    hideDialog() {
      this.isDialogVisible = false;
    },

    // Sankey Verification
    async verifySankey() {
      // Compare original taxonomy report and regenerated taxonomy report
      const originalReportFilePath = sessionStorage.getItem("reportFilePath");
      if (!originalReportFilePath) {
        console.warn(
          "Original report file path not found. Skipping TSV comparison.",
        );
        return null; // Return `null` when file not found
      }

      const extractedTaxonomyArray = extractTaxonomyArray(this.nodesByDepth);

      const properties = [
        "proportion",
        "clade_reads",
        "taxon_reads",
        "rank",
        "taxon_id",
        "nameWithIndentation",
      ];

      // Regenerate taxonomy report from the sankey data
      const regeneratedReport = extractedTaxonomyArray
        .map((node) =>
          properties
            .map((property) =>
              node[property] !== undefined && node[property] !== null
                ? node[property]
                : "",
            )
            .join("\t"),
        )
        .join("\n");

      const compareSuccessful = await compareTSVContents(
        regeneratedReport,
        originalReportFilePath,
      );
      return compareSuccessful; // return true or false depending on verification result
    },
    openGithubIssue() {
      const title = encodeURIComponent(
        "Original Taxonomy Report Misalignment with Reverse-Generated Report",
      );
      const body = encodeURIComponent(
        `> To help us investigate the issue, please share your 'report.tsv' file using one of the following methods:
>
>1. **File Sharing Service**:
>   Upload your 'report.tsv' file to a trusted file-sharing platform like Google Drive or Dropbox. Ensure the link is accessible to us, and include the link in this issue.
>
>2. **Email Submission**:
>   Alternatively, you can email the 'report.tsv' file to [snjlee58@snu.ac.kr]. Please include the issue number in the email subject (e.g., "Metabuli App Issue #123: Report File").
>
>This will help us review and resolve the issue more effectively. Let us know if you have any questions!`,
      );

      const url = `https://github.com/steineggerlab/Metabuli-App/issues/new?title=${title}&body=${body}`;
      window.open(url, "_blank");
    },
    // Sankey Download Functions
    downloadFullSankey(downloadDetails) {
      const { format, filename } = downloadDetails;
      const svg = this.$refs["taxoview"].$el.querySelector("svg");
      exportSankeyDiagram({ sankeySvgElement: svg, format, filename });
    },

    updateConfigureMenu(sankeyData) {
      this.maxTaxaLimit = sankeyData.maxTaxaPerRank;
    },

    // Function for rendering results
    renderResults(processedResults) {
      // Logic to render the table and Sankey diagram using the passed data
      this.results = processedResults.resultsJSON;
      this.kronaContent = processedResults.kronaContent;
    },
  },

  async mounted() {
    // Runs when results tab is clicked
    // Generate unique instance ID for Sankey
    this.uniqueInstanceId = uuidv4();

    try {
      // Retrieve and parse completedJob from local storage
      const processedResults = JSON.parse(
        localStorage.getItem("processedResults"),
      );
      if (processedResults) {
        this.renderResults(processedResults);
        this.isSample = processedResults.isSample;
      }

      const originalReportFilePath = sessionStorage.getItem("reportFilePath");
      const originalReportContent = await window.electron.readFile(
        originalReportFilePath,
      );
      this.originalData = originalReportContent;
    } catch (error) {
      console.error("Error loading results:", error);
    }
  },
};
</script>

<style>
.tab-fill-height {
  height: 75vh;
  overflow-y: auto;
  /* Enable vertical scrolling */
  overflow-x: auto;
  /* Hide horizontal overflow */
}
</style>
