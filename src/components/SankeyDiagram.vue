<template>
	<div class="sankey-container d-flex flex-column flex-shrink-1">
		<!-- SANKEY DIAGRAM (DISPLAY ONCE LOADING IS FINISHED) -->
		<div v-if="!loading" key="sankey" ref="sankeyContainer" class="sankey-diagram"></div>

		<!-- LOADING ANIMATION (WHILE LOADING) -->
		<div class="d-flex flex-column align-center justify-center loading-container" v-else>
			<v-progress-circular color="indigo" size="64" indeterminate></v-progress-circular>
		</div>

		<!-- TOOLTIP ON NODE HOVER -->
		<!-- <SankeyTooltip :data="hoverDetails.data" :visible="hoverDetails.visible" :x="tooltipPosition.x" :y="tooltipPosition.y" /> -->
		<div ref="tooltip" class="tooltip" v-if="hoverDetails.visible">
			<v-card class="rounded-lg text-white tooltip">
				<v-col>
					<v-row>
						<div>
							<p class="mb-n1" style="font-size: 0.6rem">#{{ hoverDetails.data.taxon_id }}</p>
							<v-card-title class="opacity-100 text-subtitle-2 pt-0 pb-0 px-0 font-weight-bold">{{ hoverDetails.data.name }}</v-card-title>
						</div>
						<v-chip variant="tonal" color="orange-lighten-1 px-2 font-weight-bold" density="compact">{{ hoverDetails.data.trueRank }}</v-chip>
					</v-row>
					<v-row>
						<v-divider class="my-2"></v-divider>
					</v-row>
					<v-row>
						<v-card-subtitle>Proportion</v-card-subtitle>
						<v-card-text>{{ hoverDetails.data.proportion }}%</v-card-text>
					</v-row>
					<v-row>
						<v-card-subtitle>Clade Reads</v-card-subtitle>
						<v-card-text>{{ hoverDetails.data.clade_reads }}</v-card-text>
					</v-row>
					<v-row>
						<v-card-subtitle>Taxon Reads</v-card-subtitle>
						<v-card-text>{{ hoverDetails.data.taxon_reads }}</v-card-text>
					</v-row>
				</v-col>
			</v-card>
		</div>
	</div>
</template>

<script>
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal, sankeyJustify } from "d3-sankey";
import { rankOrderFull, sankeyRankColumns } from "@/plugins/rankUtils";
// import SankeyTooltip from "@/components/SankeyTooltip.vue";

