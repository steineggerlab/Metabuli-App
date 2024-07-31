<template>
  <div class="text-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="bottom"
      transition="slide-x-reverse-transition"
    >
      <template v-slot:activator="{ props }">
        <v-btn color="indigo" v-bind="props"> Configure Sankey </v-btn>
      </template>

      <v-card min-width="300" class="py-3 mt-1">
        <v-list>
          <!-- SLIDER (Taxa Limit) -->
          <v-list-item>
            <v-container class="menu-container">
              <div class="text-caption">Taxa per level</div>
              <v-slider
                class="slider"
                v-model="taxaLimit"
                thumb-label="always"
                step="5"
                :min="5"
                :max="30"
                tick-size="1"
                show-ticks="always"
              ></v-slider>
            </v-container>
          </v-list-item>

          <!-- SLIDER (Minimum Clade Reads) -->
          <v-list-item>
            <v-container class="menu-container">
              <div class="text-caption">Minimum number of reads</div>
              <v-slider
                class="slider"
                v-model="minCladeReads"
                thumb-label="always"
                step="5"
                :min="1"
                :max="30"
                tick-size="1"
                show-ticks="always"
              ></v-slider>
            </v-container>
          </v-list-item>

          <!-- SWITCH (Show/Hide Unclassified Nodes) -->
          <v-list-item>
            <v-switch
              v-model="showUnclassified"
              color="purple"
              label="Show Unclassified Nodes"
              hide-details
            ></v-switch>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: "ConfigureSankeyMenu",
  props: {
    initialTaxaLimit: {
      type: Number,
      default: 10,
    },
    initialMinCladeReads: {
      type: Number,
      default: 10,
    },
    initialShowUnclassified: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      menu: false,
      taxaLimit: this.initialTaxaLimit,
      minCladeReads: this.initialMinCladeReads,
      showUnclassified: this.initialShowUnclassified,
    };
  },
  watch: {
    taxaLimit() {
      this.emitChanges();
    },
    minCladeReads() {
      this.emitChanges();
    },
    showUnclassified() {
      this.emitChanges();
    },
  },
  methods: {
    emitChanges() {
      this.$emit("updateSettings", {
        taxaLimit: this.taxaLimit,
        minCladeReads: this.minCladeReads,
        showUnclassified: this.showUnclassified,
      });
    },
    applyChanges() {
      this.emitChanges();
      this.menu = false;
    },
  },
};
</script>

<style scoped>
.menu-container {
  padding-top: 5px;
  padding-bottom: 0px;
}
.slider {
  margin-top: 30px;
}
</style>
