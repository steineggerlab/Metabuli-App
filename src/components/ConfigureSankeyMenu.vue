<template>
  <div class="text-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      :location="menuLocation"
      transition="slide-x-reverse-transition"
      persistent
      @keydown.enter="applyChanges"
    >
      <!-- ACTIVATOR FOR MENU -->
      <template v-slot:activator="{ props }">
        <slot name="activator" v-bind="{ props }"></slot>
      </template>

      <v-card min-width="300" class="pt-3 my-1">
        <v-form ref="form">
          <v-list>
            <!-- SWITCH (Show all) -->
            <v-list-item>
              <v-container class="pt-1">
                <div class="d-flex align-center gc-2">
                  <v-switch
                    v-model="showAll"
                    color="indigo"
                    hide-details
                    @update:modelValue="validateRange"
                  ></v-switch>
                  <div class="text-caption">Show all</div>
                </div>
              </v-container>
            </v-list-item>

            <v-divider></v-divider>

            <!-- SWITCH (Show/Hide Unclassified Nodes) -->
            <v-list-item>
              <v-container class="pt-1">
                <div class="d-flex align-center gc-2">
                  <v-switch
                    v-model="tempShowUnclassified"
                    color="indigo"
                    hide-details
                    :disabled="showAll"
                  ></v-switch>
                  <div class="text-caption">Show unclassified taxa</div>
                </div>
              </v-container>
            </v-list-item>

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
                  :disabled="showAll"
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
                  :disabled="showAll"
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
                  :thumb-size="15"
                  step="1"
                  :min="1"
                  :max="maxTaxaLimit"
                  tick-size="1"
                  :disabled="showAll"
                ></v-slider>
              </v-container>
            </v-list-item>

            <v-divider class="py-3"></v-divider>

            <!-- SLIDER (Figure Height) -->
            <v-list-item>
              <div class="text-caption">Figure Height</div>
              <v-container>
                <v-slider
                  class="slider"
                  v-model="tempFigureHeight"
                  thumb-label="always"
                  :thumb-size="15"
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
          </v-list>

          <v-divider></v-divider>

          <!-- APPLY AND CANCEL BUTTONS -->
          <v-card-actions>
            <v-btn variant="text" @click="cancelChanges"> Cancel </v-btn>
            <v-spacer></v-spacer>

            <v-btn
              color="indigo"
              variant="text"
              :disabled="!isFormValid"
              @click="applyChanges"
            >
              Apply
            </v-btn>
          </v-card-actions>
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
    maxTaxaLimit: {
      type: Number,
      default: 100,
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
      default: 300,
    },
    initialLabelOption: {
      type: String,
      default: "cladeReads",
    },
    menuLocation: {
      type: String,
      default: "bottom end", // Default position is bottom
    },
  },
  data() {
    return {
      menu: false,

      showAll: false,
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
      const min = this.tempCladeReadsMode === "%" ? 0 : 0;
      const max = this.tempCladeReadsMode === "%" ? 100 : Infinity;
      return (value) => {
        if (this.showAll || (value >= min && value <= max)) {
          this.isFormValid = true;
          return true;
        } else {
          this.isFormValid = false;
          return `Value not in valid range (${min}-${max})`;
        }
      };
    },
  },
  watch: {
    tempCladeReadsMode() {
      this.setDefaultValue();
    },
  },
  methods: {
    setDefaultValue() {
      this.tempCladeReadsValue = this.tempCladeReadsMode === "%" ? 0.001 : 1;
      this.tempLabelOption =
        this.tempCladeReadsMode === "%" ? "proportion" : "cladeReads";
      this.validateRange();
    },
    validateRange() {
      if (this.$refs.form) {
        this.$refs.form.validate();
      }
    },
    applyChanges() {
      // Apply the temporary values to the actual data
      if (!this.showAll) {
        this.taxaLimit = this.tempTaxaLimit;
        this.cladeReadsMode = this.tempCladeReadsMode;
        this.cladeReadsValue = this.tempCladeReadsValue;
        this.showUnclassified = this.tempShowUnclassified;
      } else {
        // Reset the temporary values to the current actual values
        this.tempTaxaLimit = this.taxaLimit;
        this.tempCladeReadsMode = this.cladeReadsMode;
        this.tempCladeReadsValue = this.cladeReadsValue;
        this.tempShowUnclassified = this.showUnclassified;
      }
      this.figureHeight = this.tempFigureHeight;
      this.labelOption = this.tempLabelOption;

      this.emitChanges();
      this.menu = false; // Close the menu
    },
    emitChanges() {
      this.$emit("updateSettings", {
        showAll: this.showAll,
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
