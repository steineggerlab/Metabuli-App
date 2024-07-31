<template>
  <v-card>
    <v-tabs v-model="tab">
      <v-tab value="table">Table</v-tab>
      <v-tab value="sankey">Sankey</v-tab>
      <v-tab value="krona">Krona</v-tab>
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
          <div class="d-flex justify-end  my-5 mx-10">
            <ConfigureSankeyMenu
              :initialTaxaLimit="taxaLimit"
              :initialMinCladeReads="minCladeReads"
              :initialShowUnclassified="showUnclassified"
              @updateSettings="updateSettings"
            />
          </div>

          <!-- SANKEY DIAGRAM -->
          <SankeyDiagram :data="results" :taxaLimit="taxaLimit" :minReads="minCladeReads" />
        </v-tabs-window-item>

        <!-- KRONA TAB -->
        <v-tabs-window-item value="krona" class="tab-fill-height">
          <iframe
            v-if="kronaContent"
            :srcdoc="kronaContent"
            style="width: 100%; height: 100%; border: none;"
          ></iframe>
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
  </v-card>
</template>
  
<script>
import SankeyDiagram from '@/components/SankeyDiagram.vue'
import ResultsTable  from '@/components/ResultsTable.vue';
import ConfigureSankeyMenu from '@/components/ConfigureSankeyMenu.vue';

export default {
  name: 'ResultsPage',
  components: {
    ResultsTable,
    SankeyDiagram,
    ConfigureSankeyMenu
  },
  data() {
    return {
      results: [],
      tab: 'TABLE',
      kronaContent: '', 
      taxaLimit: 25,
      minCladeReads: 1,
      showUnclassified: true,
    };
  },
  methods: {
    async renderKronaViewer(filePath) {
      try {
        const kronaHtml = await window.electron.readFile(filePath);
        this.kronaContent = kronaHtml;
      } catch (error) {
        console.error('Error opening Krona viewer:', error);
      }
    },
    async readTSVFile(filePath) {
      try {
        // console.log("tsv filepath: ", filePath)
        const tsvContent = await window.electron.readFile(filePath);
        const json = this.tsvToJSON(tsvContent);
        return json.results;
      } catch (error) {
        console.error('Error reading TSV file:', error);
      }
    },
    tsvToJSON(tsv) {
      const headers = ['proportion', 'clade_reads', 'taxon_reads', 'rank', 'taxon_id', 'name'];
      const records = tsv.split('\n').map(line => {
        const data = line.split('\t').map(item => item.trim());  // Strip leading and trailing whitespace
        return Object.fromEntries(headers.map((header, index) => [header, data[index]]));
      })
      .filter(record => !Object.values(record).every(field => field === '' || field === undefined || field === null)); // Filter out empty rows
      
      return { results: records };
    },
    saveResults() {
      sessionStorage.setItem('results', JSON.stringify(this.results)); // Save to session storage
    },
    updateSettings(settings) {
      this.taxaLimit = settings.taxaLimit;
      this.minCladeReads = settings.minCladeReads;
      this.showUnclassified = settings.showUnclassified;
    }
  },

  async mounted() {
    try {
      // Resolve outdir path
      const resolvedOutdirPath = window.electron.resolvePath(this.$route.query.outdir);
      
      // Render report.tsv 
      const reportFilePath = `${resolvedOutdirPath}/${this.$route.query.jobid}_report.tsv`;
      const resultsJSON = await this.readTSVFile(`${reportFilePath}`);
      this.results = resultsJSON;
      this.saveResults();
      
      // Render Krona
      const kronaFilePath = `${resolvedOutdirPath}/${this.$route.query.jobid}_krona.html`;
      this.renderKronaViewer(kronaFilePath);
    } catch (error) {
      console.error('Error loading results:', error);
    }
  }
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