export default {
	name: "SankeyDiagram",
	components: {
		// SankeyTooltip,
	},
	props: {
		id: {
			type: String,
			required: true,
		},
		isSubtree: {
			type: Boolean,
			required: true,
		},
		instanceId: String,
		rawData: {
			type: Object,
			required: true,
		},

		// Configuration Options
		taxaLimit: {
			type: Number,
			required: true,
		},
		minCladeReadsMode: {
			type: String,
			required: true,
		},
		minReads: {
			type: Number,
			required: true,
		},
		showUnclassified: {
			type: Boolean,
			required: true,
		},
		figureHeight: {
			type: Number,
			required: true,
		},
		labelOption: {
			type: String,
			required: true,
		},
		showAll: {
			type: Boolean,
			required: true,
		},

		// Search
		searchQuery: {
			type: String,
			default: "",
		},
	},
	data() {
		return {
			loading: false,
			diagramWidth: window.innerWidth,
			searchQueryMatchNodes: new Set(),

			// Data for tooltip
			hoverDetails: {
				visible: false,
				data: {},
			},
			tooltipPosition: {
				x: 0,
				y: 0,
			},

			// Data for graph rendering
			nonCladesRawData: null, // rawData with just clades filtered out
			allNodesByRank: {},
			rankOrder: [...sankeyRankColumns, "no rank"],
			rankOrderFull, // Imported from rankUtils
			autumnColors: [
				"#57291F",
				"#C0413B",
				"#D77B5F",
				"#FF9200",
				"#FFCD73",
				"#F7E5BF",
				"#C87505",
				"#F18E3F",
				"#E59579",
				"#C14C32",
				"#80003A",
				"#506432",
				"#FFC500",
				"#B30019",
				"#EC410B",
				"#E63400",
				"#8CB5B5",
				"#6C3400",
				"#FFA400",
				"#41222A",
				"#FFB27B",
				"#FFCD87",
				"#BC7576",
			], // Define color scale (https://wondernote.org/color-palettes-for-web-digital-blog-graphic-design-with-hexadecimal-codes/)
		};
	},
	computed: {
		filteredData() {
			// Filter data based on configurations
			// If showAll is true, skip filtering and return all data
			if (this.showAll) {
				return this.nonCladesRawData;
			}

			if (!this.nonCladesRawData) {
				// Ensure data are defined before filtering
				return [];
			}
			return this.nonCladesRawData.filter((entry) => {
				// Check min reads criteria
				let passesMinReads = false;
				if (this.minCladeReadsMode === "%") {
					passesMinReads = parseFloat(entry.proportion) >= this.minReads;
				} else if (this.minCladeReadsMode === "#") {
					passesMinReads = parseFloat(entry.clade_reads) >= this.minReads;
				}

				// Check show unclassified criteria
				const passesUnclassified = this.showUnclassified || !this.isUnclassifiedTaxa(entry);

				// Data entry must pass both criteria to be included in sankey
				return passesMinReads && passesUnclassified;
			});
		},
		graphData() {
			return this.parseData(this.filteredData);
		},
	},
	watch: {
		loading(newValue) {
			// console.log("Loading state changed:", newValue); // DEBUG
			if (!newValue) {
				this.$nextTick(() => {
					// Ensure the DOM is updated before creating the Sankey diagram.
					// Runs Only When the Container is Available.
					this.createSankey();
				});
			}
		},
		rawData: {
			immediate: true, // Called immediately upon component creation
			handler(newValue) {
				this.processRawData(newValue);
			},
		},

		// Configuration Options
		taxaLimit() {
			this.updateSankey();
		},
		minCladeReadsMode() {
			this.updateSankey();
		},
		minReads() {
			this.updateSankey();
		},
		showUnclassified() {
			this.updateSankey();
		},
		figureHeight() {
			this.updateSankey();
		},
		labelOption() {
			this.updateSankey();
		},
		diagramWidth() {
			this.updateSankey();
		},

		// Search query
		searchQuery(newQuery) {
			this.highlightNodes(newQuery);
		},
	},

	methods: {
		// Function for processing/parsing data
		processRawData(data) {
			this.allNodesByRank = {}; // Reset the nodes by rank

			// Filter out clades from raw data
			const nonClades = data.filter((entry) => this.rankOrderFull.includes(entry.rank) && entry.rank !== "clade");
			this.nonCladesRawData = nonClades;

			// Store nodes by rank from full data (for calculation of maxTaxaLimit)
			nonClades.forEach((node) => {
				if (!this.allNodesByRank[node.rank]) {
					this.allNodesByRank[node.rank] = [];
				}
				this.allNodesByRank[node.rank].push(node);
			});

			// Update the configure menu with the maximum taxa per rank
			this.updateConfigureMenu();
		},
		parseData(data, isFullGraph = false) {
			const nodes = [];
			const unclassifiedNodes = [];
			const allNodes = [];
			const links = [];
			const allLinks = [];

			const rankHierarchyFull = this.rankOrderFull.reduce((acc, rank, index) => {
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
					rank: d.rank,
					trueRank: d.rank,
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

		// Function for updating configure menu value ranges based on data
		updateConfigureMenu() {
			let maxValues = 0;
			for (let rank in this.allNodesByRank) {
				const valuesCount = this.allNodesByRank[rank].length;
				if (valuesCount > maxValues) {
					maxValues = valuesCount;
				}
			}

			this.$emit("updateConfigureMenu", {
				maxTaxaPerRank: maxValues,
			});
		},

		// Helper functions for drawing Sankey
		nodeHeight(d) {
			// FIXME
			let nodeHeight = d.y1 - d.y0;
			if (nodeHeight < 1) {
				return 1.5;
			} else {
				return d.y1 - d.y0;
			}
		},
		formatCladeReads(value) {
			if (value >= 1000) {
				return `${(value / 1000).toFixed(2)}k`;
			}
			return value.toString();
		},
		formatProportion(value) {
			return `${value.toFixed(3)}%`;
		},
		updateDiagramWidth() {
			this.diagramWidth = window.innerWidth;
		},

		// High nodes matching search query
		highlightNodes(query) {
			const svg = d3.select(this.$refs.sankeyContainer).select("svg");
			this.searchQueryMatchNodes.clear(); // Clear previous matches

			// If the query is empty, reset all nodes and links to full opacity
			if (!query) {
				svg.selectAll("rect").style("opacity", 1);
				svg.selectAll("path").style("opacity", 1);
				svg.selectAll(".node-name").style("opacity", 1);
				svg.selectAll(".clade-reads").style("opacity", 1);
				return;
			}

			// Iterate over nodes to find those that match the query
			svg.selectAll(".node-group").each((d) => {
				if (d.name.toLowerCase().includes(query.toLowerCase()) || d.taxon_id.startsWith(query)) {
					this.searchQueryMatchNodes.add(d.id);
				}
			});

			// Set opacity for nodes and links
			svg.selectAll("rect").style("opacity", (d) => (this.searchQueryMatchNodes.has(d.id) ? 1 : 0.2));
			svg.selectAll("path").style("opacity", 0.2); // Gray all paths
			svg.selectAll(".node-name").style("opacity", (d) => (this.searchQueryMatchNodes.has(d.id) ? 1 : 0.1));
			svg.selectAll(".clade-reads").style("opacity", (d) => (this.searchQueryMatchNodes.has(d.id) ? 1 : 0.1));
		},

		// Functions for node subtree dialog
		showNodeDetails(event, nodeData) {
			this.$emit("node-click", nodeData);
		},

		// Main function for drawing Sankey
		createSankey() {
			const { nodes, links } = this.graphData;

			// Check if nodes and links are not empty
			if (!nodes.length || !links.length) {
				console.warn("No data to create Sankey diagram"); // FIXME: what to do when theres no graph to draw (empty state?)
				return;
			}

			const container = this.$refs.sankeyContainer;
			d3.select(container).selectAll("*").remove(); // Clear the previous diagram

			const width = 1100;
			const height = this.figureHeight;
			const marginBottom = 50; // Margin for rank labels
			const marginRight = 150;

			const svg = d3
				.select(container)
				.append("svg")
				.attr("width", width)
				.attr("height", height + marginBottom)
				.attr("id", this.id); // Set the id based on the prop for download reference

			const sankeyGenerator = sankey()
				.nodeId((d) => d.id)
				.nodeAlign(sankeyJustify)
				.nodeWidth(20)
				.nodePadding(13)
				.iterations(100)
				.extent([
					[10, 10],
					[width - marginRight, height - 6],
				]);

			const graph = sankeyGenerator({
				nodes: nodes.map((d) => Object.assign({}, d)),
				links: links.map((d) => Object.assign({}, d)),
			});

			const color = d3.scaleOrdinal().range(this.autumnColors);
			const unclassifiedLabelColor = "#696B7E";

			// Manually adjust nodes position to align by rank
			const columnWidth = (width - marginRight) / this.rankOrder.length;
			const columnMap = this.rankOrder.reduce((acc, rank, index) => {
				const leftMargin = 10;
				acc[rank] = index * columnWidth + leftMargin;
				return acc;
			}, {});

			graph.nodes.forEach((node) => {
				node.x0 = columnMap[node.rank];
				node.x1 = node.x0 + sankeyGenerator.nodeWidth();

				if (node.type === "unclassified") {
					node.color = unclassifiedLabelColor;
				} else {
					node.color = color(node.id); // Assign color to node
				}
			});

			// Re-run the layout to ensure correct vertical positioning
			sankeyGenerator.update(graph);

			// Add rank column labels
			const rankLabels = ["D", "K", "P", "C", "O", "F", "G", "S"];
			svg
				.append("g")
				.selectAll("text")
				// .data(rankLabels)
				.data(this.rankOrder)
				.enter()
				.append("text")
				.attr("x", (rank) => columnMap[rank] + sankeyGenerator.nodeWidth() / 2)
				.attr("y", height + marginBottom / 2)
				.attr("dy", "0.35em")
				.attr("text-anchor", "middle")
				.text((rank, index) => rankLabels[index]);

			// Draw rank label divider link
			svg
				.append("line")
				.attr("x1", 0)
				.attr("y1", height + 10)
				.attr("x2", width)
				.attr("y2", height + 10)
				.attr("stroke", "#000")
				.attr("stroke-width", 1);

			// Function to highlight lineage
			const highlightLineage = (node) => {
				const lineageIds = new Set(node.lineage.map((n) => n.id));
				lineageIds.add(node.id);

				svg.selectAll("rect").style("opacity", (d) => (lineageIds.has(d.id) ? 1 : 0.2));
				svg.selectAll("path").style("opacity", (d) => (lineageIds.has(d.source.id) && lineageIds.has(d.target.id) ? 1 : 0.2));
				svg.selectAll(".node-name").style("opacity", (d) => (lineageIds.has(d.id) ? 1 : 0.1));
				svg.selectAll(".clade-reads").style("opacity", (d) => (lineageIds.has(d.id) ? 1 : 0.1));
			};

			// Function to reset highlight
			const resetHighlight = () => {
				svg.selectAll("rect").style("opacity", 1);
				svg.selectAll("path").style("opacity", 1);
				svg.selectAll(".node-name").style("opacity", 1);
				svg.selectAll(".clade-reads").style("opacity", 1);
			};

			// Define a clipping path for each link (crops out curve when links are too thick)
			svg
				.append("defs")
				.selectAll("clipPath")
				.data(graph.links)
				.enter()
				.append("clipPath")
				.attr("id", (d, i) => `clip-path-${this.instanceId}-${i}`)
				.append("rect")
				.attr("x", (d) => d.source.x1)
				.attr("y", 0)
				.attr("width", (d) => d.target.x0 - d.source.x1)
				.attr("height", height);

			// Add links
			svg
				.append("g")
				.attr("fill", "none")
				.attr("stroke-opacity", 0.3)
				.selectAll("path")
				.data(graph.links)
				.enter()
				.append("path")
				.attr("d", sankeyLinkHorizontal())
				.attr("stroke", (d) => (d.target.type === "unclassified" ? unclassifiedLabelColor : d3.color(d.source.color))) // Set link color to source node color with reduced opacity
				.attr("stroke-width", (d) => Math.max(1, d.width))
				.attr("clip-path", (d, i) => `url(#clip-path-${this.instanceId}-${i})`);

			// Function controlling tooltip
			this.showTooltip = (event, d) => {
				this.hoverDetails = {
					visible: true,
					data: d,
				};
				this.moveTooltip(event);
			};
			this.moveTooltip = (event) => {
				requestAnimationFrame(() => {
					const tooltip = this.$refs.tooltip;
					const offsetX = this.isSubtree ? -12 : 12;
					const offsetY = this.isSubtree ? -24 : 0;
					if (tooltip) {
						tooltip.style.left = `${event.pageX + offsetX}px`;
						tooltip.style.top = `${event.clientY + offsetY}px`;
					}
				});
			};
			this.hideTooltip = () => {
				this.hoverDetails.visible = false;
			};

			// Create node group (node + labels) and add mouse events
			const nodeGroup = svg
				.append("g")
				.selectAll(".node-group")
				.data(graph.nodes)
				.enter()
				.append("g")
				.attr("class", "node-group")
				.attr("transform", (d) => `translate(${d.x0}, ${d.y0})`)
				.on("mouseover", (event, d) => {
					if (!this.searchQuery || this.searchQueryMatchNodes.has(d.id)) {
						// If there's no search query, or if the node matches the search query, highlight
						highlightLineage(d);

						// Show tooltip
						this.showTooltip(event, d);
					}
				})
				.on("mousemove", (event) => {
					// Move tooltip (throttled to reduce lag)
					const tooltipDelay = 50; // Throttle delay in ms
					this.throttle(this.moveTooltip(event), tooltipDelay);
				})
				.on("mouseout", () => {
					if (!this.searchQuery) {
						// If there's no search query, reset all highlights
						resetHighlight();
					} else {
						this.highlightNodes(this.searchQuery);
					}
					this.hideTooltip();
				})
				.on("click", (event, d) => {
					if (!this.isSubtree && (!this.searchQuery || this.searchQueryMatchNodes.has(d.id))) {
						this.showNodeDetails(event, d);
					}
				});

			// Create node rectangles
			nodeGroup
				.append("rect")
				.attr("width", (d) => d.x1 - d.x0)
				.attr("height", (d) => this.nodeHeight(d))
				.attr("fill", (d) => (d.type === "unclassified" ? unclassifiedLabelColor : d.color))
				.attr("class", "node") // Apply the CSS class for cursor
				.style("cursor", "pointer");

			// Add node name labels next to node
			nodeGroup
				.append("text")
				.attr("id", (d) => `nodeName-${d.id}`)
				.attr("class", "node-name")
				.attr("x", (d) => d.x1 - d.x0 + 3)
				.attr("y", (d) => this.nodeHeight(d) / 2)
				.attr("dy", "0.35em")
				.attr("text-anchor", "start")
				.text((d) => d.name)
				.style("font-size", "10px")
				.style("fill", (d) => (d.type === "unclassified" ? unclassifiedLabelColor : "black"))
				.style("cursor", "pointer");

			// Add label above node (proportion/clade reads)
			nodeGroup
				.append("text")
				.attr("id", (d) => `cladeReads-${d.id}`)
				.attr("class", "clade-reads")
				.attr("x", (d) => (d.x1 - d.x0) / 2)
				.attr("y", -5)
				.attr("dy", "0.35em")
				.attr("text-anchor", "middle")
				.style("font-size", "10px")
				.style("fill", (d) => (d.type === "unclassified" ? unclassifiedLabelColor : "black"))

				.text((d) => (this.labelOption === "proportion" ? this.formatProportion(d.proportion) : this.formatCladeReads(d.clade_reads)))
				.style("cursor", "pointer");

			// Highlight nodes matching search query
			this.highlightNodes(this.searchQuery);
		},

		// Functions for rerendering/updating Sankey
		async updateSankey() {
			// Start loading, show loading display
			this.loading = true;

			try {
				await this.fetchSankey();
			} catch (error) {
				console.error("Error in updateSankey:", error);
			} finally {
				setTimeout(() => {
					this.loading = false;
				}, 100); // Small delay to ensure DOM updates
			}
		},
		async fetchSankey() {
			await new Promise((resolve) => {
				setTimeout(() => {
					this.createSankey(); // Create the Sankey diagram immediately after getting data
					resolve();
				}, 50); // Immediate execution after fetching data
			});
		},

		// Throttle function (used for improving performance during node hover)
		throttle(func, delay) {
			let lastCall = 0;
			return function (...args) {
				const now = new Date().getTime();
				if (now - lastCall < delay) {
					return;
				}
				lastCall = now;
				return func(...args);
			};
		},
	},

	async mounted() {
		// Listener for screen resizing event
		window.addEventListener("resize", this.updateDiagramWidth);

		await this.updateSankey();
	},
	beforeUnmount() {
		window.removeEventListener("resize", this.updateDiagramWidth);
	},
};
</script>

<style scoped>
.sankey-container {
	display: flex;
	gap: 10px;
	width: 100%;
	height: 100%; /* Ensure it takes full viewport height */
}
.loading-container {
	height: 400px;
}

.sankey-diagram {
	height: 100%;
	padding-bottom: 32px;
	overflow-x: scroll;
	/* Hide horizontal scrollbar for IE, Edge and Firefox */
	-ms-overflow-style: none; /* IE and Edge */
	scrollbar-width: none; /* Firefox */
}
/* Hide horizontal scrollbar for Chrome, Safari and Opera */
.sankey-diagram::-webkit-scrollbar {
	display: none;
}
.taxid-breadcrumbs a {
	text-decoration: none;
}

.node {
	cursor: grab;
}
.node:active {
	cursor: grabbing;
}

/* Node Hover Tooltip */
.tooltip {
	position: fixed;
	background-color: rgba(38, 50, 56, 0.95);
	pointer-events: none;
	box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.tooltip .v-card {
	padding-right: 16px;
	padding-left: 16px;
	padding-top: 10px;
	padding-bottom: 8px;
}
.tooltip .v-row {
	display: flex;
	align-content: center;
	align-items: center;
	justify-content: space-between;
	column-gap: 16px;
}
.tooltip .v-card-title {
	max-width: 200px;
	word-wrap: break-word;
	white-space: normal; /* Ensure text wraps */
}
.tooltip .v-card-subtitle {
	padding-left: 0px;
}
.tooltip .v-card-text {
	padding-top: 4px;
	padding-bottom: 4px;
	padding-right: 0px;
	padding-left: 0px;
	text-align: end;
}
</style>
