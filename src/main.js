// Polyfill for Array.prototype.at, needed for v-dialog
if (!Array.prototype.at) {
    Array.prototype.at = function(n) {
      n = Math.trunc(n) || 0;
      if (n < 0) n += this.length;
      if (n < 0 || n >= this.length) return undefined;
      return this[n];
    };
  }

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'; // Import the router configuration
import vuetify from './plugins/vuetify'
import { loadFonts } from './plugins/webfontloader'

loadFonts()


const app = createApp(App);

app.use(router); // Use the router
app.use(vuetify); // Use Vuetify

app.mount('#app');