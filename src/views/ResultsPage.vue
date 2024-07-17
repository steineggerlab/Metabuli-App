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
            height="500"
            item-value="name"
          ></v-data-table-virtual>
        </v-tabs-window-item>

        <!-- SANKEY -->
        <v-tabs-window-item value="sankey">

          
        </v-tabs-window-item>
      </v-tabs-window>
    </v-card-text>
  </v-card>
</template>
  
<script>

export default {
  name: 'ResultsPage',
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
      results: []
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
      });
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
      console.log(JSON.stringify(this.results, null, 2)); //FIXME:
      this.saveResults();
      console.log('DONE')
    } catch (error) {
      console.error('Error loading results:', error);
    }
  }
};
</script>
