<template>
  <v-card>
    <v-tabs v-model="tab">
      <v-tab value="table">Table</v-tab>
      <v-tab value="sankey">Sankey</v-tab>
      <v-tab value="krona" v-if="kronaContent">Krona</v-tab>
    </v-tabs>

    <v-card-text>
      <v-tabs-window v-model="tab">
        <!-- TABLE TAB -->
        <v-tabs-window-item value="table">
          <ResultsTable :data="results" />
        </v-tabs-window-item>

        <!-- SANKEY TAB-->
        <v-tabs-window-item value="sankey" class="tab-fill-height">
          <!-- TOOLBAR ABOVE SANKEY DIAGRAM -->
          <div class="d-flex justify-space-around my-5 ml-2 mr-10 gc-1">
            <div class="d-flex align-center">
              Click on a node to see lineage and subtree.
            </div>

            <v-spacer></v-spacer>

            <SankeyDownloadMenu @format-selected="handleFormatSelected" />

            <ConfigureSankeyMenu
              :initialTaxaLimit="taxaLimit"
              :initialMinCladeReadsMode="cladeMinReadsMode"
              :initialMinCladeReads="minCladeReads"
              :initialShowUnclassified="showUnclassified"
              :initialFigureHeight="figureHeight"
              :initialLabelOption="labelOption"
              @updateSettings="updateSettings"
            />
          </div>

          <!-- SANKEY DIAGRAM -->
            <SankeyDiagram
              :data="results"
              :taxaLimit="taxaLimit"
              :minReads="minCladeReads"
              :showUnclassified="showUnclassified"
              :figureHeight="figureHeight"
              :labelOption="labelOption"
            />
        </v-tabs-window-item>

        <!-- KRONA TAB -->
        <v-tabs-window-item value="krona" class="tab-fill-height">
          <iframe
            :srcdoc="kronaContent"
            style="width: 100%; height: 100%; border: none"
          ></iframe>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
  </v-card>
</template>

<script>
import SankeyDiagram from "@/components/SankeyDiagram.vue";
import ResultsTable from "@/components/ResultsTable.vue";
import ConfigureSankeyMenu from "@/components/ConfigureSankeyMenu.vue";
import SankeyDownloadMenu from "@/components/SankeyDownloadMenu.vue";
import { saveSvgAsPng } from "save-svg-as-png";
import * as d3 from "d3";

