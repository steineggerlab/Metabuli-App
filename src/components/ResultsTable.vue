<template>
  <v-data-table
    :headers="headers"
    :items="filteredTableResults"
    height="550px"
    item-value="name"
  >
    <template v-slot:top>
      <div class="d-flex align-center">
        <!-- NUMBER OF DATA ITEMS -->
        <div>
          Showing {{ totalItems }} entries
        </div>
        
        <v-spacer></v-spacer>

        <!-- SEARCH BAR -->
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          label="Filter results"
          variant="outlined"
          single-line
        ></v-text-field>
      </div>
    </template>
  </v-data-table>
</template>

<script>
export default {
  data() {
    return {
      headers: [
        { title: 'Proportion', align: 'start', key: 'proportion' },
        { title: 'Clade Reads', align: 'start', key: 'clade_reads' },
        { title: 'Taxon Reads', align: 'start', key: 'taxon_reads' },
        { title: 'Rank', align: 'start', key: 'rank', sortRaw: (a, b) => this.rankSort(a.rank, b.rank) },
        { title: 'Taxon ID', align: 'start', key: 'taxon_id' },
        { title: 'Name', align: 'start', key: 'name' },
      ],
      searchQuery: '',
    }
  },
  props: {
    data: Array
  },
  computed: {
    filteredTableResults() {
      return this.data.filter(item => {
        return Object.values(item).some(value =>
          value.toString().toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      });
    },
    totalItems () {
      return this.filteredTableResults.length;
    }
  },
  methods: {
    rankSort(a, b) {
      const rankOrderFull = ["superkingdom", "kingdom", "subkingdom", "superphylum", "phylum", "subphylum", "superclass", "class", "subclass", "superorder", "order", "suborder", "infraorder", "parvorder", "superfamily", "family", "subfamily", "supergenus", "genus", "subgenus", "superspecies", "species", "subspecies", "no rank", "clade"];
      const rankA = rankOrderFull.indexOf(a);
      const rankB = rankOrderFull.indexOf(b);
      
      if (rankA < rankB) {
        return 1;
      } else if (rankA > rankB) {
        return -1;
      } else {
        return 0;
      }
    },
  }
}
</script>
