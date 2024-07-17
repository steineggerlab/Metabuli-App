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
            :items="virtualBoats"
            height="400"
            item-value="name"
          ></v-data-table-virtual>
        </v-tabs-window-item>

        <!-- SANKEY -->
        <v-tabs-window-item value="sankey">
          Two
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
        results: [
          {
            proportion: 'Speedster',
            clade_reads: 35,
            taxon_reads: 22,
            rank: 300000,
            taxon_id: 2021,
          },
          {
            proportion: 'OceanMaster',
            clade_reads: 25,
            taxon_reads: 35,
            rank: 500000,
            taxon_id: 2020,
          },
        ],
    };
  },
  computed: {
    virtualBoats () {
      return [...Array(10000).keys()].map(i => {
        const entry = { ...this.results[i % this.results.length] }
        entry.proportion = `${entry.proportion} #${i}`
        return entry
      })
    },
  },
};
</script>
