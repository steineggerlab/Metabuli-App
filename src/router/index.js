import { createRouter, createWebHashHistory } from 'vue-router';
import SearchPage from '../views/SearchPage.vue';
import CustomDatabasePage from "../views/CustomDatabasePage.vue";
import ResultsPage from '../views/ResultsPage.vue';
import HistoryPage from '@/views/HistoryPage.vue';
import QualityControlPage from '@/views/QualityControlPage.vue';

const routes = [
	{
		path: "/",
		name: "Home",
		redirect: "/search", // Redirect to a default route if needed
	},
	{
		path: "/search",
		name: "SearchPage",
		component: SearchPage,
	},
	{
		path: "/custom-database",
		name: "CustomDatabasePage",
		component: CustomDatabasePage,
	},
	{
		path: "/results",
		name: "ResultsPage",
		component: ResultsPage,
	},
	{
		path: "/history",
		name: "HistoryPage",
		component: HistoryPage,
	},
	{
		path: "/quality-control",
		name: "QualityControlPage",
		component: QualityControlPage,
	}
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;
