<template>
	<div>
		<SearchSetting @job-started="showDialog" @job-aborted="hideDialog" @job-completed="handleJobComplete"
			@backend-realtime-output="updateRealtimeOutput" />

		<!-- Loading Dialog -->
		<v-dialog v-model="loadingDialog" persistent>
			<v-card class="mx-auto" width="700">
				<v-list>
					<!-- Title -->
					<v-list-item class="font-weight-bold text-h6 py-0 pl-8 text-button">
						<span>Processing Job...</span>
						<template v-slot:append>
							<v-img src="assets/marv_metabuli_animated.gif" width="60"></v-img>
						</template>
					</v-list-item>

					<!-- Hide Log Output + Cancel Button on Load Sample -->
					<div v-if="!isSampleJob">
						<!-- Display Real-time Output -->
						<v-list-item class="pt-1">
							<template v-slot:subtitle>
								<v-textarea variant="outlined" v-if="backendOutput" v-model="backendOutput" label="Command Line Output"
									rows="15" no-resize readonly hide-details="true" bg-color="white" class="mt-3 mx-0 text-caption"
									ref="outputTextarea"></v-textarea>
							</template>
						</v-list-item>

						<!-- Cancel Button -->
						<v-card-actions>
							<v-spacer></v-spacer>
							<v-btn variant="plain" color="primary" @click="cancelBackend">Cancel</v-btn>
						</v-card-actions>
					</div>
				</v-list>
			</v-card>
		</v-dialog>

		<!-- Footer: Reference to Paper -->
		<v-container class="pt-0">
			<v-card>
				<v-toolbar image="assets/toolbar_background.png" class="custom-toolbar" density="compact">Reference</v-toolbar>
				<v-card-text>
					Kim J, Steinegger M.
					<a href="https://www.nature.com/articles/s41592-024-02273-y" target="_blank" class="text-blue-accent-4">
						Metabuli: sensitive and specific metagenomic classification via joint analysis of amino acid and DNA.
					</a>
					Nature Methods (2024).
				</v-card-text>
			</v-card>
		</v-container>
	</div>
</template>

<script>
import SearchSetting from "@/components/search-page/SearchSetting.vue";

export default {
	name: "SearchPage",
	components: {
		SearchSetting,
	},
	data() {
		return {
			loadingDialog: false,
			isSampleJob: false,
			backendOutput: "", // Data property to store real-time output
		};
	},
	methods: {
		// Show/hide dialog
		showDialog(isSample) {
			this.loadingDialog = true;
			this.isSampleJob = isSample;
		},
		hideDialog() {
			this.loadingDialog = false;
		},

		// Loading dialog log textarea
		updateRealtimeOutput(output) {
			this.backendOutput = output; // Update real-time output
			this.$nextTick(() => {
				// Scroll to the bottom
				const textarea = this.$refs.outputTextarea.$el.querySelector("textarea");
				textarea.scrollTop = textarea.scrollHeight;
			});
		},

		// Job handling
		handleJobComplete(completedJob) {
			// Close loading dialog
			this.hideDialog();

			// Show results tab & badge in navigation drawer
			// Show/hide krona tab depending on jobType
			if (completedJob.jobType === "runSearch") {
				this.$emit("job-complete");
			} else if (completedJob.jobType === "uploadReport") {
				this.$emit("report-uploaded");
			}
		},
		cancelBackend() {
			this.hideDialog();
			window.electron.cancelBackend();
		},
	},
};
</script>

<style scoped>
/* Log textarea */
:deep(.v-textarea .v-field__input) {
	font-family: Roboto;
	background-color: white;
	font-size: 12px;
	margin-top: 16px;
	/* -webkit-mask-image: none; */
}
</style>
