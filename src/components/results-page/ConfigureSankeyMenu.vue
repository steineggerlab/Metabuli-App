<template>
  <div class="text-center">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      :location="menuLocation"
      transition="slide-x-reverse-transition"
    >
      <!-- ACTIVATOR FOR MENU -->
      <template v-slot:activator="{ props }">
        <slot name="activator" v-bind="{ props }"></slot>
      </template>

      <v-card width="340" class="my-1 configure-menu">
        <v-card>
          <!-- SWITCH (Show all) -->
          <v-list-item>
            <v-container class="pt-1">
              <div class="d-flex align-center gc-2">
                <v-switch
                  :model-value="showAll"
                  @update:modelValue="$emit('update:showAll', $event)"
                  color="indigo"
                  hide-details
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
                      :model-value="minCladeReadsMode"
                      @update:modelValue="$emit('update:minCladeReadsMode', $event)"
                      :disabled="showAll"
                      variant="outlined"
                      color="indigo"
                      divided
                      mandatory
                    >
                      <v-btn icon value="%" height="30" class="rounded-s-lg rounded-e-0 text-caption">%</v-btn>
                      <v-btn icon value="#" height="30" class="rounded-e-lg rounded-s-0 text-caption">#</v-btn>
                    </v-btn-toggle>
                    <v-text-field
                      :model-value="minCladeReads"
                      @update:modelValue="$emit('update:minCladeReads', parseFloat($event))"
                      type="number"
                      :min="minCladeReadsMode === '%' ? 0 : 1"
                      :max="minCladeReadsMode === '%' ? 100 : 1000"
                      :step="minCladeReadsMode === '%' ? 0.01 : 1"
                      variant="underlined"
                      density="compact"
                      dense
                      class="flex-grow-1"
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
                      :model-value="taxaLimit"
                      @update:modelValue="$emit('update:taxaLimit', parseInt($event))"
                      thumb-label="always"
                      :thumb-size="15"
                      step="1"
                      :min="1"
                      :max="maxTaxaLimit"
                      tick-size="1"
                      :disabled="showAll"
                    >
                      <template v-slot:append>
                        <v-text-field
                          :model-value="taxaLimit"
                          @update:modelValue="$emit('update:taxaLimit', parseInt($event))"
                          variant="outlined"
                          density="compact"
                          class="mx-0"
                          style="width: 90px;"
                          type="number"
                          hide-details
                          single-line
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
                      :model-value="figureHeight"
                      @update:modelValue="$emit('update:figureHeight', parseInt($event))"
                      thumb-label="always"
                      :thumb-size="15"
                      step="5"
                      :min="300"
                      :max="1000"
                    ></v-slider>
                  </v-container>
                </v-list-item>
               
                <v-list-item>
                  <div class="text-caption">Node width</div>
                  <v-container>
                    <v-slider
                      class="slider"
                      :model-value="nodeWidth"
                      @update:modelValue="$emit('update:nodeWidth', parseInt($event))"
                      thumb-label="always"
                      thumb-size="15"
                      step="1"
                      min="1"
                      max="50"
                    ></v-slider>
                  </v-container>
                </v-list-item>

                <v-list-item>
                  <div class="text-caption">Node padding</div>
                  <v-container>
                    <v-slider
                      class="slider"
                      :model-value="nodePadding"
                      @update:modelValue="$emit('update:nodePadding', parseInt($event))"
                      thumb-label="always"
                      thumb-size="15"
                      step="1"
                      min="1"
                      max="50"
                    ></v-slider>
                  </v-container>
                </v-list-item>
                
                <v-list-item>
                  <div class="text-caption">Node label font size</div>
                  <v-container>
                    <v-slider
                      class="slider"
                      :model-value="nodeLabelFontSize"
                      @update:modelValue="$emit('update:nodeLabelFontSize', parseInt($event))"
                      thumb-label="always"
                      thumb-size="15"
                      step="1"
                      min="1"
                      max="30"
                    ></v-slider>
                  </v-container>
                </v-list-item>
                
                <v-list-item>
                  <div class="text-caption">Node value font size</div>
                  <v-container>
                    <v-slider
                      class="slider"
                      :model-value="nodeValueFontSize"
                      @update:modelValue="$emit('update:nodeValueFontSize', parseInt($event))"
                      thumb-label="always"
                      thumb-size="15"
                      step="1"
                      min="1"
                      max="30"
                    ></v-slider>
                  </v-container>
                </v-list-item>
                
                <v-list-item>
                  <div class="text-caption">Rank label font size</div>
                  <v-container>
                    <v-slider
                      class="slider"
                      :model-value="rankLabelFontSize"
                      @update:modelValue="$emit('update:rankLabelFontSize', parseInt($event))"
                      thumb-label="always"
                      thumb-size="15"
                      step="1"
                      min="1"
                      max="30"
                    ></v-slider>
                  </v-container>
                </v-list-item>

                <!-- LABEL ABOVE NODE (Proportion/Clade Reads) -->
                <v-list-item>
                  <div class="text-caption">Label Option</div>
                  <v-container>
                    <div class="d-flex align-center flex-column">
                      <v-btn-toggle
                        :model-value="labelOption"
                        @update:modelValue="$emit('update:labelOption', $event)"
                        variant="outlined"
                        color="indigo"
                        divided
                        mandatory
                      >
                        <v-btn value="proportion" height="30" class="rounded-s-lg rounded-e-0">Proportion %</v-btn>
                        <v-btn value="cladeReads" height="30" class="rounded-s-0 rounded-e-lg">Clade Reads #</v-btn>
                      </v-btn-toggle>
                    </div>
                  </v-container>
                </v-list-item>
                
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
          <v-divider></v-divider>

          <v-card-actions>
            <v-btn variant="text" @click="menu = false">Close</v-btn>
            <v-btn variant="text" @click="emitDefaults">Reset</v-btn>
          </v-card-actions>
        </v-card>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: "ConfigureSankeyMenu",
  props: {
    maxTaxaLimit: { type: Number, default: 100 },
    showAll: { type: Boolean, default: false },
    taxaLimit: { type: Number, default: 10 },
    minCladeReadsMode: { type: String, default: "%" },
    minCladeReads: { type: Number, default: 0.01 },
    figureHeight: { type: Number, default: 300 },
    labelOption: { type: String, default: "cladeReads" },
    menuLocation: { type: String, default: "bottom end" },

    marginBottom: { type: Number, default: 50 },
    marginRight: { type: Number, default: 150 },
    nodeWidth: { type: Number, default: 20 },
    nodePadding: { type: Number, default: 13 },
    nodeLabelFontSize: { type: Number, default: 10 },
    nodeValueFontSize: { type: Number, default: 10 },
    rankLabelFontSize: { type: Number, default: 14 },
    // superkingdom --> domain
    // rankList: sankeyRankColumns,
    // rankListWithRoot: [ "no rank", ...sankeyRankColumns ],
    colorScheme: { type: Array, default: () => ([
        "#57291F", "#C0413B", "#D77B5F", "#FF9200", "#FFCD73",
        "#F7E5BF", "#C87505", "#F18E3F", "#E59579", "#C14C32",
        "#80003A", "#506432", "#FFC500", "#B30019", "#EC410B",
        "#E63400", "#8CB5B5", "#6C3400", "#FFA400", "#41222A",
        "#FFB27B", "#FFCD87", "#BC7576",
    ])},
    unclassifiedLabelColor: { type: String, default: "#696B7E" },
  },
  data() {
    return {
      menu: false,
      activePanel: [0],
      isFormValid: true,
      
      // Store all default values to allow resetting the menu
      // Populated by all props in the mounted lifecycle hook
      defaults: {}
    };
  },
  methods: {
    emitDefaults() {
      for (const [key, value] of Object.entries(this.defaults)) {
        this.$emit(`update:${key}`, value);
      }
    },
  },
  mounted() {
    Object.assign(this.defaults, this.$props);
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