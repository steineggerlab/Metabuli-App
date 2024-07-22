<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-nav-icon @click="toggleDrawer"></v-app-bar-nav-icon>
      <v-app-bar-title >Metabuli</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn href="https://github.com/steineggerlab/Metabuli" target="_blank">GitHub</v-btn>
      <v-btn href="https://steineggerlab.com/en/" target="_blank">Steinegger Lab</v-btn>

      <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" :width="'180'">
      <v-list>
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
            <v-icon left>{{ items[0].icon }}</v-icon>
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
              <v-icon left>{{ items[1].icon }}</v-icon>
              <span>{{ items[1].title }}</span>
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
      { title: 'Data Input', path: '/search', icon: 'mdi-cloud-upload' },
      { title: 'Results', path: '/results', icon: 'mdi-chart-bar' }
    ],
    jobCompleted: false,
    completedJob: {}
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
    toggleDrawer() {
      this.drawer = !this.drawer;
    },
    handleJobComplete(payload) {
      this.jobCompleted = true;
      this.completedJob = { 
        outdir: payload.outdir, 
        jobid: payload.jobid 
      }
    },
    handleResultsClick(event) {
      event.preventDefault();
      this.$router.push({
        name: 'ResultsPage',
        query: this.completedJob
      });
    },
  },
}
</script>

<style scoped>
.no-underline {
  text-decoration: none;
  color: inherit;
}

.v-list-item--link {
  display: block;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 10px;
}

.v-icon {
  margin-right: 10px;
}

.nav-item.active {
  background-color: #d3d3d3;
}


</style>
