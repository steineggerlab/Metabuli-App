<template>
	<div>
		<!-- SEARCH SETTINGS PANEL -->
		<v-container>
			<v-card>
				<v-toolbar image="assets/toolbar_background.png" class="custom-toolbar" density="compact">
					Custom Database
					<v-spacer></v-spacer>

					<div>
						<v-btn rounded="xs" @click="showReadme=true" variant="tonal"> MANUAL </v-btn>

						<!-- ReadMe Manual Bottom Sheet -->
						<v-bottom-sheet class="markdown-body" v-model="showReadme">
							<v-card>
								<v-card-text style="max-height: 90vh; overflow-y: auto;">
									<div v-html="readmeHtml"></div>
								</v-card-text>
								<v-card-actions>
									<v-spacer></v-spacer>
									<v-btn text @click="showReadme=false">Close</v-btn>
								</v-card-actions>
							</v-card>
						</v-bottom-sheet>
					</div>

					<!-- TABS -->
					<template v-slot:extension>
						<v-tabs v-model="activeTab">
							<v-tab v-for="item in tabItems" :text="item.title" :key="item.value" :value="item.value"></v-tab>
						</v-tabs>
					</template>
				</v-toolbar>
				
			<v-tabs-window v-model="activeTab">
					<!-- NEW DATABASE TAB -->
					<v-tabs-window-item transition="fade-transition" reverse-transition="fade-transition" :value="tabItems[0].value">
						<NewDatabaseTab
							@job-started="emitJobStarted"
							@job-completed="emitJobCompleted"
							@job-aborted="emitJobAborted"
							@backend-realtime-output="emitBackendRealtimeOutput"
							@job-timed-out="emitJobTimedOut"
							@trigger-snackbar="triggerSnackbar"
						></NewDatabaseTab>
					</v-tabs-window-item>

					<!-- UPDATE DATABASE TAB-->
					<v-tabs-window-item transition="fade-transition" reverse-transition="fade-transition" :value="tabItems[1].value">
						<UpdateDatabaseTab
						@job-started="emitJobStarted" 
						@job-completed="emitJobCompleted" 
						@job-aborted="emitJobAborted" 
						@backend-realtime-output="emitBackendRealtimeOutput"
						@trigger-snackbar="triggerSnackbar">
					</UpdateDatabaseTab>
					</v-tabs-window-item>
				</v-tabs-window>
			</v-card>
			
			<!-- Snackbar -->
			<v-snackbar v-model="snackbar.show" :timeout="snackbar.timeout" location="top" color="white">
				<v-icon :color="snackbar.color" :icon="`$${snackbar.icon}`"></v-icon>
				{{ snackbar.message }}
				<template v-slot:actions>
					<v-btn v-if="snackbar.buttonText" :color="snackbar.color" variant="text" @click="handleSnackbarAction">{{ snackbar.buttonText }}</v-btn>
					<v-btn v-else :color="snackbar.color" variant="text" @click="snackbar.show = false"> Close </v-btn>
				</template>
			</v-snackbar>
		</v-container>
	</div>
</template>

<script>
import NewDatabaseTab from "./NewDatabaseTab.vue";
import UpdateDatabaseTab from "./UpdateDatabaseTab.vue";
import { loadMarkdownAsHtml } from "@/plugins/markdownLoader";

export default {
	name: "CustomDatabaseSetting",
	components: {
		NewDatabaseTab,
		UpdateDatabaseTab
	},
	data: () => ({
		activeTab: "newDatabase",
		tabItems: [
			{ title: "New Database", value: "newDatabase" },
			{ title: "Update Database", value: "updateDatabase" },
		],
		snackbar: {
			show: false,
			message: "",
			color: "",
			icon: "",
			buttonText: "",
			action: null,
			timeout: 4000,
		},

		// ReadMe Manual Handling
		showReadme: false,
		readmeHtml: "",
	}),
	created() {
		// if URL has ?tab=updateDatabase, switch to that pane
		const t = this.$route.query.tab;
		if (t === "updateDatabase" || t === "newDatabase") {
			this.activeTab = t;
		}
	},
	watch: {
		// keep URL in sync if user clicks the other tab manually
		activeTab(n) {
			this.$router.replace({ query: { ...this.$route.query, tab: n } });
		},
	},
	methods: {
		// Cascade emit from tabs
		emitJobStarted(bool) {
			this.$emit("job-started", bool);
		},
		emitJobCompleted() {
			this.$emit("job-completed");
		},
		emitBackendRealtimeOutput(string) {
			this.$emit("backend-realtime-output", string);
		},
		emitJobTimedOut() {
			this.$emit("job-timed-out");
		},
		emitJobAborted() {
			this.$emit("job-aborted");
		},

		// Functions managing snackbar
		triggerSnackbar(message, color = "info", icon = "info", buttonText = "", action = null) {
			if (this.snackbar.show) return; // If multiple snackbars are triggered, show the first one

			this.snackbar.message = message;
			this.snackbar.color = color;
			this.snackbar.icon = icon;
			this.snackbar.buttonText = buttonText;
			this.snackbar.action = action;

			this.snackbar.show = true;
		},
		handleSnackbarAction() {
			if (this.snackbar.action) {
				this.snackbar.action();
			}
			this.snackbar.show = false;
		},
	},

	async mounted() {
		try {
			this.readmeHtml = await loadMarkdownAsHtml("docs/createdb.md");
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

<style scoped>
/* STYLE APPLYING TO BOTH TABS */
.search-setting-title {
	font-family: Roboto;
	font-weight: 600;
	font-size: 16px;
	letter-spacing: 2px;
	text-transform: uppercase;
}

.v-col {
	padding-bottom: 0px;
}
.v-row {
	margin-top: 0px;
	margin-bottom: 0px;
}

.custom-snackbar {
	top: 64px !important; /* Adjust this value to match your app bar height */
}

.v-col {
	padding-bottom: 0px;
}
.v-row {
	margin-top: 0px;
	margin-bottom: 0px;
}

.search-required-fields .v-col {
	padding-top: 0px;
}
.search-required-fields .v-list-subheader {
	min-height: 30px;
}
.search-required-fields .search-files .v-row {
	margin-bottom: 12px;
}
.search-required-fields .search-files .filename-col {
	padding-left: 0px;
}
:deep(.v-field__input),
:deep(.v-text-field__suffix) {
	padding-top: 4px !important;
	padding-bottom: 4px !important;
	min-height: 30px;
	font-size: 12px;
}

.filename-chip {
	padding-left: 8px;
	align-items: center;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}
</style>
