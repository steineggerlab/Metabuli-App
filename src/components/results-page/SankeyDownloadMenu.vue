<template>
	<div>
		<v-menu v-model="downloadMenu" :close-on-content-click="false" :location="menuLocation" transition="slide-x-reverse-transition" width="320">
			<template v-slot:activator="{ props }">
				<slot name="activator" v-bind="{ props }"></slot>
			</template>

			<v-expansion-panels v-model="activePanel" variant="accordion" class="my-1" mandatory>
				<!-- Format Selection Panel -->
				<v-expansion-panel>
					<div class="pt-4 pb-2 px-6" style="font-size: 0.9375rem">Download Sankey Diagram</div>
					<v-expansion-panel-text>
            <div class="text-caption mb-1">Select Format</div>
						<v-btn-toggle v-model="format" variant="text" color="secondary" density="compact" mandatory>
							<v-btn v-for="(item, i) in items" :key="i" :value="item.value" rounded="0">
								<v-icon start :icon="item.icon" />
								{{ item.text }}
							</v-btn>
						</v-btn-toggle>

						<v-btn class="mt-3" color="secondary" @click="downloadSankey" block flat>Download</v-btn>
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
		</v-menu>
	</div>
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
		},
	},
	data: () => ({
		downloadMenu: false, // Show/hide menu
		activePanel: [0],
		format: "png", // Default selected format png
		items: [
			{ text: "JPG", value: "jpg", icon: "$image" },
			{ text: "PNG", value: "png", icon: "$fileImage" },
			{ text: "SVG", value: "svg", icon: "$codeTags" },
		],
	}),

	methods: {
		downloadSankey() {
			this.downloadMenu = false;

			const filename = this.taxonId ? `sankey_diagram_taxID_${this.taxonId}` : "sankey_diagram";

			this.$emit("format-selected", {
				format: this.format,
				filename: filename,
			});
		},
	},
};
</script>
