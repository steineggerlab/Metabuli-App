<template>
  <v-data-table :headers="headers" :items="filteredTableResults" height="550px">
    <template v-slot:top>
      <div class="d-flex align-center">
        <!-- NUMBER OF DATA ITEMS -->
        <div>Showing {{ totalItems }} entries</div>

        <v-spacer></v-spacer>

        <!-- SEARCH BAR -->
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="$magnify"
          density="compact"
          label="Filter results"
          variant="outlined"
          single-line
        ></v-text-field>
      </div>
    </template>

    <template v-slot:item="{ item, index }">
      <tr :class="index % 2 === 0 ? 'grey-background' : 'white-background'">
        <!-- PROPORTION -->
        <td>
          <div class="proportion-cell">
            <div
              class="proportion-fill"
              :style="{ width: `${item.proportion}%` }"
            ></div>
            <span class="proportion-text">{{ item.proportion }}%</span>
          </div>
        </td>

        <!-- CLADE READS -->
        <td>
          <div class="clade-reads-cell">
            <div
              class="clade-reads-fill"
              :style="{ width: `${(item.clade_reads / maxCladeReads) * 100}%` }"
            ></div>
            <span class="clade-reads-text">{{ item.clade_reads }}</span>
          </div>
        </td>

        <!-- TAXON READS -->
        <td>
          <div class="taxon-reads-cell">
            <div
              class="taxon-reads-fill"
              :style="{ width: `${(item.taxon_reads / maxCladeReads) * 100}%` }"
            ></div>
            <span class="taxon-reads-text">{{ item.taxon_reads }}</span>
          </div>
        </td>

        <!-- RANK -->
        <td>
          <v-chip
            :color="getRankColor(item.rank)"
            density="comfortable"
            rounded="lg"
            >{{ item.rank }}</v-chip
          >
        </td>

        <!-- TAXON ID -->
        <td>{{ item.taxon_id }}</td>

        <!-- NAME -->
        <td>{{ item.name }}</td>
      </tr>
    </template>
  </v-data-table>
</template>

<script>
export default {
  data() {
    return {
      headers: [
        {
          title: "Proportion (%)",
          align: "center",
          key: "proportion",
          width: "160px",
        },
        {
          title: "Clade Reads",
          align: "center",
          key: "clade_reads",
          width: "160px",
        },
        {
          title: "Taxon Reads",
          align: "center",
          key: "taxon_reads",
          width: "160px",
        },
        {
          title: "Rank",
          align: "start",
          key: "rank",
          width: "140px",
          sortRaw: (a, b) => this.rankSort(a.rank, b.rank),
        },
        { title: "Taxon ID", align: "start", key: "taxon_id", width: "140px" },
        { title: "Name", align: "start", key: "name" },
      ],
      searchQuery: "",
      rankOrderFull: [
        "superkingdom",
        "kingdom",
        "subkingdom",
        "superphylum",
        "phylum",
        "subphylum",
        "superclass",
        "class",
        "subclass",
        "superorder",
        "order",
        "suborder",
        "infraorder",
        "parvorder",
        "superfamily",
        "family",
        "subfamily",
        "supergenus",
        "genus",
        "subgenus",
        "superspecies",
        "species",
        "subspecies",
        "no rank",
        "clade",
      ],
      autumnColors: [
        "#57291F",
        "#C0413B",
        "#D77B5F",
        "#C87505",
        "#FF9200",
        "#E59579",
        "#F18E3F",
        "#FFC500",
        "#FFB27B",
        "#005245",
        "#187B30",
        "#006F60",
        "#560432",
        "75E0B0",
        "#0065A2",
        "#00A5E3",
        "#8CB5B5",
        "#740E4C",
        "#9E1C5C",
        " #CBAACB",
        "#E2038D",
        "#EE84B3",
        "#FFCD87",
        "#8A9BA7",
        "#696B73",
      ],
    };
  },
  props: {
    data: Array,
  },
  computed: {
    filteredTableResults() {
      return this.data.filter((item) => {
        return Object.values(item).some((value) =>
          value
            .toString()
            .toLowerCase()
            .includes(this.searchQuery.toLowerCase())
        );
      });
    },
    totalItems() {
      return this.filteredTableResults.length;
    },
    maxCladeReads() {
      return Math.max(...this.data.map((item) => item.clade_reads));
    },
  },
  methods: {
    rankSort(a, b) {
      const rankA = this.rankOrderFull.indexOf(a);
      const rankB = this.rankOrderFull.indexOf(b);

      if (rankA < rankB) {
        return 1;
      } else if (rankA > rankB) {
        return -1;
      } else {
        return 0;
      }
    },
    getRankColor(rank) {
      const rankIndex = this.rankOrderFull.indexOf(rank);
      return this.autumnColors[rankIndex % this.autumnColors.length];
    },
  },
};
</script>

<style scoped>
/* Proportional cell background fill */
.proportion-cell,
.clade-reads-cell,
.taxon-reads-cell {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
.proportion-fill,
.clade-reads-fill,
.taxon-reads-fill {
  position: absolute;
  height: 100%;
  background-color: #b9d4ed;
}
.proportion-text,
.clade-reads-text,
.taxon-reads-text {
  position: relative;
  padding: 8px;
  z-index: 1;
}

/* Alternating row background */
.grey-background {
  background-color: #fafafa;
}
.white-background {
  background-color: #ffffff;
}
</style>
