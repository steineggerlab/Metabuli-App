<template>
  <div class="sankey-container">
    <div ref="sankeyContainer" class="sankey-diagram"></div>

    <!-- TOOLTIP ON NODE HOVER -->
    <div ref="tooltip" class="tooltip" v-if="hoverDetails.visible">
      <div>{{ hoverDetails.data.name }}</div>
      <div>
        Rank: <strong>{{ hoverDetails.data.trueRank }}</strong>
      </div>
      <div>TaxID: {{ hoverDetails.data.taxon_id }}</div>
      <div>Proportion: {{ hoverDetails.data.proportion }}%</div>
      <div>Clade Reads: {{ hoverDetails.data.clade_reads }}</div>
      <div>Taxon Reads: {{ hoverDetails.data.taxon_reads }}</div>
    </div>

    <!-- NODE DETAILS DIALOG -->
    <SankeyNodeDialog
      :nodeDetails="nodeDetails"
      :dialog="dialog"
      @close-dialog="dialog = false"
    />
  </div>
</template>

<script>
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal, sankeyJustify } from "d3-sankey";
import SankeyNodeDialog from "./SankeyNodeDialog.vue";

export default {
  name: "SankeyDiagram",
  components: {
    SankeyNodeDialog,
  },
  props: {
    data: {
      type: Object,
      required: true,
    },
    taxaLimit: {
      type: Number,
    },
    minReads: {
      type: Number,
    },
  },
  data() {
    return {
      nodeDetails: null,
      dialog: false,
      fullGraphData: { nodes: [], links: [] },
      hoverDetails: {
        visible: false,
        data: {},
      },
    };
  },
  computed: {
    graphData() {
      return this.parseData(this.data);
    },
  },
  watch: {
    taxaLimit() {
      this.updateSankey();
    },
  },
  methods: {
    parseData(data) {
      const nodes = [];
      const unclassifiedNodes = [];
      const allNodes = [];
      const links = [];
      const allLinks = [];

      const rankOrder = [
        "superkingdom",
        "kingdom",
        "phylum",
        "class",
        "order",
        "family",
        "genus",
        "species",
      ];
      const rankOrderFull = [
        "superkingdom",
        "kingdom",
        "subkingdom",
        "superphylum",
        "phylum",
        "subphylum",
        "superclass",
        "class",
        "subclass",
        "superorder",
        "order",
        "suborder",
        "superfamily",
        "family",
        "subfamily",
        "supergenus",
        "genus",
        "subgenus",
        "superspecies",
        "species",
        "subspecies",
      ];
      const rankHierarchyFull = rankOrderFull.reduce((acc, rank, index) => {
        acc[rank] = index;
        return acc;
      }, {});
      let currentLineage = [];
      const nodesByRank = {}; // Store nodes by rank for filtering top 10

      // Step 1: Create nodes and save lineage data for ALL NODES (excluding clade ranks)
      data
        .filter((d) => d.rank !== "clade")
        .forEach((d) => {
          let node = {
            id: d.taxon_id,
            taxon_id: d.taxon_id,
            name: d.name,
            rank: d.rank,
            trueRank: d.rank,
            proportion: parseFloat(d.proportion),
            clade_reads: parseFloat(d.clade_reads),
            taxon_reads: d.taxon_reads,
            lineage: [
              ...currentLineage,
              { id: d.taxon_id, name: d.name, rank: d.rank },
            ], // Copy current lineage
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
                while (
                  lastLineageNode &&
                  rankHierarchyFull[node.rank] <=
                    rankHierarchyFull[lastLineageNode.rank]
                ) {
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
            let lastLineageNode =
              currentLineageCopy[currentLineageCopy.length - 1];

            if (lastLineageNode) {
              while (lastLineageNode && lastLineageNode.name !== parentName) {
                currentLineageCopy.pop();
                lastLineageNode =
                  currentLineageCopy[currentLineageCopy.length - 1];
              }
            }

            // Find the previous node in the lineage that is in rankOrder
            const parentNode = currentLineageCopy.find(
              (n) => n.name === parentName
            );
            if (parentNode && parentNode === lastLineageNode) {
              const lineage = currentLineageCopy;

              let previousNode = null;
              for (let i = lineage.length - 1; i >= 0; i--) {
                // Start from the last item
                if (rankOrder.includes(lineage[i].rank)) {
                  previousNode = lineage[i];
                  break;
                }
              }

              // Determine the rank immediately to the right of this node
              const parentRankIndex = rankOrder.indexOf(previousNode.rank);

              // Edit properties for unclassified taxa
              const nextRank = rankOrder[parentRankIndex + 1];

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
      rankOrder.forEach((rank) => {
        if (nodesByRank[rank]) {
          // Store all nodes
          allNodes.push(...nodesByRank[rank]);

          // Sort nodes by clade_reads in descending order and select the top nodes based on slider value
          const topNodes = nodesByRank[rank]
            .sort((a, b) => b.clade_reads - a.clade_reads)
            .slice(0, this.taxaLimit);
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
          if (
            rankOrder.includes(lineage[i].rank) &&
            nodes.includes(lineage[i])
          ) {
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
          if (
            rankOrder.includes(lineage[i].rank) &&
            allNodes.includes(lineage[i])
          ) {
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

      // Store full graph data
      this.fullGraphData = {
        nodes: [...allNodes],
        links: [...allLinks],
      };

      return { nodes, links };
    },

    filterData(data) {
      //FIXME:
      let filteredNodes = data.nodes;
      let filteredLinks = data.links;

      // Filter unclassified nodes if showUnclassified is false
      if (!this.showUnclassified) {
        filteredNodes = filteredNodes.filter(
          (node) =>
            node.rank !== "no rank" || !node.name.startsWith("unclassified")
        );
        const filteredNodeIds = new Set(filteredNodes.map((node) => node.id));
        filteredLinks = filteredLinks.filter(
          (link) =>
            filteredNodeIds.has(link.source) && filteredNodeIds.has(link.target)
        );
      }

      // Limit the number of nodes and links
      filteredNodes = filteredNodes.slice(0, this.nodeLimit);
      filteredLinks = filteredLinks.slice(0, this.linkLimit);

      return {
        nodes: filteredNodes,
        links: filteredLinks,
      };
    },

    isUnclassifiedTaxa(d) {
      const name = d.name;

      // Check if the name starts with "unclassified"
      if (!name.startsWith("unclassified")) {
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

    nodeHeight(d) {
      // FIXME
      let nodeHeight = d.y1 - d.y0;
      if (nodeHeight < 1) {
        return 1.5;
      } else {
        return d.y1 - d.y0;
      }
    },

    createSankey() {
      const { nodes, links } = this.graphData;
      // const { nodes, links } = this.filterData(this.data);

      const container = this.$refs.sankeyContainer;
      d3.select(container).selectAll("*").remove(); // Clear the previous diagram
      const width = window.innerWidth; // Set width to full window width
      const height = 500;
      const marginBottom = 50; // Margin for rank labels
      const marginRight = 150;

      const svg = d3
        .select(container)
        .append("svg")
        .attr("width", width)
        .attr("height", height + marginBottom)
        .attr("id", "sankey-svg"); // ID for download reference

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

      // Define color scale (https://wondernote.org/color-palettes-for-web-digital-blog-graphic-design-with-hexadecimal-codes/)
      const autumnColors = [
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
        "#FFF7C2",
        "#FFB27B",
        "#FFCD87",
        "#BC7576",
        "#696B7E",
      ];
      // const springColors = ['#afddd5', '#ffa700', '#ffcccd', '#f56093', '#64864a', '#dfe6e6', '#dfdec0', '#ff7e5a', '#ffbd00', '#7db954', '#feddcb', '#ffc700', '#cee8e5', '#c6b598', '#fee100', '#fac4c4', '#e0e7ad', '#fdbb9f', '#eadcc3', '#eef3b4', '#ffb27b', '#ff284b', '#7abaa1', '#cfeae4'];
      // const winterColors = ["#445A67", "#57838D", "#B4C9C7", "#F3BFB3", "#CCADB2", "#FFEFFF", "#F6F7FB", "#E0F8F5", "#BEEDE5", "#A7D9C9", "#50B4D8", "#9EDDEF", "#F7E5B7", "#D7E2EA", "#96B3C2", "#FFDAD1", "#FFEDDA", "#CAB3C1", "#6E7B8F", "#2E3332", "#C29BA3", "#E3BFB7", "#FFE4C9", "#B7EAF7", "#8A9BA7"];

      const color = d3.scaleOrdinal().range(autumnColors);
      const unclassifiedLabelColor = "#696B7E";

      // Manually adjust nodes position to align by rank
      const rankOrder = [
        "superkingdom",
        "kingdom",
        "phylum",
        "class",
        "order",
        "family",
        "genus",
        "species",
        "no rank",
      ];
      const columnWidth = (width - marginRight) / rankOrder.length;
      const columnMap = rankOrder.reduce((acc, rank, index) => {
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

      // Store full graph (used for drawing subtree upon node click)
      const fullGraph = sankeyGenerator({
        nodes: this.fullGraphData.nodes.map((d) => Object.assign({}, d)),
        links: this.fullGraphData.links.map((d) => Object.assign({}, d)),
      });
      fullGraph.nodes.forEach((node) => {
        node.x0 = columnMap[node.rank];
        node.x1 = node.x0 + sankeyGenerator.nodeWidth();
        node.color = color(node.id); // Assign color to node
      });
      this.fullGraph = fullGraph;

      // Add rank column labels
      svg
        .append("g")
        .selectAll("text")
        .data(rankOrder)
        .enter()
        .append("text")
        .attr("x", (rank) => columnMap[rank] + sankeyGenerator.nodeWidth() / 2)
        .attr("y", height + marginBottom / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text((rank) => rank[0].toUpperCase());

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

        svg
          .selectAll("rect")
          .style("opacity", (d) => (lineageIds.has(d.id) ? 1 : 0.2));
        svg
          .selectAll("path")
          .style("opacity", (d) =>
            lineageIds.has(d.source.id) && lineageIds.has(d.target.id) ? 1 : 0.2
          );
        svg
          .selectAll(".node-name")
          .style("opacity", (d) => (lineageIds.has(d.id) ? 1 : 0.1));
        svg
          .selectAll(".clade-reads")
          .style("opacity", (d) => (lineageIds.has(d.id) ? 1 : 0.1));
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
        .attr("id", (d, i) => `clip-path-${i}`)
        .append("rect")
        .attr("x", (d) => d.source.x1)
        .attr("y", 0)
        .attr("width", (d) => d.target.x0 - d.source.x1)
        .attr("height", height);

      // Add links
      const link = svg
        .append("g")
        .attr("fill", "none")
        .attr("stroke-opacity", 0.3)
        .selectAll("path")
        .data(graph.links)
        .enter()
        .append("path")
        .attr("d", sankeyLinkHorizontal())
        .attr("stroke", (d) =>
          d.target.type === "unclassified"
            ? unclassifiedLabelColor
            : d3.color(d.source.color)
        ) // Set link color to source node color with reduced opacity
        .attr("clip-path", (d, i) => `url(#clip-path-${i})`)
        .attr("stroke-width", (d) => Math.max(1, d.width))
        .append("title")
        .text(
          (d) =>
            `${d.source.name} → ${d.target.name}\n${d.target.clade_reads} clade reads (${d.target.proportion}%)`
        );

      //FIXME: Add mouse event on links
      link
        .on("mouseover", (event, d) => {
          if (d.target.type !== "unclassified") {
            d3.select(event.currentTarget).attr("stroke-opacity", 0.5);
          }
        })
        .on("mouseout", (event, d) => {
          if (d.target.type !== "unclassified") {
            d3.select(event.currentTarget).attr("stroke-opacity", 0.2);
          }
        });

      // Function to show tooltip
      this.showTooltip = (event, d) => {
        this.hoverDetails = {
          visible: true,
          data: d,
        };
        console.log(this.hoverDetails.data);
        this.moveTooltip(event, d);
      };

      // Function to move tooltip
      this.moveTooltip = (event, d) => {
        const tooltip = this.$refs.tooltip;
        const containerRect =
          this.$refs.sankeyContainer.getBoundingClientRect();
        const drawerWidth = this.$refs.navigationDrawer
          ? this.$refs.navigationDrawer.clientWidth
          : 0;

        if (tooltip) {
          tooltip.style.left =
            event.clientX - containerRect.left - drawerWidth + 15 + "px";
          tooltip.style.top = event.pageY - 200 + "px";
          tooltip.style.borderColor = d3.color(d.color);
        }
      };

      // Function to hide tooltip
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
        // .call(drag)
        .on("mouseover", (event, d) => {
          highlightLineage(d);
          this.showTooltip(event, d);
        })
        .on("mousemove", (event, d) => {
          this.moveTooltip(event, d);
        })
        .on("mouseout", () => {
          resetHighlight();
          this.hideTooltip();
        })
        .on("click", (event, d) => {
          this.showNodeDetails(event, d);
        });

      // Create node rectangles
      nodeGroup
        .append("rect")
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => this.nodeHeight(d))
        .attr("fill", (d) =>
          d.type === "unclassified" ? unclassifiedLabelColor : d.color
        )
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
        .style("fill", (d) =>
          d.type === "unclassified" ? unclassifiedLabelColor : "black"
        )
        .style("cursor", "pointer");

      // Add clade reads label above node
      nodeGroup
        .append("text")
        .attr("id", (d) => `cladeReads-${d.id}`)
        .attr("class", "clade-reads")
        .attr("x", (d) => (d.x1 - d.x0) / 2)
        .attr("y", -5)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .style("fill", (d) =>
          d.type === "unclassified" ? unclassifiedLabelColor : "black"
        )
        .text((d) => this.formatCladeReads(d.clade_reads))
        .style("cursor", "pointer");
    },
    updateSankey() {
      this.createSankey();
    },
    showNodeDetails(event, d) {
      const subtreeData = this.extractSubtreeData(d); // Extract subtree data for the clicked node
      this.dialog = true;
      this.nodeDetails = {
        type: "node",
        data: d,
        subtreeData: subtreeData,
      };
    },
    extractSubtreeData(node) {
      const graph = this.fullGraph;
      const subtreeNodes = new Set();
      const subtreeLinks = new Set();

      // Recursive function to get all descendant nodes and links
      const getDescendants = (currentNode) => {
        subtreeNodes.add(currentNode.id);
        graph.links.forEach((link) => {
          if (link.source.id === currentNode.id) {
            subtreeLinks.add(link);
            getDescendants(link.target);
          }
        });
      };

      // Recursive function to get all ancestor nodes and links
      // const getAncestors = (currentNode) => {
      //   subtreeNodes.add(currentNode.id);
      //   graph.links.forEach(link => {
      //     if (link.target.id === currentNode.id) {
      //       subtreeLinks.add(link);
      //       getAncestors(link.source);
      //     }
      //   });
      // };

      // Get all descendants and ancestors of the clicked node
      getDescendants(node);
      // getAncestors(node);

      // Filter nodes and links based on the subtree sets
      const subtreeData = {
        nodes: this.fullGraphData.nodes.filter((n) => subtreeNodes.has(n.id)),
        links: Array.from(subtreeLinks).map((link) => ({
          source: link.source.id,
          target: link.target.id,
          value: link.value,
        })),
      };

      return subtreeData;
    },
    formatCladeReads(value) {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}k`;
      }
      return value.toString();
    },
  },
  mounted() {
    this.createSankey();
  },
};
</script>

<style>
.sankey-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.sankey-diagram {
  flex: 1;
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

.tooltip {
  position: absolute;
  background-color: white;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
  pointer-events: none;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
</style>
