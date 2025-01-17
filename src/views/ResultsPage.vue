<template>
	<v-card class="d-flex flex-column flex-shrink-1 h-100">
		<v-tabs v-model="tab" color="primary">
			<v-tab value="table">Table</v-tab>
			<v-tab value="sankey">Sankey</v-tab>
			<v-tab value="krona" v-if="kronaContent">Krona</v-tab>
		</v-tabs>

		<v-card-text class="d-flex flex-column h-100 pb-0">
			<v-tabs-window v-model="tab" class="h-100">
				<!-- NODE DETAILS DIALOG (SHARED BY TABLE & SANKEY) -->
				<SankeyNodeDialog v-if="dialogData" v-model="isDialogVisible" :nodeDetails="dialogData" @close-dialog="hideDialog" @download-sankey="handleFormatSelected" class="align-top" />

				<!-- TABLE TAB -->
				<v-tabs-window-item value="table" class="h-100">
					<ResultsTable :data="results" class="h-100" @row-click="handleRowClick" />
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
						<SankeyDownloadMenu :menuLocation="'bottom center'" @format-selected="emitMainSankeyDownloadFormat">
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
import SankeyDiagram from "@/components/results-page/SankeyDiagram.vue";
import ResultsTable from "@/components/results-page/ResultsTable.vue";
import ConfigureSankeyMenu from "@/components/results-page/ConfigureSankeyMenu.vue";
import SankeyDownloadMenu from "@/components/results-page/SankeyDownloadMenu.vue";
import SankeyNodeDialog from "@/components/results-page/SankeyNodeDialog.vue";
import { saveSvgAsPng } from "save-svg-as-png";
import * as d3 from "d3";
import { v4 as uuidv4 } from "uuid";
import { sankey } from "d3-sankey";
import { rankOrderFull } from "@/plugins/rankUtils";

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
			// // Data for sankey in dialog
			nonCladesRawData: null, // rawData with just clades filtered out
			fullGraphData: { nodes: [], links: [] },
			allNodesByRank: {},
			rankOrder: ["superkingdom", "kingdom", "phylum", "class", "order", "family", "genus", "species", "no rank"],
		};
	},

	watch: {
		results: {
			immediate: true, // Called immediately upon component creation
			handler(newResults) {
				this.processRawData(newResults);
			},
		},
	},

	computed: {
		roundedMaxTaxaLimit() {
			// Round up maxTaxaLimit to the nearest increment of 5
			return Math.ceil(this.maxTaxaLimit / 5) * 5;
		},
	},

	methods: {
		// Functions handling Details Dialog (shared between Table and Sankey tab)
		// // Data processing functions for Subtree Sankey
		getRawFullGraph() {
			const sankeyGenerator = sankey().nodeId((d) => d.id);

			// Store full graph (used for drawing subtree upon node click)
			const fullGraph = sankeyGenerator({
				nodes: this.fullGraphData.nodes.map((d) => Object.assign({}, d)),
				links: this.fullGraphData.links.map((d) => Object.assign({}, d)),
			});

			return fullGraph;
		},
		processRawData(data) {
			this.allNodesByRank = {}; // Reset the nodes by rank

			// Filter out clades from raw data
			const nonClades = data.filter((entry) => rankOrderFull.includes(entry.rank) && entry.rank !== "clade");
			this.nonCladesRawData = nonClades;

			// Store nodes by rank from full data (for calculation of maxTaxaLimit)
			nonClades.forEach((node) => {
				if (!this.allNodesByRank[node.rank]) {
					this.allNodesByRank[node.rank] = [];
				}
				this.allNodesByRank[node.rank].push(node);
			});

			// Store full graph data from raw data
			this.fullGraphData = this.parseData(this.nonCladesRawData, true);

			// Update the configure menu with the maximum taxa per rank
			// this.updateConfigureMenu();
		},
		parseData(data, isFullGraph = false) {
			const nodes = [];
			const unclassifiedNodes = [];
			const allNodes = [];
			const links = [];
			const allLinks = [];

			const rankHierarchyFull = rankOrderFull.reduce((acc, rank, index) => {
				acc[rank] = index;
				return acc;
			}, {});
			let currentLineage = [];
			const nodesByRank = {}; // Store nodes by rank for filtering top 10

			// Step 1: Create nodes and save lineage data for ALL NODES (excluding clade ranks)
			data.forEach((d) => {
				let node = {
					id: d.taxon_id,
					taxon_id: d.taxon_id,
					name: d.name,
					nameWithIndentation: d.nameWithIndentation,
					rank: d.rank,
					rankDisplayName: d.rank,
					proportion: parseFloat(d.proportion),
					clade_reads: parseFloat(d.clade_reads),
					taxon_reads: d.taxon_reads,
					lineage: [...currentLineage, { id: d.taxon_id, name: d.name, rank: d.rank }], // Copy current lineage
					type: "",
				};

				if (d.rank !== "no rank" && !this.isUnclassifiedTaxa(d)) {
					// Declare type as 'classified'
					node.type = "classified";

					// Add classified node to its corresponding rank collection
					if (!nodesByRank[d.rank]) {
						nodesByRank[d.rank] = [];
					}
					nodesByRank[d.rank].push(node);

					// Include all ranks for lineage tracking
					if (node.rank !== "clade") {
						let lastLineageNode = currentLineage[currentLineage.length - 1];

						if (lastLineageNode) {
							while (lastLineageNode && rankHierarchyFull[node.rank] <= rankHierarchyFull[lastLineageNode.rank]) {
								currentLineage.pop();
								lastLineageNode = currentLineage[currentLineage.length - 1];
							}
						}

						// Append current node to currentLineage array + store lineage data
						currentLineage.push(node);
						node.lineage = [...currentLineage];
					}
				} else if (this.isUnclassifiedTaxa(d)) {
					// lineage tracking for unclassified taxa
					let currentLineageCopy = [...currentLineage];
					const parentName = d.name.replace("unclassified ", "");
					let lastLineageNode = currentLineageCopy[currentLineageCopy.length - 1];

					if (lastLineageNode) {
						while (lastLineageNode && lastLineageNode.name !== parentName) {
							currentLineageCopy.pop();
							lastLineageNode = currentLineageCopy[currentLineageCopy.length - 1];
						}
					}

					// Find the previous node in the lineage that is in rankOrder
					const parentNode = currentLineageCopy.find((n) => n.name === parentName);
					if (parentNode && parentNode === lastLineageNode) {
						const lineage = currentLineageCopy;

						let previousNode = null;
						for (let i = lineage.length - 1; i >= 0; i--) {
							// Start from the last item
							if (this.rankOrder.includes(lineage[i].rank)) {
								previousNode = lineage[i];
								break;
							}
						}

						// Determine the rank immediately to the right of this node
						const parentRankIndex = this.rankOrder.indexOf(previousNode.rank);

						// Edit properties for unclassified taxa
						const nextRank = this.rankOrder[parentRankIndex + 1];

						node.id = `dummy-${d.taxon_id}`;
						node.rank = nextRank;
						node.type = "unclassified";

						// Add unclassified node to currentLineage and save lineage data
						currentLineageCopy.push(node);
						node.lineage = [...currentLineageCopy];

						unclassifiedNodes.push(node);
					}
				}
			});

			// Step 2: Filter top 10 nodes by clade_reads for each rank in rankOrder
			// + Add filtered rank nodes & unclassified nodes to sankey diagram
			this.rankOrder.forEach((rank) => {
				if (nodesByRank[rank]) {
					// Store all nodes
					allNodes.push(...nodesByRank[rank]);

					// Sort nodes by clade_reads in descending order and select the top nodes based on slider value
					const topNodes = nodesByRank[rank].sort((a, b) => b.clade_reads - a.clade_reads).slice(0, isFullGraph ? nodesByRank[rank].length : this.taxaLimit); // Don't apply taxaLimit when parsing fullGraphData
					nodes.push(...topNodes);
				}
			});

			unclassifiedNodes.forEach((node) => {
				// Store in all nodes
				allNodes.push(node);

				// Add unclassified nodes to sankey
				nodes.push(node);
			});

			// Step 3: Create links based on filtered nodes' lineage
			nodes.forEach((node) => {
				// Find the previous node in the lineage that is in rankOrder
				const lineage = node.lineage;
				let previousNode = null;

				for (let i = lineage.length - 2; i >= 0; i--) {
					// Start from the second last item
					if (this.rankOrder.includes(lineage[i].rank) && nodes.includes(lineage[i])) {
						previousNode = lineage[i];
						break;
					}
				}

				if (previousNode) {
					links.push({
						source: previousNode.id,
						target: node.id,
						value: node.clade_reads,
					});
				}
			});

			// Store links for all nodes
			allNodes.forEach((node) => {
				// Find the previous node in the lineage that is in rankOrder
				const lineage = node.lineage;
				let previousNode = null;

				for (let i = lineage.length - 2; i >= 0; i--) {
					// Start from the second last item
					if (this.rankOrder.includes(lineage[i].rank) && allNodes.includes(lineage[i])) {
						previousNode = lineage[i];
						break;
					}
				}

				if (previousNode) {
					allLinks.push({
						source: previousNode.id,
						target: node.id,
						value: node.clade_reads,
					});
				}
			});

			return { nodes, links };
		},
		isUnclassifiedTaxa(d) {
			const name = d.name;

			// Check if the name starts with "unclassified"
			if (!name.includes("unclassified")) {
				return false;
			}

			// Split the name into words
			const words = name.trim().split(/\s+/);

			// Check if there are at least two words
			if (words.length < 2) {
				return false;
			}
			return true;
		},
		extractSubtreeRawData(nodeData) {
			// Used only when isSubtree === false

			const graph = this.getRawFullGraph();
			const subtreeNodesTaxonIds = new Set();
			const subtreeLinks = new Set();

			// Recursive function to get all descendant nodes and links
			const getDescendants = (currentNode) => {
				subtreeNodesTaxonIds.add(currentNode.taxon_id);
				graph.links.forEach((link) => {
					if (link.source.id === currentNode.id) {
						subtreeLinks.add(link);
						getDescendants(link.target);
					}
				});
			};

			// Get all descendants of the clicked node from total graph data
			getDescendants(nodeData);

			// Filter data based on the subtree nodes taxon ids
			const subtreeRawData = this.nonCladesRawData.filter((data) => subtreeNodesTaxonIds.has(data.taxon_id));
			return subtreeRawData;
		},
		// // Event handling to show/hide Details Dialog
		handleRowClick(rowData) {
			const graph = this.getRawFullGraph();
			const nodeData = graph.nodes.find((node) => node.taxon_id === rowData.taxon_id);

			this.showDialog(nodeData);
		},
		showDialog(nodeData) {
			const subtreeRawData = this.extractSubtreeRawData(nodeData); // Extract subtree raw data for clicked node
			const hasSourceLinks = subtreeRawData.length > 1 ? true : false; // Determine if the subtree has more than 1 node

			this.dialogData = {
				type: "node",
				data: nodeData,
				subtreeData: subtreeRawData,
				hasSourceLinks: hasSourceLinks,
			};

			this.isDialogVisible = true;
		},
		hideDialog() {
			this.isDialogVisible = false;
		},

		// Sankey Diagram Configuration Settings
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

		// Sankey Download Functions
		emitMainSankeyDownloadFormat(downloadDetails) {
			const { format, filename } = downloadDetails;
			this.handleFormatSelected({ sankeyId: "sankey-svg", format, filename });
		},
		handleFormatSelected({ sankeyId, format, filename = "sankey_diagram" }) {
			switch (format) {
				case "png":
					this.downloadSankeyAsPng(sankeyId, filename);
					break;
				case "jpg":
					this.downloadSankeyAsJpg(sankeyId, filename);
					break;
				case "html":
					this.downloadSankeyAsHtml(sankeyId, filename);
					break;
				default:
					return;
			}
		},
		downloadSankeyAsPng(sankeyId, filename) {
			const sankeySvgElement = document.querySelector(`#${sankeyId}`); // Reference to the SVG ID
			saveSvgAsPng(sankeySvgElement, `${filename}.png`);
		},
		async downloadSankeyAsJpg(sankeyId, filename) {
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
				link.download = `${filename}.jpg`;
				document.body.appendChild(link);
				link.click();
				document.body.removeChild(link);
			};
			img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgString)));
		},
		downloadSankeyAsHtml(sankeyId, filename) {
			const svgElement = document.querySelector(`#${sankeyId}`); // Correctly reference the SVG ID
			const svgData = new XMLSerializer().serializeToString(svgElement);
			const svgBlob = new Blob([svgData], {
				type: "image/svg+xml;charset=utf-8",
			});
			const url = URL.createObjectURL(svgBlob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `${filename}.html`;
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
