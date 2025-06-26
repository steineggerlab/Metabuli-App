<template>
	<v-app>
		<v-app-bar class="px-1">
			<!-- METABULI LOGO + TITLE -->
			<v-btn icon readonly rounded="xl">
				<v-img src="assets/marv_metabuli_small.png" width="45px" contain></v-img>
			</v-btn>
			<v-app-bar-title class="text-overline font-weight-medium ml-3"
				style="font-size: 15px !important">Metabuli</v-app-bar-title>

			<v-spacer></v-spacer>

			<!-- LINK BUTTONS -->
			<v-btn href="https://metabuli.steineggerlab.workers.dev/" target="_blank">Database Download</v-btn>
			<v-btn href="https://steineggerlab.com/en/" target="_blank">Steinegger Lab</v-btn>
			<v-btn href="https://github.com/steineggerlab/Metabuli" target="_blank" icon="$github"
				density="comfortable"></v-btn>
		</v-app-bar>

		<!-- NAVIGATION DRAWER -->
		<v-navigation-drawer ref="navigationDrawer" :rail="rail" permanent expand-on-hover>
			<v-layout class="d-flex flex-column fill-height">
				<v-list class="flex-grow-1">
					<template v-for="(item, idx) in items" :key="item.path">
						<!-- insert a divider before the History tab (or wherever you want) -->
						<v-divider v-if="idx === 4" />

						<!-- only show Results once jobCompleted is true -->
						<router-link v-if="item.title !== 'Results' || jobCompleted" :to="item.path" class="no-underline">
							<v-list-item class="nav-item" :title="item.title" :prepend-icon="`$${item.icon}`"
								:class="{ active: $route.path === item.path }" @mouseover="hover = item.path" @mouseleave="hover = ''"
								v-ripple @click="item.name === 'ResultsPage' ? handleResultsClick($event) : null" />
						</router-link>
					</template>
				</v-list>

				<!-- HELP NAVIGATION ITEM -->
				<v-list>
					<v-list-item @click="showReadme = true" class="nav-item" title="App User Manual"
						prepend-icon="$informationOutline"></v-list-item>
				</v-list>


			</v-layout>
		</v-navigation-drawer>

		<v-bottom-sheet class="markdown-body" v-model="showReadme">
			<v-card>
				<v-card-text style="max-height: 90vh; overflow-y: auto;">
					<div v-html="readmeHtml"></div>
				</v-card-text>
				<v-card-actions>
					<v-spacer></v-spacer>
					<v-btn text @click="showReadme = false">Close</v-btn>
				</v-card-actions>
			</v-card>
		</v-bottom-sheet>

		<v-main>
			<router-view class="h-100" @job-complete="handleJobComplete" @report-uploaded="handleReportUpload"></router-view>
		</v-main>
	</v-app>
</template>

<script>
import { loadMarkdownAsHtml } from "@/plugins/markdownLoader";

export default {
	name: "App",

	components: {
		//
	},

	data: () => ({
		// Navigation drawer
		rail: true,
		hover: "",
		items: [
			{ title: "Data Input", path: "/search", icon: "upload" },
			{ title: "Quality Control", path: "/quality-control", icon: "filter" },
			{ title: "Custom Database", path: "/custom-database", icon: "database" },
			{ title: "Results", path: "/results", icon: "chartBar" },
			{ title: "History", path: "/history", icon: "history" },
		],
		showReadme: false,
		readmeHtml: "",

		// Job completion handling
		jobCompleted: false,
		jobType: "",
	}),

	watch: {
		//
	},

	methods: {
		handleJobComplete() {
			// Expose Results Tab navigation drawer item
			this.jobCompleted = true;

			// Indicates jobType needed to show krona tab
			this.jobType = "runSearch";

			// Automatically route to Results Page on job completion
			this.$router.push({ name: "ResultsPage" });
		},

		handleReportUpload() {
			// Expose Results Tab navigation drawer item
			this.jobCompleted = true;

			// Indicates jobType needed to hide krona tab
			this.jobType = "uploadReport";

			// Automatically route to Results Page on job completion
			this.$router.push({ name: "ResultsPage" });
		},
		handleResultsClick(event) {
			event.preventDefault(); // Prevents default action interfering custom navigation logic

			this.$router.push({ name: "ResultsPage" });
		},
	},
	async mounted() {
		try {
			this.readmeHtml  = await loadMarkdownAsHtml("README.md");
		} catch (err) {
			console.error("Failed to load README.md:", err);
			// Fallback content
			this.readmeHtml = `
				<p>
					⚠️ Ran into an error while loading the instructions.<br>
					You can still view them at
					<a href="https://github.com/steineggerlab/Metabuli-App" target="_blank" style="text-decoration: underline;">
						steineggerlab/Metabuli-App</a>
				</p>
			`;
		}
	},
};
</script>

<style>
.v-app-bar.v-toolbar {
	padding-inline-start: 4px;
}

.custom-toolbar {
	color: white;
	font-size: 20px;
	background-repeat: repeat !important;
	background-size: contain !important;
	padding-left: 20px;
	padding-right: 8px;
}

.marv-metabuli-opaque {
	opacity: 0.5;
}

/* Navigation Drawer Item */
.no-underline {
	text-decoration: none;
	color: inherit;
}

.nav-item:hover {
	background-color: rgba(21, 101, 192, 0.1);
}

.nav-item.active {
	color: #1565c0;
}

.badge-icon {
	position: absolute;
	top: 10px;
	right: 10px;
}
</style>
