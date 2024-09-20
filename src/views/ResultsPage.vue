<template>
	<v-card class="d-flex flex-column flex-shrink-1 h-100">
		<v-tabs v-model="tab" color="primary">
			<v-tab value="table">Table</v-tab>
			<v-tab value="sankey">Sankey</v-tab>
			<v-tab value="krona" v-if="kronaContent">Krona</v-tab>
		</v-tabs>

		<v-card-text class="d-flex flex-column h-100 pb-0">
			<v-tabs-window v-model="tab" class="h-100">
				<!-- TABLE TAB -->
				<v-tabs-window-item value="table" class="h-100">
					<ResultsTable :data="results" class="h-100" />
				</v-tabs-window-item>

				<!-- SANKEY TAB-->
				<v-tabs-window-item value="sankey" class="h-100">
					<!-- TOOLBAR ABOVE SANKEY DIAGRAM -->
					<div class="d-flex justify-space-around my-5 mx-2 gc-1">
						<!-- SEARCH BAR -->
						<div class="d-flex flex-column">
							<v-text-field
								v-model="searchQuery"
								prepend-inner-icon="$magnify"
								density="compact"
								label="Search Name or Taxon ID"
								variant="outlined"
								rounded="lg"
								single-line
								color="indigo"
								clearable
							></v-text-field>
							<div class="d-flex align-center">Click on a node to see lineage and subtree.</div>
						</div>

						<v-spacer></v-spacer>

						<!-- SANKEY DOWNLOAD MENU -->
						<SankeyDownloadMenu @format-selected="emitMainSankeyDownloadFormat">
							<template v-slot:activator="{ props }">
								<v-btn v-bind="props" append-icon="$download" variant="text" rounded> Download </v-btn>
							</template>
						</SankeyDownloadMenu>

						<!-- CONFIGURE SANKEY MENU -->
						<ConfigureSankeyMenu
							:initialTaxaLimit="taxaLimit"
							:maxTaxaLimit="roundedMaxTaxaLimit"
							:initialMinCladeReadsMode="minCladeReadsMode"
							:initialMinCladeReads="minCladeReads"
							:initialShowUnclassified="showUnclassified"
							:initialFigureHeight="figureHeight"
							:initialLabelOption="labelOption"
							:menuLocation="'bottom end'"
							@updateSettings="updateSettings"
						>
							<template v-slot:activator="{ props }">
								<v-btn color="indigo" rounded="xl" v-bind="props">Configure Diagram</v-btn>
							</template>
						</ConfigureSankeyMenu>
					</div>

					<!-- SANKEY DIAGRAM -->
					<SankeyDiagram
						:searchQuery="searchQuery"
						:id="'sankey-svg'"
						:isSubtree="false"
						:instanceId="uniqueInstanceId"
						:rawData="results"
						:taxaLimit="taxaLimit"
						:minCladeReadsMode="minCladeReadsMode"
						:minReads="minCladeReads"
						:showUnclassified="showUnclassified"
						:figureHeight="figureHeight"
						:labelOption="labelOption"
						:showAll="showAll"
						@updateConfigureMenu="updateConfigureMenu"
						@node-click="showDialog"
					/>

					<!-- NODE DETAILS DIALOG -->
					<SankeyNodeDialog v-model="isDialogVisible" :nodeDetails="dialogData" @close-dialog="hideDialog" @download-sankey="handleFormatSelected" class="align-top" />
				</v-tabs-window-item>

				<!-- KRONA TAB -->
				<v-tabs-window-item value="krona" class="h-100">
					<div class="pa-4 tab-fill-height" style="overflow-y: hidden">
						<iframe :srcdoc="kronaContent" style="width: 100%; height: 100%; border: none"></iframe>
					</div>
				</v-tabs-window-item>
			</v-tabs-window>
		</v-card-text>
	</v-card>
</template>

<script>
import SankeyDiagram from "@/components/SankeyDiagram.vue";
import ResultsTable from "@/components/ResultsTable.vue";
import ConfigureSankeyMenu from "@/components/ConfigureSankeyMenu.vue";
import SankeyDownloadMenu from "@/components/SankeyDownloadMenu.vue";
import SankeyNodeDialog from "@/components/SankeyNodeDialog.vue";
import { saveSvgAsPng } from "save-svg-as-png";
import * as d3 from "d3";
import { v4 as uuidv4 } from "uuid";

