<template>
  <v-menu
    v-model="downloadMenu"
    transition="slide-y-transition"
    :location="menuLocation"
  >
    <template v-slot:activator="{ props }">
      <slot name="activator" v-bind="{ props }"></slot>
    </template>

    <v-list class="my-1">
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
  props: {
    menuLocation: {
      type: String,
      default: "bottom end",
    },
  },
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