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