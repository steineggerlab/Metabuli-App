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
          <v-data-table-virtual
            :headers="headers"
            :items="results"
            height="600"
            item-value="name"
          ></v-data-table-virtual>
        </v-tabs-window-item>

        <!-- SANKEY -->
        <v-tabs-window-item value="sankey">
          <SankeyDiagram :data="sankeyData" />
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
      tab: 'TABLE',
      headers: [
        { title: 'Proportion', align: 'start', key: 'proportion' },
        { title: 'Clade Reads', align: 'start', key: 'clade_reads' },
        { title: 'Taxon Reads', align: 'start', key: 'taxon_reads' },
        { title: 'Rank', align: 'start', key: 'rank' },
        { title: 'Taxon ID', align: 'start', key: 'taxon_id' },
        { title: 'Name', align: 'start', key: 'name' },
      ],
      results: [],
      sankeyData: {
        nodes: [
          { id: 'n0', name: 'root' },
          { id: 'n1', name: 'Viruses' },
          { id: 'n2', name: 'Riboviria' },
          { id: 'n3', name: 'Orthornavirae' },
          { id: 'n4', name: 'Pisuviricota' },
          { id: 'n5', name: 'Pisoniviricetes' },
          { id: 'n6', name: 'Nidovirales' },
          { id: 'n7', name: 'Cornidovirineae' },
          { id: 'n8', name: 'Coronaviridae' },
          { id: 'n9', name: 'Orthocoronavirinae' },
          { id: 'n10', name: 'Betacoronavirus' },
          { id: 'n11', name: 'Sarbecovirus' },
          { id: 'n12', name: 'Severe acute respiratory syndrome-related coronavirus' },
          { id: 'n13', name: 'SARS-CoV-2' }
        ],
        links: [
          { source: 'n0', target: 'n1', value: 90.8757 },
          { source: 'n0', target: 'n2', value: 5.3231 },
          { source: 'n1', target: 'n2', value: 2.3831 },
          { source: 'n1', target: 'n4', value: 10.3231 },
          { source: 'n2', target: 'n3', value: 30.2642 },
          { source: 'n4', target: 'n6', value: 50.2642 },
          { source: 'n6', target: 'n7', value: 3.2642 },
          { source: 'n7', target: 'n8', value: 82.2642 },
          { source: 'n6', target: 'n9', value: 12.2642 },
          { source: 'n9', target: 'n10', value: 22.2642 },
          { source: 'n1', target: 'n11', value: 32.2642 },
          { source: 'n4', target: 'n12', value: 2.2642 },
          { source: 'n2', target: 'n13', value: 22.2642 }
        ]
      }
    };
  },
  computed: {
    //
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
      // console.log(JSON.stringify(this.results, null, 2)); //FIXME:
      this.saveResults();
      console.log('DONE')
    } catch (error) {
      console.error('Error loading results:', error);
    }
  }
};
</script>