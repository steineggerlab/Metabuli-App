<template>
  <div class="text-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="bottom"
      transition="slide-x-reverse-transition"
      persistent
    >
      <template v-slot:activator="{ props }">
        <v-btn color="indigo" v-bind="props"> Configure Sankey </v-btn>
      </template>

      <v-card min-width="300" class="py-3 mt-1">
        <v-form ref="form">
          <v-list>
            <!-- DROPDOWN AND INPUT (Minimum Clade Reads) -->
            <v-list-item>
              <div class="text-caption">Minimum number of reads</div>
              <v-container class="d-flex align-center">
                <v-select
                  v-model="tempCladeReadsMode"
                  :items="['%', '#']"
                  variant="underlined"
                  density="compact"
                  dense
                  class="select-width"
                  @change="setDefaultValue"
                ></v-select>

                <v-text-field
                  v-model="tempCladeReadsValue"
                  type="number"
                  :min="tempCladeReadsMode === '%' ? 0 : 1"
                  :max="tempCladeReadsMode === '%' ? 100 : 1000"
                  variant="underlined"
                  density="compact"
                  dense
                  class="flex-grow-1"
                  :rules="[valueRangeRule]"
                  @input="validateRange"
                ></v-text-field>
              </v-container>
            </v-list-item>

            <!-- SLIDER (Taxa Limit) -->
            <v-list-item>
              <div class="text-caption">Taxa per level</div>
              <v-container class="menu-item">
                <v-slider
                  class="slider"
                  v-model="tempTaxaLimit"
                  thumb-label="always"
                  step="5"
                  :min="5"
                  :max="30"
                  tick-size="1"
                  show-ticks="always"
                ></v-slider>
              </v-container>
            </v-list-item>

            <!-- SLIDER (Figure Height) -->
            <v-list-item>
              <div class="text-caption">Figure Height</div>
              <v-container>
                <v-slider
                  class="slider"
                  v-model="tempFigureHeight"
                  thumb-label="always"
                  step="5"
                  :min="300"
                  :max="800"
                ></v-slider>
              </v-container>
            </v-list-item>

            <!-- LABEL ABOVE NODE (Proportion/Clade Reads) -->
            <v-list-item>
              <div class="text-caption">Label Option</div>
              <v-container>
                <div class="d-flex align-center flex-column">
                  <v-btn-toggle
                    v-model="tempLabelOption"
                    variant="outlined"
                    color="indigo"
                    divided
                    mandatory
                  >
                    <v-btn value="proportion" height="30">Proportion</v-btn>
                    <v-btn value="cladeReads" height="30">Clade Reads</v-btn>
                  </v-btn-toggle>
                </div>
              </v-container>
            </v-list-item>

            <!-- SWITCH (Show/Hide Unclassified Nodes) -->
            <v-list-item>
              <v-container class="pt-1">
                <div class="d-flex align-center gc-2">
                  <v-switch
                    v-model="tempShowUnclassified"
                    color="indigo"
                    hide-details
                  ></v-switch>
                  <div class="text-caption">Show unclassified taxa</div>
                </div>
              </v-container>
            </v-list-item>
          </v-list>

          <!-- APPLY AND CANCEL BUTTONS -->
          <v-container class="d-flex justify-end gc-2 py-2">
            <v-btn
              size="small"
              variant="outlined"
              color="indigo"
              @click="cancelChanges"
              >Cancel</v-btn
            >
            <v-btn
              size="small"
              variant="flat"
              color="indigo"
              :disabled="!isFormValid"
              @click="applyChanges"
              >Apply</v-btn
            >
          </v-container>
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
    initialFigureHeight: {
      type: Number,
    },
    initialLabelOption: {
      type: String,
      default: "cladeReads",
    },
  },
  data() {
    return {
      menu: false,

      taxaLimit: this.initialTaxaLimit,
      cladeReadsMode: this.initialMinCladeReadsMode,
      cladeReadsValue: this.initialMinCladeReads,
      showUnclassified: this.initialShowUnclassified,
      figureHeight: this.initialFigureHeight,
      labelOption: this.initialLabelOption,

      tempTaxaLimit: 10,
      tempCladeReadsMode: "%",
      tempCladeReadsValue: 10,
      tempShowUnclassified: false,
      tempFigureHeight: 550,
      tempLabelOption: "cladeReads",

      isFormValid: true,
    };
  },
  computed: {
    valueRangeRule() {
      const min = this.tempCladeReadsMode === "%" ? 0 : 1;
      const max = this.tempCladeReadsMode === "%" ? 100 : Infinity;
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
      this.tempCladeReadsValue = this.tempCladeReadsMode === "%" ? 10 : 1000;
      this.validateRange();
    },
    validateRange() {
      if (this.$refs.form) {
        this.$refs.form.validate();
      }
    },
    applyChanges() {
      // Apply the temporary values to the actual data
      this.taxaLimit = this.tempTaxaLimit;
      this.cladeReadsMode = this.tempCladeReadsMode;
      this.cladeReadsValue = this.tempCladeReadsValue;
      this.showUnclassified = this.tempShowUnclassified;
      this.figureHeight = this.tempFigureHeight;
      this.labelOption = this.tempLabelOption;

      this.emitChanges();
      this.menu = false; // Close the menu
    },
    emitChanges() {
      this.$emit("updateSettings", {
        taxaLimit: this.taxaLimit,
        minCladeReadsMode: this.cladeReadsMode,
        minCladeReads: parseFloat(this.cladeReadsValue),
        showUnclassified: this.showUnclassified,
        figureHeight: this.figureHeight,
        labelOption: this.labelOption,
      });
    },
    cancelChanges() {
      // Reset the temporary values to the current actual values
      this.tempTaxaLimit = this.taxaLimit;
      this.tempCladeReadsMode = this.cladeReadsMode;
      this.tempCladeReadsValue = this.cladeReadsValue;
      this.tempShowUnclassified = this.showUnclassified;
      this.tempFigureHeight = this.figureHeight;
      this.tempLabelOption = this.labelOption;

      this.menu = false; // Close the menu
    },
  },
  watch: {
    tempCladeReadsMode() {
      this.setDefaultValue();
    },
  },
  mounted() {
    // Initialize the temporary values
    this.tempTaxaLimit = this.taxaLimit;
    this.tempCladeReadsMode = this.cladeReadsMode;
    this.tempCladeReadsValue = this.cladeReadsValue;
    this.tempShowUnclassified = this.showUnclassified;
    this.tempFigureHeight = this.figureHeight;
    this.tempLabelOption = this.labelOption;
  },
};
</script>

<style scoped>
.v-container {
  padding-bottom: 0px;
}
.slider {
  margin-top: 15px;
}

.select-width {
  width: auto;
  flex: 0 1 auto;
}
</style>
