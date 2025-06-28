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
import 'github-markdown-css/github-markdown.css'; // Import GitHub Markdown CSS for styling
import TaxoView from "taxoview";

loadFonts()

window.document.title = "Metabuli Search";

const app = createApp(App);

app.use(TaxoView);
app.use(router); // Use the router
app.use(vuetify); // Use Vuetify

app.mount('#app');
