<template>
  <v-card>
    <v-tabs v-model="tab">
      <v-tab value="table">Table</v-tab>
      <v-tab value="sankey">Sankey</v-tab>
      <v-tab value="krona">Krona</v-tab>
    </v-tabs>

    <v-card-text>
      <v-tabs-window v-model="tab">
        <!-- TABLE -->
        <v-tabs-window-item value="table">
          
          <!-- SEARCH BAR -->
          <v-sheet
            class="d-flex justify-content-between align-center"
            width="100%"
          >
            <div>
              Showing {{ totalItems }} entries
            </div>
            <v-spacer></v-spacer>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              density="compact"
              label="Filter results"
              variant="outlined"
              single-line
            ></v-text-field>
          </v-sheet>

          <ResultsTable :filteredTableResults="filteredTableResults" />
        </v-tabs-window-item>

        <!-- SANKEY -->
        <v-tabs-window-item value="sankey" class="tab-fill-height">

          <!-- SLIDER for selecting # of taxa to show per level -->
          <div class="sankey-slider">
            <div class="text-caption">Taxa per level</div>
            <v-slider
              v-model="sankeySliderValue"
              thumb-label
              width="500"
              show-ticks="always"
              step="5"
              :min="5"
              :max="50"
              tick-size="1"
            ></v-slider>
          </div>

          <SankeyDiagram :data="results" :taxaLimit="sankeySliderValue" />
        </v-tabs-window-item>

        <!-- KRONA VIEWER -->
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
import SankeyDiagram from '../components/SankeyDiagram.vue'
import ResultsTable  from '@/components/ResultsTable.vue';

export default {
  name: 'ResultsPage',
  components: {
    ResultsTable,
    SankeyDiagram
  },
  data() {
    return {
      results: [],
      tab: 'TABLE',
      search: '',
      sankeySliderValue: 25,
      kronaContent: '', 
    };
  },

  computed: {
    filteredTableResults() {
      return this.results.filter(item => {
        return Object.values(item).some(value =>
          value.toString().toLowerCase().includes(this.search.toLowerCase())
        );
      });
    },
    totalItems () {
      return this.filteredTableResults.length;
    }
  },

  methods: {
    async renderKronaViewer() {
      try {
        const filePath = window.electron.resolvePath('sample_data/sample_data_krona.html');
        const kronaHtml = await window.electron.readFile(filePath);
        this.kronaContent = kronaHtml;
        // await window.electron.openKrona(filePath);
      } catch (error) {
        console.error('Error opening Krona viewer:', error);
      }
    },
    async readTSVFile(filePath) {
      try {
        console.log(filePath); // DELETE
        const resolvedPath = window.electron.resolvePath(filePath); // Resolve filePath
        console.log("resolvedPath: ", resolvedPath)
      
        const tsvContent = await window.electron.readFile(resolvedPath);
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
  },

  async mounted() {
    try {
      // Render report.tsv 
      const reportFilePath = `${this.$route.query.outdir}/${this.$route.query.jobid}_report.tsv`
      const resultsJSON = await this.readTSVFile(`${reportFilePath}`);
      this.results = resultsJSON;
      this.saveResults();

      // Render Krona
      this.renderKronaViewer();
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
.tab-fill-height { /* FIXME */
  height: 600px; /* Adjust according to your header/footer height */
  overflow: auto;
}
</style>