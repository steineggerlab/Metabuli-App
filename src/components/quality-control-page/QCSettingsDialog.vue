<template>
  <div class="d-flex justify-start">
    <v-dialog
      v-model="dialog"
      max-width="600"
      persistent
    >
    <template v-slot:activator="{ props }">
				<slot name="activator" v-bind="{ props }"></slot>
			</template>

      <v-card
        title="Additional Parameter Settings"
      >
      <v-card-text>
          <v-row dense>
            <!-- Example field -->
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                v-model="localParams.p1"
                label="Window size"
                required
              ></v-text-field>
            </v-col>

            <!-- Example field -->
            <v-col cols="12" md="4" sm="6">
              <v-text-field
                v-model="localParams.p2"
                label="Quality threshold"
                required
              ></v-text-field>
            </v-col>

            <!-- Add more parameter inputs as needed… -->
          </v-row>
          <small class="text-caption text-medium-emphasis">
            * indicates required field
          </small>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />

          <v-btn
            text
            @click="onCancel"
          >Cancel</v-btn>

          <v-btn
            color="primary"
            variant="tonal"
            @click="onSave"
          >Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
  export default {
    data: () => ({
      dialog: false,
      localParams: {
        p1: "",
        p2: "",
       }
    }),
    methods: {
      onSave() {
        this.$emit("update-params", this.localParams);
        this.dialog = false;
      },
      onCancel() {
        this.dialog = false;
      }
    },
  }
</script>