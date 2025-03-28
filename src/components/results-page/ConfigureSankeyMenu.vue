<template>
  <div class="text-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      :location="menuLocation"
      transition="slide-x-reverse-transition"
      persistent
    >
      <!-- ACTIVATOR FOR MENU -->
      <template v-slot:activator="{ props }">
        <slot name="activator" v-bind="{ props }"></slot>
      </template>

      <v-card width="340" class="my-1 configure-menu">
        <v-form ref="form">
          <!-- SWITCH (Show all) -->
          <v-list-item>
            <v-container class="pt-1">
              <div class="d-flex align-center gc-2">
                <v-switch
                  v-model="tempShowAll"
                  color="indigo"
                  hide-details
                  @update:modelValue="validateRange"
                ></v-switch>
                <div class="text-caption">Show all</div>
              </div>
            </v-container>
          </v-list-item>

          <v-divider></v-divider>

          <v-expansion-panels
            v-model="activePanel"
            variant="accordion"
            elevation="0"
          >
            <v-expansion-panel title="Node Settings">
              <!-- GRAPH SETTINGS -->
              <v-expansion-panel-text>
                <!-- DROPDOWN AND INPUT (Minimum Clade Reads) -->
                <v-list-item>
                  <div class="text-caption">
                    <p>Minimum number of reads</p>
                    <p class="text-grey">%: Proportion | #: Clade Reads</p>
                  </div>
                  <v-container class="d-flex align-center gc-4">
                    <v-btn-toggle
                      v-model="tempCladeReadsMode"
                      @change="setDefaultValue"
                      :disabled="tempShowAll"
                      variant="outlined"
                      color="indigo"
                      divided
                      mandatory
                    >
                      <v-btn
                        icon
                        value="%"
                        height="30"
                        class="rounded-s-lg rounded-e-0 text-caption"
                        >%</v-btn
                      >
                      <v-btn
                        icon
                        value="#"
                        height="30"
                        class="rounded-e-lg rounded-s-0 text-caption"
                        >#</v-btn
                      >
                    </v-btn-toggle>

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
                      :disabled="tempShowAll"
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
                      :disabled="tempShowAll"
                      @change="validateRange"
                    >
                      <template v-slot:append>
                        <v-text-field
                          v-model="tempTaxaLimit"
                          variant="outlined"
                          density="compact"
                          class="mx-0"
                          style="width: 90px;"
                          type="number"
                          hide-details
                          single-line
                          :rules="[taxaLimitRangeRule]"
                          @input="validateRange"
                        ></v-text-field>
                      </template>
                    </v-slider>
                  </v-container>
                </v-list-item>
              </v-expansion-panel-text>
            </v-expansion-panel>

            <!-- VISUAL SETTINGS -->
            <v-expansion-panel title="Visual Settings">
              <v-expansion-panel-text>
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
                      :max="1000"
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
                        <v-btn
                          value="proportion"
                          height="30"
                          class="rounded-s-lg rounded-e-0"
                          >Proportion %</v-btn
                        >
                        <v-btn
                          value="cladeReads"
                          height="30"
                          class="rounded-s-0 rounded-e-lg"
                          >Clade Reads #</v-btn
                        >
                      </v-btn-toggle>
                    </div>
                  </v-container>
                </v-list-item>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
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
    maxTaxaLimit: {
      type: Number,
      default: 100,
    },

    initialShowAll: {
      type: Boolean,
      default: false,
    },
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
      default: 0.01,
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
      activePanel: [0],
      isFormValid: true,

      showAll: this.initialShowAll,
      taxaLimit: this.initialTaxaLimit,
      cladeReadsMode: this.initialMinCladeReadsMode,
      cladeReadsValue: this.initialMinCladeReads,
      figureHeight: this.initialFigureHeight,
      labelOption: this.initialLabelOption,

      tempShowAll: false,
      tempTaxaLimit: 10,
      tempCladeReadsMode: "%",
      tempCladeReadsValue: 0.01,
      tempFigureHeight: 550,
      tempLabelOption: "cladeReads",
    };
  },
  computed: {
    valueRangeRule() {
      const min = this.tempCladeReadsMode === "%" ? 0 : 0;
      const max = this.tempCladeReadsMode === "%" ? 100 : Infinity;
      return (value) => {
        // Check if the value is empty or contains only a hyphen
        if (value === "" || value === "-" || isNaN(value)) {
          this.isFormValid = false;
          return `Input required`;
        }

        // Check if the value is within the valid range
        if (this.tempShowAll || (value >= min && value <= max)) {
          this.isFormValid = true;
          return true;
        } else {
          this.isFormValid = false;
          const rule =
            this.tempCladeReadsMode === "%"
              ? `Valid range: 0-100`
              : `Valid range: ${min}<`;
          return rule;
        }
      };
    },
  },
  watch: {
    tempCladeReadsMode() {
      this.setDefaultValue();
    },

    // Watch for changes in the initial values
    initialShowAll(newVal) {
      this.showAll = newVal;
      this.tempShowAll = newVal;
    },
    initialTaxaLimit(newVal) {
      this.taxaLimit = newVal;
      this.tempTaxaLimit = newVal;
    },
    initialMinCladeReadsMode(newVal) {
      this.cladeReadsMode = newVal;
      this.tempCladeReadsMode = newVal;
    },
    initialMinCladeReads(newVal) {
      this.cladeReadsValue = newVal;
      this.tempCladeReadsValue = newVal;
    },
    initialFigureHeight(newVal) {
      this.figureHeight = newVal;
      this.tempFigureHeight = newVal;
    },
    initialLabelOption(newVal) {
      this.labelOption = newVal;
      this.tempLabelOption = newVal;
    },
  },
  methods: {
    setDefaultValue() {
      this.tempCladeReadsValue = this.tempCladeReadsMode === "%" ? 0.001 : 1;
      this.tempLabelOption =
        this.tempCladeReadsMode === "%" ? "proportion" : "cladeReads";
      this.validateRange();
    },
    taxaLimitRangeRule(value) {
      const min = 1;
      const max = Infinity;

      // Check if the value is empty or contains only a hyphen
      if (value === "" || value === "-" || isNaN(value)) {
        this.isFormValid = false;
        return `Invalid input`;
      }

      // Check if the value is within the valid range
      if (this.tempShowAll || (value >= min && value <= max)) {
        this.isFormValid = true;
        return true;
      } else {
        this.isFormValid = false;
        return `Value not in valid range (${min}<)`;
      }
    },
    validateRange() {
      if (this.$refs.form) {
        this.$refs.form.validate();
      }
    },
    applyChanges() {
      // Apply the temporary values to the actual data
      if (!this.tempShowAll) {
        this.taxaLimit = this.tempTaxaLimit;
        this.cladeReadsMode = this.tempCladeReadsMode;
        this.cladeReadsValue = this.tempCladeReadsValue;
      } else {
        // Reset the temporary values to the current actual values
        this.tempTaxaLimit = this.taxaLimit;
        this.tempCladeReadsMode = this.cladeReadsMode;
        this.tempCladeReadsValue = this.cladeReadsValue;
      }
      this.showAll = this.tempShowAll;
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
        figureHeight: this.figureHeight,
        labelOption: this.labelOption,
      });
    },
    cancelChanges() {
      // Reset the temporary values to the current actual values
      this.tempShowAll = this.showAll;
      this.tempTaxaLimit = this.taxaLimit;
      this.tempCladeReadsMode = this.cladeReadsMode;
      this.tempCladeReadsValue = this.cladeReadsValue;
      this.tempFigureHeight = this.figureHeight;
      this.tempLabelOption = this.labelOption;

      this.menu = false; // Close the menu
    },
  },

  mounted() {
    // Initialize the temporary values
    this.tempShowAll = this.showAll;
    this.tempTaxaLimit = this.taxaLimit;
    this.tempCladeReadsMode = this.cladeReadsMode;
    this.tempCladeReadsValue = this.cladeReadsValue;
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

/* Expansion Panel */
.configure-menu .v-list-item {
  width: 100%;
}

/* Button Toggle Style */
:deep(.configure-menu .v-list-item .v-btn__content) {
  font-family: Roboto;
  font-weight: 500;
  font-size: 12px;
  letter-spacing: 0.4px;
  text-transform: capitalize;
}

:deep(.configure-menu .v-list-item__content) {
  overflow: visible; /* Allow slider thumb overflow */
}
.configure-menu .v-input--horizontal {
  margin-left: 0px;
  margin-right: 0px;
}
:deep(.configure-menu .v-expansion-panel-text__wrapper) {
  padding: 0px;
}
</style>
