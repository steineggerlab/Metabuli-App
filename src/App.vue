<template>
  <v-app>
    <v-app-bar class="px-1">
      <!-- METABULI LOGO + TITLE -->
      <v-btn icon readonly rounded="xl">
        <v-img
          src="assets/marv_metabuli_small.png"
          width="45px"
          contain
        ></v-img>
      </v-btn>
      <v-app-bar-title
        class="text-overline font-weight-medium ml-3"
        style="font-size: 15px !important"
        >Metabuli</v-app-bar-title
      >

      <v-spacer></v-spacer>

      <!-- LINK BUTTONS -->
      <v-btn href="https://metabuli.steineggerlab.workers.dev/" target="_blank"
      >Database Download</v-btn
      >
      <v-btn href="https://steineggerlab.com/en/" target="_blank"
      >Steinegger Lab</v-btn
      >
      <v-btn href="https://github.com/steineggerlab/Metabuli" target="_blank"
      icon="$github" density="comfortable"
        ></v-btn
      >
    </v-app-bar>

    <!-- NAVIGATION DRAWER -->
    <v-navigation-drawer
      ref="navigationDrawer"
      :rail="rail"
      permanent
      expand-on-hover
    >
      <v-list>
        <!-- DATA INPUT NAVIGATION ITEM -->
        <router-link :to="items[0].path" class="no-underline">
          <v-list-item
            class="nav-item"
            :title="items[0].title"
            :prepend-icon="`$${items[0].icon}`"
            :class="{ active: $route.path === items[0].path }"
            @mouseover="hover = items[0].path"
            @mouseleave="hover = ''"
            v-ripple
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
              :title="items[1].title"
              :prepend-icon="`$${items[1].icon}`"
              :class="{ active: $route.path === items[1].path }"
              @click="handleResultsClick"
              @mouseover="hover = items[1].path"
              @mouseleave="hover = ''"
              v-ripple
            >
              <template v-slot:append>
                <v-badge
                  v-if="!checkedResults"
                  dot
                  color="red"
                  class="badge-icon"
                ></v-badge>
              </template>
            </v-list-item>
          </router-link>
        </v-slide-y-transition>

        <v-divider></v-divider>
        <!-- JOB HISTORY NAVIGATION ITEM -->
        <router-link :to="items[2].path" class="no-underline">
          <v-list-item
            class="nav-item"
            :title="items[2].title"
            :prepend-icon="`$${items[2].icon}`"
            :class="{ active: $route.path === items[2].path }"
            @mouseover="hover = items[2].path"
            @mouseleave="hover = ''"
            v-ripple
          ></v-list-item>
        </router-link>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <router-view
        class="h-100"
        @job-complete="handleJobComplete"
        @report-uploaded="handleReportUpload"
      ></router-view>
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
    // Navigation drawer
    rail: true,
    hover: "",
    items: [
      { title: "Data Input", path: "/search", icon: "upload" },
      { title: "Results", path: "/results", icon: "chartBar" },
      { title: "History", path: "/history", icon: "history" },
    ],

    // Job completion handling
    jobCompleted: false,
    checkedResults: false,
    jobType: "",
  }),

  watch: {
    $route(to) {
      if (to.path === "/results") {
        // Detect route changes to the results page regardless of how it's accessed
        // Remove red badge on nav drawer item
        this.checkedResults = true;
      }
    },
  },

  methods: {
    handleJobComplete() {
      // Expose Results Tab navigation drawer item
      this.jobCompleted = true;
      // Expose red badge
      this.checkedResults = false;

      // Indicates jobType needed to show krona tab
      this.jobType = "runSearch";
    },

    handleReportUpload() {
      // Expose Results Tab navigation drawer item
      this.jobCompleted = true;
      // Expose red badge
      this.checkedResults = false;

      // Indicates jobType needed to hide krona tab
      this.jobType = "uploadReport";
    },
    handleResultsClick(event) {
      event.preventDefault(); // Prevents default action interfering custom navigation logic

      this.$router.push({ name: "ResultsPage" });
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

/* Navigation Drawer Item */
.no-underline {
  text-decoration: none;
  color: inherit;
}
.nav-item {
  display: flex;
  align-items: center;
}
.nav-item:hover {
  background-color: rgba(21, 101, 192, 0.1);
}
.nav-item.active {
  color: #1565c0;
}

.badge-icon {
  position: absolute;
  top: 10px;
  right: 10px;
}
</style>
