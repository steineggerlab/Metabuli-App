<template>
  <v-menu
    v-model="downloadMenu"
    transition="slide-y-transition"
    location="bottom"
  >
    <template v-slot:activator="{ props }">
      <v-btn v-bind="props" append-icon="$download" variant="text">
        Download
      </v-btn>
    </template>

    <v-list class="sankey-dropdown">
      <v-list-item
        v-for="(item, i) in items"
        :key="i"
        @click="selectFormat(item.value)"
        class="d-flex align-center"
      >
        <v-list-item-title>{{ item.text }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-menu>
</template>

<script>
export default {
  data: () => ({
    downloadMenu: false,
    format: null,
    items: [
      { text: "JPG", value: "jpg" },
      { text: "PNG", value: "png" },
      { text: "HTML", value: "html" },
    ],
  }),
  methods: {
    selectFormat(format) {
      this.downloadMenu = false;
      this.$emit("format-selected", format);
    },
  },
};
</script>

<style>
.sankey-dropdown {
  margin-top: 4px;
}
</style>
