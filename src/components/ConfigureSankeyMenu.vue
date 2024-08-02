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
        <v-form ref="form">
          <v-list>
            <!-- SLIDER (Taxa Limit) -->
            <v-list-item>
              <div class="text-caption">Taxa per level</div>
              <v-container>
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

            <!-- DROPDOWN AND INPUT (Minimum Clade Reads) -->
            <v-list-item>
              <div class="text-caption">Minimum number of reads</div>
              <v-container class="d-flex align-center">
                <v-select
                  v-model="cladeReadsMode"
                  :items="['%', '#']"
                  variant="underlined"
                  density="compact"
                  dense
                  class="select-width"
                  @change="setDefaultValue"
                ></v-select>
                <v-text-field
                  v-model="cladeReadsValue"
                  type="number"
                  :min="cladeReadsMode === '%' ? 0 : 1"
                  :max="cladeReadsMode === '%' ? 100 : 1000"
                  variant="underlined"
                  density="compact"
                  dense
                  class="flex-grow-1"
                  :rules="[valueRangeRule]"
                  @input="validateRange"
                ></v-text-field>
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

          <!-- APPLY CHANGE BUTTON -->
          <v-btn :disabled="!isFormValid" @click="applyChanges">Apply</v-btn>
        </v-form>
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
    initialMinCladeReadsMode: {
      type: String,
      default: "%",
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
      cladeReadsMode: this.initialMinCladeReadsMode,
      cladeReadsValue: this.initialMinCladeReads,
      showUnclassified: this.initialShowUnclassified,
      isFormValid: true,
    };
  },
  computed: {
    valueRangeRule() {
      const min = this.cladeReadsMode === "%" ? 0 : 1;
      const max = this.cladeReadsMode === "%" ? 100 : 1000;
      return (value) => {
        if (value >= min && value <= max) {
          this.isFormValid = true;
          return true;
        } else {
          this.isFormValid = false;
          return `Value not in valid range (${min}-${max})`;
        }
      };
    },
  },
  methods: {
    setDefaultValue() {
      console.log(this.cladeReadsMode);
      this.cladeReadsValue = this.cladeReadsMode === "%" ? 10 : 1000;
      this.validateRange();
    },
    validateRange() {
      if (this.$refs.form) {
        this.$refs.form.validate();
      }
    },
    applyChanges() {
      // Handle apply button click
      console.log("Apply changes with value:", this.cladeReadsValue);
      this.emitChanges();
      this.menu = false;
    },
    emitChanges() {
      this.$emit("updateSettings", {
        taxaLimit: this.taxaLimit,
        minCladeReads: this.minCladeReads,
        showUnclassified: this.showUnclassified,
      });
    },
  },
  watch: {
    cladeReadsMode() {
      this.setDefaultValue();
    },
  },
  mounted() {
    this.setDefaultValue();
  },
};
</script>

<style scoped>
.slider {
  margin-top: 15px;
}

.select-width {
  width: auto;
  flex: 0 1 auto;
}
</style>
