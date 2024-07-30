<template>
  <v-app>
    <v-app-bar>
      <!-- NAVIGATION DRAWER TOGGLE -->
      <div class="nav-icon-wrapper">
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
        <v-badge
          v-show="!drawer && jobCompleted && !checkedResults"
          dot
          color="red"
          overlap
          class="nav-icon-badge"
        ></v-badge>
      </div>

      <!-- METABULI TITLE + LOGO -->
      <div class="d-flex ga-1" style="align-items: center;">
        <div class="flex-grow-1">
          <v-app-bar-title>Metabuli</v-app-bar-title>
        </div>
        <v-img src="assets/marv_metabuli_small.png" width="50px"></v-img>
      </div>

      <v-spacer></v-spacer>

      <!-- GITHUB LINK BUTTONS -->
      <v-btn href="https://github.com/steineggerlab/Metabuli" target="_blank">GitHub</v-btn>
      <v-btn href="https://steineggerlab.com/en/" target="_blank">Steinegger Lab</v-btn>

    </v-app-bar>

    <v-navigation-drawer v-model="drawer">
      <v-list nav density="compact">
        <!-- DATA INPUT NAVIGATION ITEM -->
        <router-link
          :to="items[0].path"
          class="v-list-item--link no-underline"
        >
          <v-list-item
            class="nav-item" 
            :class="{ active: $route.path === items[0].path }"
            @mouseover="hover = items[0].path"
            @mouseleave="hover = ''"
            :style="{ backgroundColor: hover === items[0].path ? '#f0f0f0' : ($route.path === items[0].path ? '#d3d3d3' : 'transparent') }"
          >
            <template v-slot:prepend>
              <v-icon :icon="`$${items[0].icon}`"></v-icon>
            </template>
            <span>{{ items[0].title }}</span>
          </v-list-item>
        </router-link>

        <!-- RESULTS NAVIGATION ITEM -->
        <v-slide-y-transition>
          <router-link
            v-if="jobCompleted"
            :to="items[1].path"
            class="v-list-item--link no-underline"
          >
            <v-list-item
              class="nav-item"
              :class="{ active: $route.path === items[1].path }"
              @click="handleResultsClick"
              @mouseover="hover = items[1].path"
              @mouseleave="hover = ''"
              :style="{ backgroundColor: hover === items[1].path ? '#f0f0f0' : ($route.path === items[1].path ? '#d3d3d3' : 'transparent') }"
            >
              <template v-slot:prepend>
                <v-icon :icon="`$${items[1].icon}`"></v-icon>
              </template>
              <span>{{ items[1].title }}</span>

              <template v-slot:append>
                <v-badge 
                  v-if="!checkedResults"
                  dot
                  color="red"
                  inline
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
  name: 'App',

  components: {
    //
  },

  data: () => ({
    drawer: true,
    hover: '',
    items: [
      { title: 'Data Input', path: '/search', icon: 'upload' },
      { title: 'Results', path: '/results', icon: 'chartBar' }
    ],
    jobCompleted: false,
    completedJob: {},
    checkedResults: false
  }),

  computed: {
    filteredItems() {
      if (this.jobCompleted) {
        return this.items;
      }
      return this.items.filter(item => item.title !== 'Results');
    }
  },

  methods: {
    handleJobComplete(payload) {
      this.jobCompleted = true;
      this.checkedResults = false;
      this.completedJob = { 
        outdir: payload.outdir, 
        jobid: payload.jobid
      }
    },
    handleResultsClick(event) {
      this.checkedResults = true;
      event.preventDefault();
      this.$router.push({
        name: 'ResultsPage',
        query: this.completedJob
      });
    },
  },
}
</script>

<style>
.v-app-bar.v-toolbar {
  padding-inline-start: 4px;
}
.custom-toolbar {
  color: white;
  font-size: 20px;
  background-image: url('https://search.foldseek.com/e5408e4113ed61a79c6f.png');
  padding-left: 20px;
}

.no-underline {
  text-decoration: none;
  color: inherit;
}

.v-list-item--link {
  display: block;
}

.v-list-item .v-icon {
  margin-right: 10px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px;
}

.nav-item.active {
  background-color: #d3d3d3;
}

.nav-icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.nav-icon-badge {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
