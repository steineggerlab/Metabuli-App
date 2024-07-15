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
          <v-list-item title="Navigation drawer"></v-list-item>
        </v-list>
    </v-navigation-drawer>
    
    <v-main>
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
    drawer: false,
    group: null,
    items: [
    {
          title: 'Foo',
          value: 'foo',
        },
        {
          title: 'Bar',
          value: 'bar',
        },
        {
          title: 'Fizz',
          value: 'fizz',
        },
        {
          title: 'Buzz',
          value: 'buzz',
        },
      ],
  }),

  watch: {
      group () {
        this.drawer = false
      },
    },
    
}
</script>
