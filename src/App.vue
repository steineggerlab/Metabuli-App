<template>
  <v-app>
    <v-app-bar>
      <!-- NAVIGATION DRAWER TOGGLE -->
      <v-app-bar-nav-icon @click.stop="rail = !rail"></v-app-bar-nav-icon>

      <!-- METABULI TITLE + LOGO -->
      <div class="d-flex gc-1" style="align-items: center">
        <div class="flex-grow-1">
          <v-app-bar-title>Metabuli</v-app-bar-title>
        </div>
        <v-img src="assets/marv_metabuli_small.png" width="50px"></v-img>
      </div>

      <v-spacer></v-spacer>

      <!-- GITHUB LINK BUTTONS -->
      <v-btn href="https://github.com/steineggerlab/Metabuli" target="_blank"
        >GitHub</v-btn
      >
      <v-btn href="https://steineggerlab.com/en/" target="_blank"
        >Steinegger Lab</v-btn
      >
    </v-app-bar>

    <!-- NAVIGATION DRAWER -->
    <v-navigation-drawer
      ref="navigationDrawer"
      :rail="rail"
      permanent
      @click="rail = false"
    >
      <v-list>
        <!-- DATA INPUT NAVIGATION ITEM -->
        <router-link :to="items[0].path" class="no-underline">
          <v-list-item
            class="nav-item"
            :prepend-icon="`$${items[0].icon}`"
            :class="{ active: $route.path === items[0].path }"
            @mouseover="hover = items[0].path"
            @mouseleave="hover = ''"
            :style="{
              backgroundColor:
                hover === items[0].path ? '#f0f0f0' : 'transparent',
            }"
            :title="items[0].title"
          ></v-list-item>
        </router-link>

        <!-- RESULTS NAVIGATION ITEM -->
        <v-slide-y-transition>
          <router-link
            v-if="jobCompleted"
            :to="items[1].path"
            class="no-underline"
          >
            <v-list-item
              class="nav-item"
              :prepend-icon="`$${items[1].icon}`"
              :class="{ active: $route.path === items[1].path }"
              @click="handleResultsClick"
              @mouseover="hover = items[1].path"
              @mouseleave="hover = ''"
              :style="{
                backgroundColor:
                  hover === items[1].path ? '#f0f0f0' : 'transparent',
              }"
              :title="items[1].title"
            >
              <template v-slot:append>
                <v-badge
                  v-if="!checkedResults"
                  dot
                  color="red"
                  :inline="!rail"
                  :class="{ 'badge-icon': rail }"
                ></v-badge>
              </template>
            </v-list-item>
          </router-link>
        </v-slide-y-transition>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view @job-complete="handleJobComplete"></router-view>
    </v-main>
  </v-app>
</template>

<script>
export default {
  name: "App",

  components: {
    //
  },

  data: () => ({
    rail: true,
    hover: "",
    items: [
      { title: "Data Input", path: "/search", icon: "upload" },
      { title: "Results", path: "/results", icon: "chartBar" },
    ],
    jobCompleted: false,
    completedJob: {},
    checkedResults: false,
  }),

  computed: {
    filteredItems() {
      if (this.jobCompleted) {
        return this.items;
      }
      return this.items.filter((item) => item.title !== "Results");
    },
  },

  methods: {
    handleJobComplete(payload) {
      this.jobCompleted = true;
      this.checkedResults = false;
      this.completedJob = {
        outdir: payload.outdir,
        jobid: payload.jobid,
        isSample: payload.isSample,
      };
    },
    handleResultsClick(event) {
      this.checkedResults = true;
      event.preventDefault();
      this.$router.push({
        name: "ResultsPage",
        query: this.completedJob,
      });
    },
  },
};
</script>

<style>
.v-app-bar.v-toolbar {
  padding-inline-start: 4px;
}
.custom-toolbar {
  color: white;
  font-size: 20px;
  background-image: url("https://search.foldseek.com/e5408e4113ed61a79c6f.png");
  padding-left: 20px;
}

.no-underline {
  text-decoration: none;
  color: inherit;
}

.nav-item {
  display: flex;
  align-items: center;
}
.nav-item.active {
  color: #304ffe;
}

.badge-icon {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>