export default {
  name: "ResultsPage",
  components: {
    ResultsTable,
    SankeyDiagram,
    SankeyDownloadMenu,
    ConfigureSankeyMenu,
  },
  data() {
    return {
      results: [],
      tab: "TABLE",
      kronaContent: null,
      isSample: null,
      taxaLimit: 15,
      cladeMinReadsMode: "%",
      minCladeReads: 1,
      showUnclassified: true,
      figureHeight: 500,
      labelOption: "cladeReads",
    };
  },
  methods: {
    async renderKronaViewer(filePath) {
      if (!filePath) {
        // FIXME: render empty state screen or hide krona tab
        this.kronaContent = null;
        return;
      }
      try {
        const kronaHtml = await window.electron.readFile(
          filePath,
          this.isSample
        ); //FIXME: too messy, edit readFile preload function
        this.kronaContent = kronaHtml;
      } catch (error) {
        console.error("Error opening Krona viewer:", error);
      }
    },
    async readTSVFile(filePath) {
      try {
        const tsvContent = await window.electron.readFile(
          filePath,
          this.isSample
        ); //FIXME: edit readFile preload function
        const json = this.tsvToJSON(tsvContent);
        return json.results;
      } catch (error) {
        console.error("Error reading TSV file:", error);
      }
    },
    tsvToJSON(tsv) {
      const headers = [
        "proportion",
        "clade_reads",
        "taxon_reads",
        "rank",
        "taxon_id",
        "name",
      ];
      const records = tsv
        .split("\n")
        .map((line) => {
          const data = line.split("\t").map((item) => item.trim()); // Strip leading and trailing whitespace
          return Object.fromEntries(
            headers.map((header, index) => [header, data[index]])
          );
        })
        .filter(
          (record) =>
            !Object.values(record).every(
              (field) => field === "" || field === undefined || field === null
            )
        ); // Filter out empty rows

      return { results: records };
    },
    saveResults() {
      sessionStorage.setItem("results", JSON.stringify(this.results)); // Save to session storage
    },
    updateSettings(settings) {
      this.taxaLimit = settings.taxaLimit;
      this.minCladeReads = settings.minCladeReads;
      this.showUnclassified = settings.showUnclassified;
      this.figureHeight = settings.figureHeight;
      this.labelOption = settings.labelOption;
    },
    handleFormatSelected(format) {
      switch (format) {
        case "png":
          this.downloadSankeyAsPng();
          break;
        case "jpg":
          this.downloadSankeyAsJpg();
          break;
        case "html":
          this.downloadSankeyAsHtml();
          break;
        default:
          return;
      }
    },
    downloadSankeyAsPng() {
      const sankeySvgElement = document.querySelector("#sankey-svg"); // Reference to the SVG ID
      saveSvgAsPng(sankeySvgElement, "sankey-diagram.png");
    },
    async downloadSankeyAsJpg() {
      // Get the SVG element
      const sankeySvgElement = document.querySelector("#sankey-svg"); // Reference to the SVG ID
      const svg = d3.select(sankeySvgElement);
      const svgString = new XMLSerializer().serializeToString(svg.node());

      // Set canvas size to match the SVG size
      const svgBBox = svg.node().getBBox();
      const width = svgBBox.width;
      const height = svgBBox.height;

      // Create a canvas element with increased resolution
      const scaleFactor = 3;
      const canvas = document.createElement("canvas");
      canvas.width = width * scaleFactor;
      canvas.height = height * scaleFactor;

      const context = canvas.getContext("2d");
      context.scale(scaleFactor, scaleFactor);

      // Draw white background
      context.fillStyle = "white";
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Create an image and draw the SVG onto the canvas
      const img = new Image();
      img.onload = () => {
        context.drawImage(img, 0, 0);

        // Convert the canvas to a data URL (base64)
        const jpgDataUrl = canvas.toDataURL("image/jpeg", 1.0); // Quality parameter set to maximum (1.0)

        // Create a download link and click it
        const link = document.createElement("a");
        link.href = jpgDataUrl;
        link.download = "sankey_diagram.jpg";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.src =
        "data:image/svg+xml;base64," +
        btoa(unescape(encodeURIComponent(svgString)));
    },
    downloadSankeyAsHtml() {
      const svgElement = document.querySelector("#sankey-svg"); // Correctly reference the SVG ID
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8",
      });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sankey-diagram.html";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
  },

  async mounted() {
    // Runs when results tab is clicked
    try {
      let reportFilePath;
      let kronaFilePath;

      if (this.$route.query.jobType === "runSearch") {
        // Resolve outdir path
        let resolvedOutdirPath;
        if (this.$route.query.isSample === "true") {
          resolvedOutdirPath = window.electron.resolvePath(
            this.$route.query.outdir
          );
          this.isSample = true;
        } else {
          resolvedOutdirPath = this.$route.query.outdir;
          this.isSample = false;
        }

        // Set file paths for report and krona
        reportFilePath = `${resolvedOutdirPath}/${this.$route.query.jobid}_report.tsv`;
        kronaFilePath = `${resolvedOutdirPath}/${this.$route.query.jobid}_krona.html`;
      } else if (this.$route.query.jobType === "uploadReport") {
        // Set file path for report directly
        reportFilePath = this.$route.query.reportFilePath;
        kronaFilePath = null;
        this.isSample = false;
      }

      // Render report.tsv
      const resultsJSON = await this.readTSVFile(`${reportFilePath}`);
      this.results = resultsJSON;
      this.saveResults(); // FIXME: figure this out

      // Render Krona
      this.renderKronaViewer(kronaFilePath);
    } catch (error) {
      console.error("Error loading results:", error);
    }
  },
};
</script>

<style>
.sankey-slider {
  padding-top: 20px;
}
.tab-fill-height {
  height: 650px; /* Adjust according to your header/footer height */
  overflow-y: auto; /* Enable vertical scrolling */
  overflow-x: hidden; /* Hide horizontal overflow */
}
</style>
