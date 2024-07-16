<template>
  <v-app>
    <v-app-bar>
      <v-app-bar-nav-icon></v-app-bar-nav-icon>
      <v-app-bar-title>Metabuli</v-app-bar-title>
      <v-spacer></v-spacer>

      <v-btn>GitHub</v-btn>


      <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>

    </v-app-bar>

    <v-navigation-drawer>
      <v-list>
        <v-list-item>
          <router-link to="/search" class="v-list-item--link">Search</router-link>
        </v-list-item>
        <v-list-item>
          <router-link to="/results" class="v-list-item--link">Results</router-link>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    
    <v-main>
      <router-view></router-view>
      <HelloWorld/>
    </v-main>
  </v-app>
</template>

<script>

import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'App',

  components: {
    HelloWorld,
  },

  data: () => ({
    //
  }),
    
}
</script>