export default {
	name: "ResultsPage",
	components: {
		ResultsTable,
		SankeyDiagram,
		SankeyDownloadMenu,
		ConfigureSankeyMenu,
		SankeyNodeDialog,
	},

	data() {
		return {
			// Overall
			tab: "TABLE",
			results: [],
			kronaContent: null,
			isSample: null,

			// Sankey Diagram
			uniqueInstanceId: "",
			taxaLimit: 20, // FIXME: refactor, make this into dictionary storing info about configuration
			maxTaxaLimit: 100,
			minCladeReadsMode: "%",
			minCladeReads: 0.01,
			showUnclassified: true,
			figureHeight: 500,
			labelOption: "proportion",
			showAll: false,
			searchQuery: "",

			// Sankey Node Dialog
			isDialogVisible: false,
			dialogData: null,
		};
	},

	computed: {
		roundedMaxTaxaLimit() {
			// Round up maxTaxaLimit to the nearest increment of 5
			return Math.ceil(this.maxTaxaLimit / 5) * 5;
		},
	},

	methods: {
		// Sankey Diagram
		updateSettings(settings) {
			this.showAll = settings.showAll;

			if (settings.showAll) {
				this.taxaLimit = this.maxTaxaLimit;
				this.minCladeReadsMode = "#";
				this.minCladeReads = 0;
				this.showUnclassified = true;
			} else {
				this.taxaLimit = settings.taxaLimit;
				this.minCladeReadsMode = settings.minCladeReadsMode;
				this.minCladeReads = settings.minCladeReads;
				this.showUnclassified = settings.showUnclassified;
			}

			this.figureHeight = settings.figureHeight;
			this.labelOption = settings.labelOption;
		},

		// Sankey Node Dialog
		showDialog(nodeDetails) {
			this.dialogData = nodeDetails;
			this.isDialogVisible = true;
		},
		hideDialog() {
			this.isDialogVisible = false;
		},

		// Sankey Download Functions
		emitMainSankeyDownloadFormat(format) {
			this.handleFormatSelected({ format, sankeyId: "sankey-svg" });
		},
		handleFormatSelected({ sankeyId, format }) {
			switch (format) {
				case "png":
					this.downloadSankeyAsPng(sankeyId);
					break;
				case "jpg":
					this.downloadSankeyAsJpg(sankeyId);
					break;
				case "html":
					this.downloadSankeyAsHtml(sankeyId);
					break;
				default:
					return;
			}
		},
		downloadSankeyAsPng(sankeyId) {
			const sankeySvgElement = document.querySelector(`#${sankeyId}`); // Reference to the SVG ID
			saveSvgAsPng(sankeySvgElement, "sankey-diagram.png");
		},
		async downloadSankeyAsJpg(sankeyId) {
			// Get the SVG element
			const sankeySvgElement = document.querySelector(`#${sankeyId}`); // Reference to the SVG ID
			const svg = d3.select(sankeySvgElement);
			const svgString = new XMLSerializer().serializeToString(svg.node());

			// Set canvas size to match the SVG size
			const svgBBox = svg.node().getBBox();
			const width = svgBBox.width;
			const height = svgBBox.height;

			// Create a canvas element with increased resolution
			const scaleFactor = 3;
			const canvas = document.createElement("canvas");
			canvas.width = width * scaleFactor;
			canvas.height = height * scaleFactor;

			const context = canvas.getContext("2d");
			context.scale(scaleFactor, scaleFactor);

			// Draw white background
			context.fillStyle = "white";
			context.fillRect(0, 0, canvas.width, canvas.height);

			// Create an image and draw the SVG onto the canvas
			const img = new Image();
			img.onload = () => {
				context.drawImage(img, 0, 0);

				// Convert the canvas to a data URL (base64)
				const jpgDataUrl = canvas.toDataURL("image/jpeg", 1.0); // Quality parameter set to maximum (1.0)

				// Create a download link and click it
				const link = document.createElement("a");
				link.href = jpgDataUrl;
				link.download = "sankey_diagram.jpg";
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			};
			img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
		},
		downloadSankeyAsHtml(sankeyId) {
			const svgElement = document.querySelector(`#${sankeyId}`); // Correctly reference the SVG ID
			const svgData = new XMLSerializer().serializeToString(svgElement);
			const svgBlob = new Blob([svgData], {
				type: "image/svg+xml;charset=utf-8",
			});
			const url = URL.createObjectURL(svgBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = "sankey-diagram.html";
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);
		},
		updateConfigureMenu(sankeyData) {
			this.maxTaxaLimit = sankeyData.maxTaxaPerRank;
		},

		// Function for rendering results
		renderResults(processedResults) {
			// Logic to render the table and Sankey diagram using the passed data
			this.results = processedResults.resultsJSON;
			this.kronaContent = processedResults.kronaContent;
		},
	},

	async mounted() {
		// Runs when results tab is clicked

		// Generate unique instance ID for Sankey
		this.uniqueInstanceId = uuidv4();

		try {
			// Retrieve and parse completedJob from local storage
			const processedResults = JSON.parse(localStorage.getItem("processedResults"));
			if (processedResults) {
				this.renderResults(processedResults);
			}
		} catch (error) {
			console.error("Error loading results:", error);
		}
	},
};
</script>

<style>
.tab-fill-height {
	height: 75vh; 
	overflow-y: auto; /* Enable vertical scrolling */
	overflow-x: auto; /* Hide horizontal overflow */
}
</style>
