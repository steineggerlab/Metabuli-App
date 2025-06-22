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
				<SankeyNodeDialog v-if="dialogData" v-model="isDialogVisible" :nodeDetails="dialogData"
					:configureMenuSettings="sankeyConfigurationSettings" @update-config="handleUpdateConfig"
					@close-dialog="hideDialog" @download-sankey="handleFormatSelected" class="align-top" />

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
							<v-text-field v-model="searchQuery" prepend-inner-icon="$magnify" density="compact"
								label="Search Name or Taxon ID" variant="outlined" rounded="lg" single-line color="indigo"
								clearable></v-text-field>
							<div class="d-flex align-center">Click on a node to see lineage and subtree.</div>
						</div>

						<!-- BUTTON TO OPEN ISSUE WHEN SANKEY VERIFICATION FAILS -->
						<v-tooltip location="end">
							<template #activator="{ props }">
								<v-btn v-if="!taxonomyVerification" v-bind="props" icon="$alert" color="amber-darken-2" variant="text"
									rounded="xl" class="ml-2" @click="openGithubIssue"></v-btn>
							</template>
							Taxonomy report mismatch detected. Notify the developer!
						</v-tooltip>

						<v-spacer></v-spacer>

						<!-- SANKEY DOWNLOAD MENU -->
						<SankeyDownloadMenu :menuLocation="'bottom center'" @format-selected="emitMainSankeyDownloadFormat">
							<template v-slot:activator="{ props }">
								<v-btn v-bind="props" append-icon="$download" variant="text" rounded> Download </v-btn>
							</template>
						</SankeyDownloadMenu>

						<!-- CONFIGURE SANKEY MENU -->
						<ConfigureSankeyMenu :maxTaxaLimit="roundedMaxTaxaLimit" :initialShowAll="showAll"
							:initialTaxaLimit="taxaLimit" :initialMinCladeReadsMode="minCladeReadsMode"
							:initialMinCladeReads="minCladeReads" :initialFigureHeight="figureHeight"
							:initialLabelOption="labelOption" :menuLocation="'bottom end'" @updateSettings="handleUpdateConfig">
							<template v-slot:activator="{ props }">
								<v-btn color="indigo" rounded="xl" v-bind="props">Configure Diagram</v-btn>
							</template>
						</ConfigureSankeyMenu>
					</div>

					<!-- SANKEY DIAGRAM -->
					<SankeyDiagram :searchQuery="searchQuery" :id="'sankey-svg'" :isSubtree="false" :instanceId="uniqueInstanceId"
						:rawData="results" :taxaLimit="taxaLimit" :minCladeReadsMode="minCladeReadsMode" :minReads="minCladeReads"
						:figureHeight="figureHeight" :labelOption="labelOption" :showAll="showAll"
						@updateConfigureMenu="updateConfigureMenu" @node-click="showDialog" />
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
import { sankeyRankColumns } from "@/plugins/rankUtils";
import { extractTaxonomyArray, compareTSVContents } from "@/plugins/sankeyUtils";

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
			taxonomyVerification: null,

			// Sankey Diagram
			uniqueInstanceId: "",
			maxTaxaLimit: 100,

			showAll: false,
			taxaLimit: 20, // FIXME: refactor, make this into dictionary storing info about configuration
			minCladeReadsMode: "%",
			minCladeReads: 0.01,
			figureHeight: 500,
			labelOption: "proportion",

			searchQuery: "",

			// Sankey Node Dialog
			isDialogVisible: false,
			dialogData: null,

			// Data for sankey in dialog
			nodes: [],
			nodesByDepth: {},
		};
	},

	watch: {
		results: {
			handler(newResults) {
				this.parseData(newResults);
			},
		},
	},

	computed: {
		roundedMaxTaxaLimit() {
			// Round up maxTaxaLimit to the nearest increment of 5
			return Math.ceil(this.maxTaxaLimit / 5) * 5;
		},
		sankeyConfigurationSettings() {
			// Automatically recalculates when any fields change
			return {
				showAll: this.showAll,
				taxaLimit: this.taxaLimit,
				minCladeReadsMode: this.minCladeReadsMode,
				minCladeReads: this.minCladeReads,
				figureHeight: this.figureHeight,
				labelOption: this.labelOption,
			}
		},
	},

	methods: {
		// Functions handling Details Dialog (shared between Table and Sankey tab)
		// Data processing functions for Subtree Sankey
		parseData(data) {
			const nodesByRank = {};
			let currentLineage = [];
			this.nodesByDepth = {};

			let rootNode = null;
			let unclassifiedNode = null;

			/*
			Step 1: Create nodes and save lineage data for all nodes
			*/
			data.forEach((d) => {
				let node = {
					id: d.taxon_id,
					taxon_id: d.taxon_id,
					name: d.name,
					nameWithIndentation: d.nameWithIndentation,
					rank: d.rank,
					rankDisplayName: d.rank,
					hierarchy: parseInt(d.depth),
					proportion: parseFloat(d.proportion),
					clade_reads: parseInt(d.clade_reads),
					taxon_reads: d.taxon_reads,
					lineage: null,
					isUnclassifiedNode: false,
					children: [], // FIXME: change to null?
				};

				// Add node to its corresponding depth collection
				if (!Object.keys(this.nodesByDepth).map(Number).includes(node.hierarchy)) {
					this.nodesByDepth[node.hierarchy] = [];
				}
				this.nodesByDepth[node.hierarchy].push(node);

				// Add node to its corresponding rank collection
				// Consider root node and unclassified node separately
				if (sankeyRankColumns.includes(d.rank)) {
					if (!nodesByRank[d.rank]) {
						nodesByRank[d.rank] = [];
					}
					nodesByRank[d.rank].push(node);
				} else if (this.isUnclassifiedNode(node)) {
					// FIXME: figure out which rank to put unclassified node in
					if (!nodesByRank["no rank"]) {
						nodesByRank["no rank"] = [];
					}
					// nodesByRank["root"].push(node); // FIXME: overlapping issue with root node when i put this in

					// Reassign some attributes specific to unclassified node
					node.rank = "no rank";
					node.rankDisplayName = node.name;
					node.isUnclassifiedNode = true;

					unclassifiedNode = node;
				} else if (this.isRootNode(node)) {
					if (!nodesByRank["no rank"]) {
						nodesByRank["no rank"] = [];
					}
					nodesByRank["no rank"].push(node);

					// Reassign some attributes specific to root node
					node.rank = "no rank"; // FIXME: remove this after fixing logic to leave it as "no rank", same as taxonomyreport
					node.rankDisplayName = node.name;

					rootNode = node;
					this.nodes.push(rootNode);
				}

				// Store lineage for each node
				let lastLineageNode = currentLineage[currentLineage.length - 1];
				if (lastLineageNode) {
					let currentDepth = node.hierarchy;
					let lastDepth = lastLineageNode.hierarchy;

					while (lastLineageNode && currentDepth <= lastDepth) {
						currentLineage.pop();

						lastLineageNode = currentLineage[currentLineage.length - 1];
						if (!lastLineageNode) {
							break; // Exit the loop if no more nodes in the lineage (i.e. traced back to root node)
						}

						lastDepth = lastLineageNode.hierarchy; // Update lastRank for the next iteration comparison
					}
				}
				// Append current node to currentLineage array + store lineage data
				currentLineage.push(node);
				node.lineage = [...currentLineage];

				// Store current node to parent's children collection (for sankey verification taxonomyreport regeneration)
				const parent = node.lineage[node.lineage.length - 2];
				if (parent) {
					parent.children.push(node);
				}
			});

			/* 
			Step 2: Store all nodes and store rank-filtered nodes separately
			*/
			sankeyRankColumns.forEach((rank) => {
				if (nodesByRank[rank]) {
					// Store all nodes
					this.nodes.push(...nodesByRank[rank]);
				}
			});

			/*
			Step 4: Create node for Unclassified Sequences linked to the root node
			*/
			if (unclassifiedNode && rootNode) { // FIXME: remove rootNode if unneeded
				// Add to selected and all nodes (always present, excluded from taxa limit)
				this.nodes.push(unclassifiedNode);

				// Add link from root node to unclassified node
				// selectedLinks.push({
				// 	sourceName: rootNode.name,
				// 	source: rootNode.id,
				// 	targetName: unclassifiedNode.name,
				// 	target: unclassifiedNode.id,
				// 	value: totalUnclassifiedCladeReads,
				// });
				// allLinks.push({
				// 	sourceName: rootNode.name,
				// 	source: rootNode.id,
				// 	targetName: unclassifiedNode.name,
				// 	target: unclassifiedNode.id,
				// 	value: totalUnclassifiedCladeReads,
				// });
				// }
			}

			// Verify sankey
			this.verifySankey().then((result) => {
				if (result === null) {
					console.warn("⚠️ Original report file not found. Taxonomy verification skipped.");
					this.taxonomyVerification = null; // Use `null` for file-not-found case
				} else if (result === false) {
					console.log("🟥 Taxonomy verification failed.");
					this.taxonomyVerification = false; // Use `false` for verification failure
				} else if (result === true) {
					console.log("🟩 Taxonomy verification succeeded.");
					this.taxonomyVerification = true; // Use `true` for verification success
				}
			});
		},
		isRootNode(node) {
			// Check if the node is the root node
			return parseInt(node.taxon_id) === 1;
		},
		isUnclassifiedNode(node) {
			// Check if the node is the unclassified node
			return parseInt(node.taxon_id) === 0;
		},
		extractSubtreeRawData(selectedNode) {
			// Used only when isSubtree === false
			let startIdx = -1;
			let endIdx = -1;
			let startedAdding = false;
			const selectedNodeHierarchy = selectedNode.hierarchy;

			for (let i = 0; i < this.results.length; i++) {
				const comparingNode = this.results[i];
				if (comparingNode.taxon_id === selectedNode.taxon_id) {
					// Found the selected node; mark the start of the subtree
					startIdx = i;
					startedAdding = true;
					continue; // Move to the next iteration
				}

				if (startedAdding) {
					const comparingNodeDepth = comparingNode.depth;
					if (comparingNodeDepth > selectedNodeHierarchy) {
						endIdx = i;
					} else {
						// Stop when we encounter a node at the same or higher rank
						break;
					}
				}
			}

			const subtreeRawData = this.results.slice(startIdx, endIdx + 1);
			return subtreeRawData;
		},
		// // Event handling to show/hide Details Dialog
		handleRowClick(rowData) {
			const node = this.nodes.find((node) => node.taxon_id === rowData.taxon_id);
			const nodeData = {
				proportion: node.proportion,
				clade_reads: node.clade_reads,
				taxon_reads: node.taxon_reads,
				taxon_id: node.taxon_id,
				name: node.name,
				rank: node.rank,
				hierarchy: node.hierarchy,
				lineage: node.lineage
			};

			this.showDialog(nodeData);
		},
		showDialog({ proportion, clade_reads, taxon_reads, taxon_id, name, rank, hierarchy, lineage } = {}) {
			// if (proportion === undefined || clade_reads === undefined || taxon_id === undefined || rank === undefined || hierarchy === undefined ) {
			// 	throw new Error("Missing required properties: proportion, clade_reads, or taxon_id");
			// }
			const nodeData = { proportion, clade_reads, taxon_reads, taxon_id, name, rank, hierarchy, lineage };
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

		// Sankey Verification
		async verifySankey() {
			// Compare original taxonomy report and regenerated taxonomy report
			const originalReportFilePath = sessionStorage.getItem("reportFilePath");
			if (!originalReportFilePath) {
				console.warn("Original report file path not found. Skipping TSV comparison.");
				return null;  // Return `null` when file not found
			}

			const extractedTaxonomyArray = extractTaxonomyArray(this.nodesByDepth);

			const properties = ["proportion", "clade_reads", "taxon_reads", "rank", "taxon_id", "nameWithIndentation"];

			// Regenerate taxonomy report from the sankey data
			const header = "#clade_proportion\tclade_count\ttaxon_count\trank\ttaxID\tname";
			const regeneratedReport = [
				header,
				...extractedTaxonomyArray.map(node =>
					properties
						.map(property =>
							node[property] !== undefined && node[property] !== null ? node[property] : ""
						)
						.join("\t")
				)
			].join("\n");

			const compareSuccessful = await compareTSVContents(regeneratedReport, originalReportFilePath);
			return compareSuccessful; // return true or false depending on verification result
		},
		openGithubIssue() {
			const title = encodeURIComponent("Original Taxonomy Report Misalignment with Reverse-Generated Report");
			const body = encodeURIComponent(
				`> To help us investigate the issue, please share your 'report.tsv' file using one of the following methods:
>
>1. **File Sharing Service**:  
>   Upload your 'report.tsv' file to a trusted file-sharing platform like Google Drive or Dropbox. Ensure the link is accessible to us, and include the link in this issue.
>
>2. **Email Submission**:  
>   Alternatively, you can email the 'report.tsv' file to [snjlee58@snu.ac.kr]. Please include the issue number in the email subject (e.g., "Metabuli App Issue #123: Report File").
>
>This will help us review and resolve the issue more effectively. Let us know if you have any questions!`
			);

			const url = `https://github.com/steineggerlab/Metabuli-App/issues/new?title=${title}&body=${body}`;
			window.open(url, "_blank");
		},

		// Sankey Diagram Configuration Settings
		handleUpdateConfig(settings) {
			this.showAll = settings.showAll;

			if (settings.showAll) {
				this.taxaLimit = this.maxTaxaLimit;
				this.minCladeReadsMode = "#";
				this.minCladeReads = 0;
			} else {
				this.taxaLimit = settings.taxaLimit;
				this.minCladeReadsMode = settings.minCladeReadsMode;
				this.minCladeReads = settings.minCladeReads;
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
	overflow-y: auto;
	/* Enable vertical scrolling */
	overflow-x: auto;
	/* Hide horizontal overflow */
}
</style>
