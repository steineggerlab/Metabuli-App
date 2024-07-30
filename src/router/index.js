import { createRouter, createWebHashHistory } from 'vue-router';
import SearchPage from '../views/SearchPage.vue';
import ResultsPage from '../views/ResultsPage.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    redirect: '/search' // Redirect to a default route if needed
  },
  {
    path: '/search',
    name: 'SearchPage',
    component: SearchPage
  },
  {
    path: '/results',
    name: 'ResultsPage',
    component: ResultsPage
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
