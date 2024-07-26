<template>
  <v-data-table
    :headers="headers"
    :items="filteredTableResults"
    height="550px"

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

    <!-- Proportion background color fill -->
    <template v-slot:[`item.proportion`]="{ value }">
      <div class="proportion-cell">
        <div class="proportion-fill" :style="{ width: `${value}%` }"></div>
        <span class="proportion-text">{{ value }}%</span>
      </div>
    </template>

    <!-- Scoped Slot for Clade-Reads Column -->
    <template v-slot:[`item.clade_reads`]="{ value }">
      <div class="clade-reads-cell">
        <div class="clade-reads-fill" :style="{ width: `${(value / maxCladeReads) * 100}%` }"></div>
        <span class="clade-reads-text">{{ value }}</span>
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
    },
    maxCladeReads() {
      return Math.max(...this.data.map(item => item.clade_reads));
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

<style scoped>
.proportion-cell, .clade-reads-cell {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.proportion-fill, .clade-reads-fill {
  position: absolute;
  height: 100%;
  background-color: #c9ebf2;
}
.proportion-text, .clade-reads-text {
  position: relative;
  padding: 8px;
  z-index: 1;
}
</style>