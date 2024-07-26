<template>
  <v-data-table-virtual
    :headers="headers"
    :items="filteredTableResults"
    height="560px"
    item-value="name"
  ></v-data-table-virtual>
</template>

<script>
export default {
  props: {
    headers: Array,
    filteredTableResults: Array
  }
}
</script>