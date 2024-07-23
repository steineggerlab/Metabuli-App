<template>
  <v-card>
    <v-tabs v-model="tab">
      <v-tab value="table">Table</v-tab>
      <v-tab value="sankey">Sankey</v-tab>
    </v-tabs>

    <v-card-text>
      <v-tabs-window v-model="tab">
        <!-- TABLE -->
        <v-tabs-window-item value="table">
          
          <!-- SEARCH BAR -->
          <v-card
            class="mx-auto"
            color="surface-light"
            max-width="400"
          >
            <v-card-text>
              <v-text-field
                v-model="search"
                append-inner-icon="mdi-magnify"
                density="compact"
                label="Filter rows"
                variant="solo"
                hide-details
                single-line
              ></v-text-field>
            </v-card-text>
          </v-card>

          <v-data-table-virtual
            :headers="headers"
            :items="filteredTableResults"
            height="600"
            item-value="name"
          ></v-data-table-virtual>
        </v-tabs-window-item>

        <!-- SANKEY -->
        <v-tabs-window-item value="sankey">

          <!-- SLIDER for selecting # of taxa to show per level -->
          <div class="sankey-slider">

            <div class="text-caption">Taxa per level</div>
            <v-slider
              v-model="sankeySliderValue"
              thumb-label="always"
              width="500"
              show-ticks="always"
              step="5"
              :min="1"
              :max="100"
              tick-size="1"
            ></v-slider>
          </div>

          <SankeyDiagram :data="results" :taxaLimit="sankeySliderValue" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
  </v-card>
</template>
  
<script>
import SankeyDiagram from '../components/SankeyDiagram.vue'

export default {
  name: 'ResultsPage',
  components: {
    SankeyDiagram
  },
  data() {
    return {
      results: [],
      tab: 'TABLE',
      headers: [
        { title: 'Proportion', align: 'start', key: 'proportion' },
        { title: 'Clade Reads', align: 'start', key: 'clade_reads' },
        { title: 'Taxon Reads', align: 'start', key: 'taxon_reads' },
        { title: 'Rank', align: 'start', key: 'rank' },
        { title: 'Taxon ID', align: 'start', key: 'taxon_id' },
        { title: 'Name', align: 'start', key: 'name' },
      ],
      search: '',
      sankeySliderValue: 100,
      // nodes in same rank should be in same column (refer to pavian)
      // thickness of link (value) should be percentage
      // percentage of links going out from a node should add up to 100
      // ignore no rank, subgenus, subfamilies, etc for now
      // add description below the table saying this graph excludes nodes in ranks besides those displayed in the graph. Refer to the report.tsv file for the entire data.
    };
  },

  computed: {
    filteredTableResults() {
      return this.results.filter(item => {
        return Object.values(item).some(value =>
          value.toString().toLowerCase().includes(this.search.toLowerCase())
        );
      });
    }
  },

  methods: {
    async readTSVFile(filePath) {
      try {
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
  },

  async mounted() {
    try {
      // Render report.tsv 
      const reportFilePath = `${this.$route.query.outdir}/${this.$route.query.jobid}_report.tsv`
      const resultsJSON = await this.readTSVFile(`${reportFilePath}`);
      this.results = resultsJSON;
      this.saveResults();
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
</style>