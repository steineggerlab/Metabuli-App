<template>
	<div class="sankey-container d-flex flex-column flex-shrink-1">
		<!-- SANKEY DIAGRAM (DISPLAY ONCE LOADING IS FINISHED) -->
		<div v-if="!loading" key="sankey" ref="sankeyContainer" class="sankey-diagram hide"></div>
		<!-- FIXME: change div to svg like in mmseqs -->

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
						<v-chip variant="tonal" color="orange-lighten-1 px-2 font-weight-bold" density="compact">{{ hoverDetails.data.rankDisplayName }}</v-chip>
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
/* eslint-disable */
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal, sankeyJustify } from "d3-sankey";
import { sankeyRankColumns } from "@/plugins/rankUtils";
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
			allNodesByRank: {},
			nodesByDepth: {},
			
			sankeyRankColumns,
			sankeyRankColumnsWithRoot: ["no rank", ...sankeyRankColumns],
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
				return this.rawData;
			}

			if (!this.rawData) {
				// Ensure data are defined before filtering
				return [];
			}
			return this.rawData.filter((entry) => {
				// Check min reads criteria
				let passesMinReads = false;
				if (this.minCladeReadsMode === "%") {
					passesMinReads = parseFloat(entry.proportion) >= this.minReads;
				} else if (this.minCladeReadsMode === "#") {
					passesMinReads = parseFloat(entry.clade_reads) >= this.minReads;
				}

				// Data entry must pass both criteria to be included in sankey
				return passesMinReads;
			});
		},
		graphData() {
			return this.parseData(this.filteredData);
		},
	},
	watch: {
		loading(newValue) {
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

			// Store nodes by rank from full data (for calculation of maxTaxaLimit)
			data.forEach((node) => {
				if (this.sankeyRankColumns.includes(node.rank)) {
					if (!this.allNodesByRank[node.rank]) {
						this.allNodesByRank[node.rank] = [];
					}
					this.allNodesByRank[node.rank].push(node);
				}
			});

			// Update the configure menu with the maximum taxa per rank
			this.updateConfigureMenu();
		},
		parseData(data, isFullGraph = false) {
			const selectedNodes = [];
			const allNodes = [];
			const selectedLinks = [];
			const allLinks = [];

			const nodesByRank = {}; // Store nodes by rank
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
					clade_reads: parseFloat(d.clade_reads),
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
				if (this.sankeyRankColumns.includes(d.rank)) {
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
					allNodes.push(rootNode);
					selectedNodes.push(rootNode);
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
			this.sankeyRankColumns.forEach((rank) => {
				if (nodesByRank[rank]) {
					// Store all nodes
					allNodes.push(...nodesByRank[rank]);

					// Sort nodes by clade_reads in descending order and select the top nodes based on max limit value
					const topNodes = nodesByRank[rank].sort((a, b) => b.clade_reads - a.clade_reads).slice(0, isFullGraph ? nodesByRank[rank].length : this.taxaLimit);
					selectedNodes.push(...topNodes);
				}
			});

			/* 
			Step 3: Create links and store each node to its parent's children collection
			*/ 
			// Define function to add links
			function generateLinks(nodes, targetArray, sankeyRankColumns) {
				nodes.forEach((node) => {
					// Find the previous node in the lineage that is in sankeyRankColumns
					const lineage = node.lineage;

					let previousNode = lineage[lineage.length - 2];
					while (previousNode) {
						const linkEntry = {
							sourceName: previousNode.name,
							source: previousNode.id,
							targetName: node.name,
							target: node.id,
							value: node.clade_reads,
						};

						if (sankeyRankColumns.includes(previousNode.rank) && nodes.includes(previousNode)) {
							targetArray.push(linkEntry);
							break;
						}

						previousNode = lineage[lineage.indexOf(previousNode) - 1];
					}
				});
			}

			// Call function to generate links for selected and all nodes
			generateLinks(selectedNodes, selectedLinks, this.sankeyRankColumnsWithRoot);
			generateLinks(allNodes, allLinks, this.sankeyRankColumnsWithRoot);

			/* 
			Step 4: Create node for Unclassified Sequences linked to the root node
			*/
			if (unclassifiedNode && rootNode) { // FIXME: remove rootNode if unneeded
					// Add to selected and all nodes (always present, excluded from taxa limit)
					selectedNodes.push(unclassifiedNode);
					allNodes.push(unclassifiedNode);

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

			return { nodes: selectedNodes, links: selectedLinks };
		},
		isRootNode(node) {
			// Check if the node is the root node
			return parseInt(node.taxon_id) === 1;
		},
		isUnclassifiedNode(node) {
			// Check if the node is the unclassified node
			return parseInt(node.taxon_id) === 0;
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
				console.warn("No data to create Sankey diagram"); // FIMXE: remove
				return;
			}

			const container = this.$refs.sankeyContainer;
			if (!container || !container.parentElement) {
				// Ensure the container and its parent are accessible
				return;
			}
			d3.select(container).selectAll("*").remove(); // Clear the previous diagram
			
			const width = 1100;
			const height = this.figureHeight;
			const marginBottom = 50; // Margin for rank labels
			const marginRight = 150;
			const nodeWidth = 20;
			const nodePadding = 13;

			const svg = d3
				.select(container)
				.append("svg")
				.attr("viewBox", `0 0 ${width} ${height+marginBottom}`)
				.attr("width", "100%")
				.attr("height", height + marginBottom)
				.attr("id", this.id) // Set the id based on the prop for download reference
				.classed("hide", false); // FIXME: fix to svg

			const sankeyGenerator = sankey()
				.nodeId((d) => d.id)
				.nodeAlign(sankeyJustify)
				.nodeWidth(nodeWidth)
				.nodePadding(nodePadding)
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
			const columnWidth = (width - marginRight) / this.sankeyRankColumnsWithRoot.length;
			const columnMap = this.sankeyRankColumnsWithRoot.reduce((acc, rank, index) => {
				const leftMargin = 10;
				acc[rank] = index * columnWidth + leftMargin;
				return acc;
			}, {});

			// Update node positions (based on rank) and color
			graph.nodes.forEach((node) => {
				node.x0 = columnMap[node.rank];
				node.x1 = node.x0 + sankeyGenerator.nodeWidth();

				if (node.isUnclassifiedNode) {
					node.color = unclassifiedLabelColor;
				} else {
					node.color = color(node.id); // Assign color to node
				}
			});

			// Re-run the layout to ensure correct vertical positioning
			sankeyGenerator.update(graph);

			// Add rank column labels
			const rankLabels = [" ", "D", "K", "P", "C", "O", "F", "G", "S"];
			svg
				.append("g")
				.selectAll("text")
				.data(this.sankeyRankColumnsWithRoot)
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
				.attr("stroke", (d) => (d.target.isUnclassifiedNode ? unclassifiedLabelColor : d3.color(d.source.color))) // Set link color to source node color with reduced opacity
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
				.attr("class", (d) => "node-group taxid-" + d.id)
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
				.attr("fill", (d) => (d.isUnclassifiedNode ? unclassifiedLabelColor : d.color))
				.attr("class", (d) => "node taxid-" + d.id)
				.style("cursor", "pointer");

			// Add node name labels next to node
			nodeGroup
				.append("text")
				.attr("id", (d) => `nodeName-${d.id}`)
				.attr("class", (d) => "node-name taxid-" + d.id)
				.attr("x", (d) => d.x1 - d.x0 + 3)
				.attr("y", (d) => this.nodeHeight(d) / 2)
				.attr("dy", "0.35em")
				.attr("text-anchor", "start")
				.text((d) => d.name)
				.style("font-size", "10px")
				.style("font-weight", "normal")
				.style("fill", (d) => (d.isUnclassifiedNode ? unclassifiedLabelColor : "black"))
				.style("cursor", "pointer");

			// Add label above node (proportion/clade reads)
			nodeGroup
				.append("text")
				.attr("id", (d) => `cladeReads-${d.id}`)
				.attr("class", (d) => "clade-reads taxid-" + d.id)
				.attr("x", (d) => (d.x1 - d.x0) / 2)            
				.attr("y", -5)
				.attr("dy", "0.35em")
				.attr("text-anchor", "middle")
				.style("font-size", "10px")
				.style("font-weight", "normal")
				.style("fill", (d) => (d.isUnclassifiedNode ? unclassifiedLabelColor : "black"))
				.text((d) => (this.labelOption === "proportion" ? this.formatProportion(d.proportion) : this.formatCladeReads(d.clade_reads)))
				.style("cursor", "pointer");

			// Highlight nodes matching search query
			this.highlightNodes(this.searchQuery);

			// Verify sankey
			this.verifySankey();
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
		async verifySankey() {
			const extractedTaxonomyArray = this.extractTaxonomyArray();

			const properties = ["proportion", "clade_reads", "taxon_reads", "rank", "taxon_id", "nameWithIndentation"];
			
			// Regenerate taxonomy report from the sankey data
			const regeneratedReport = extractedTaxonomyArray
				.map(node => properties.map(property => node[property] || "").join("\t"))
				.join("\n");
			await this.saveTSVFile(regeneratedReport, "/Users/sunnylee/Desktop/test_regenerated_reportfile.tsv"); // FIXME: remove

			// Compare original taxonomy report and regenerated taxonomy report
			const originalReport = sessionStorage.getItem("reportFilePath");
			// const originalReport = "/Users/sunnylee/Documents/SteineggerLab/Metabuli-App/MetabuliTests/Test1/demo_outdir/2025-01-09_20-29-29_report.tsv"

			this.compareTSVContents(regeneratedReport, originalReport);
		},
		async saveTSVFile(content, filePath) { // FIXME: remove
			try {
				await window.electron.writeFile(filePath, content); // Ensure `writeFile` is implemented in preload.js
				console.log("File saved successfully:", filePath);
			} catch (error) {
				console.error("Error saving file:", error);
			}
		},
		extractTaxonomyArray() {
			const taxonomyReport = [];
			const depthDict = this.nodesByDepth;

			// Sort nodes in each depth in descending order of clade_reads
			Object.keys(depthDict).forEach((depth) => {
				depthDict[depth].sort((a, b) => b.clade_reads - a.clade_reads);
			});

			Object.keys(depthDict)
				.map(Number)
				.sort((a, b) => a - b) // sort depthDict in ascending order of depth
				.forEach((depth) => {
					// Insert parent-child relationships into taxonomy report
				   if (depth > 0) {
					   depthDict[depth - 1]?.forEach((parentNode) => {
						   // Insert parent and its children into taxonomy report
						   const parentIndex = taxonomyReport.findIndex(
							   (n) => n.taxon_id === parentNode.taxon_id
						   );
	   
						   if (parentIndex !== -1) {
							   taxonomyReport.splice(parentIndex + 1, 0, ...parentNode.children);
							} else {
								console.warn(`Parent node ${parentNode.name} not found in taxonomyReport.`);
							}
						});
				   } else {
						// For root nodes (depth 0), add to taxonomy report directly
						depthDict[depth].sort((a, b) => a.taxon_id - b.taxon_id);
						taxonomyReport.push(...depthDict[depth]);
				   }

				})

			return taxonomyReport;
		},
		async compareTSVContents(regeneratedReportContent, originalReportFile) {
			try {
				console.log(originalReportFile);
				// Read the TSV file content from the original report file
				const originalReportContent = await window.electron.readFile(originalReportFile, false);

				// Split both contents into lines
				const regeneratedReportEntries = regeneratedReportContent
					.split("\n")
					.map(line => line.trim()) 
					.filter(line => line !== ""); // Remove empty lines
				const originalReportEntries = originalReportContent
					.split("\n")
					.map(line => line.trim())
					.filter(line => line !== ""); // Remove empty lines

				// Compare line counts
				if (regeneratedReportEntries.length !== originalReportEntries.length) {
					console.log("The number of lines in the reports do not match.");
					console.log(`Regenerated report: ${regeneratedReportEntries.length}, Original report: ${originalReportEntries.length}`);
					return false;
				}

				// Compare each line
				for (let i = 0; i < regeneratedReportEntries.length; i++) {
 					const regeneratedEntryColumns = regeneratedReportEntries[i].split("\t");
					const originalEntryColumns = originalReportEntries[i].split("\t");

					if (regeneratedEntryColumns.length !== originalEntryColumns.length) {
						console.log(`Difference in column count on line ${i + 1}:`);
						console.log(`Generated: ${regeneratedReportEntries[i]}`);
						console.log(`File: ${originalReportEntries[i]}`);
						return false;
					}

					for (let j = 0; j < regeneratedEntryColumns.length; j++) {
						// Trim trailing whitespaces
						const trimTrailing = (str) => str.replace(/\s+$/, '');
						const generatedStringValue = trimTrailing(regeneratedEntryColumns[j]);
    					const fileStringValue = trimTrailing(originalEntryColumns[j]);

						// Attempt to parse as numbers
						const generatedNumber = parseFloat(generatedStringValue);
						const fileNumber = parseFloat(fileStringValue);

						if (!isNaN(generatedNumber) && !isNaN(fileNumber)) {
							// Compare numeric values with a precision threshold
							const precisionThreshold = 0.0001;
							if (Math.abs(generatedNumber - fileNumber) > precisionThreshold) {
								console.log(`Numeric difference found on line ${i + 1}, column ${j + 1}:`);
								console.log(`Generated: ${generatedStringValue}`);
								console.log(`File: ${fileStringValue}`);
								return false;
							}
						} else if (generatedStringValue !== fileStringValue) {
							// Compare as strings for non-numeric values
							console.log(`String difference found on line ${i + 1}, column ${j + 1}:`);
							console.log(`Generated: ${generatedStringValue}`);
							console.log(`File: ${fileStringValue}`);
							return false;
						}
					}
				}

				console.log("The TSV contents are identical.");
				return true;
			} catch (error) {
				console.error(`Error comparing TSV contents: ${error.message}`);
				return false;
			}
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
svg.hide {
	display: none;
}

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
