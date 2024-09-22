<template>
	<v-menu v-model="downloadMenu" :close-on-content-click="false" :location="menuLocation" transition="slide-x-reverse-transition" width="320">
		<template v-slot:activator="{ props }">
			<slot name="activator" v-bind="{ props }"></slot>
		</template>

		<v-expansion-panels variant="accordion" class="my-1">
			<!-- Format Selection Panel -->
			<v-expansion-panel title="Download Sankey">
				<v-expansion-panel-text>
					<v-btn-toggle v-model="format" variant="text" color="secondary" density="compact" mandatory>
						<v-btn v-for="(item, i) in items" :key="i" :value="item.value" rounded="0">
							<v-icon start :icon="item.icon" />
							{{ item.text }}
						</v-btn>
					</v-btn-toggle>

					<v-btn class="mt-3" color="secondary" @click="downloadSankey" block flat> Download </v-btn>
				</v-expansion-panel-text>
			</v-expansion-panel>

			<!-- Download Reads Panel -->
			<v-expansion-panel title="Download Reads">
				<v-expansion-panel-text>
					<div class="text-caption mb-3">
						Download reads for Tax ID: <strong>{{ taxonId }}</strong>
					</div>
					<v-btn color="secondary" @click="downloadReads" block flat> Download Reads </v-btn>
				</v-expansion-panel-text>
			</v-expansion-panel>
		</v-expansion-panels>
	</v-menu>
</template>

<script>
export default {
	props: {
		menuLocation: {
			type: String,
			default: "bottom end",
		},
		taxonId: {
			type: String,
			required: true,
		},
	},
	data: () => ({
		downloadMenu: false, // Show/hide menu
		format: "png", // Default selected format png
		items: [
			{ text: "JPG", value: "jpg", icon: "$image" },
			{ text: "PNG", value: "png", icon: "$fileImage" },
			{ text: "HTML", value: "html", icon: "$codeTags" },
		],
	}),
	methods: {
		downloadSankey() {
			this.downloadMenu = false;
			this.$emit("format-selected", {
				format: this.format,
				filename: `sankey_diagram_taxID_${this.taxonId}`,
			});
		},

		// FIXME: Implement function for downloading taxon ID specific reads
		downloadReads() {
			console.log("Download Reads triggered"); // FIXME
			// Include taxID in filename
		},
	},
};
</script>
