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

    <v-navigation-drawer v-model="drawer">
      <v-list>
        <router-link
          v-for="item in items"
          :key="item.title"
          :to="item.path"
          class="v-list-item--link no-underline"
        >
          <v-list-item
            class="nav-item"
            :class="{ active: $route.path === item.path }"
            @mouseover="hover = item.path"
            @mouseleave="hover = ''"
            :style="{ backgroundColor: hover === item.path ? '#f0f0f0' : ($route.path === item.path ? '#d3d3d3' : 'transparent') }"
          >
            <v-icon left>{{ item.icon }}</v-icon>
            <span>{{ item.title }}</span>
          </v-list-item>
        </router-link>
      </v-list>
    </v-navigation-drawer>
    
    <v-main>
      <router-view></router-view>
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
      { title: 'Data Input', path: '/search', icon: 'mdi-magnify' },
      { title: 'Results', path: '/results', icon: 'mdi-view-list' }
    ]
  }),

  methods: {
    toggleDrawer() {
      this.drawer = !this.drawer;
    }
  }
    
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
