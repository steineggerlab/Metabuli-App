<!-- src/views/LandingPage.vue -->
<template>
  <v-container class="fill-height d-flex flex-column align‐center justify‐center">
    <h1 class="display‐1">Welcome to Metabuli App</h1>
    <p class="subtitle‐1">
      Easy, interactive metagenomic taxonomic profiling—right on your desktop.
    </p>
    <v-btn color="primary" class="mt‐6" @click="$router.push('/search')">
      Get Started
    </v-btn>
  </v-container>
</template>

<script>
export default {
  name: "LandingPage",
};
</script>

<style scoped>
h1 {
  margin-bottom: .5rem;
}

p {
  margin-bottom: 2rem;
}
</style>
