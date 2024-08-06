<template>
  <div ref="dialogSankeyContainer" class="sankey-container"></div>

  <div
    v-if="!loading"
    key="sankey"
    ref="sankeyContainer"
    class="sankey-diagram"
  ></div>

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
</template>

<script>
import * as d3 from "d3";
import { sankey, sankeyLinkHorizontal, sankeyJustify } from "d3-sankey";

export default {
  name: "SankeyNodeDialogDiagram",
  props: {
    subtreeGraphData: Object,
    instanceId: String, // Add an instanceId prop to ensure unique IDs

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
  },
  data() {
    return {
      hoverDetails: {
        visible: false,
        data: {},
      },
    };
  },
  computed: {
    filteredGraphData() {
      // Filter data based on configurations

      if (!this.subtreeGraphData.nodes) {
        // Ensure data are defined before filtering
        return [];
      }

      return this.subtreeGraphData.nodes.filter((entry) => {
        // Check min reads criteria
        let passesMinReads = false;
        if (this.minCladeReadsMode === "%") {
          passesMinReads = parseFloat(entry.proportion) >= this.minReads;
        } else if (this.minCladeReadsMode === "#") {
          passesMinReads = parseFloat(entry.clade_reads) >= this.minReads;
        }

        // Check show unclassified criteria
        const passesUnclassified =
          this.showUnclassified || !this.isUnclassifiedTaxa(entry);

        // Data entry must pass both criteria to be included in sankey
        return passesMinReads && passesUnclassified;
      });
    },
  },
  mounted() {
    this.createSankey();
  },
  methods: {
    createSankey() {
      const { nodes, links } = this.filteredGraphData;

      // Check if nodes and links are not empty
      if (!nodes.length || !links.length) {
        console.warn("No data to create Sankey diagram, max is "); // FIXME: what to do when theres no graph to draw (empty state?)
        return;
      }

      const container = this.$refs.dialogSankeyContainer;
      d3.select(container).selectAll("*").remove(); // Clear the previous diagram
      const width = window.innerWidth; // Set width to 90% of the window width
      const height = 600;
      const marginBottom = 50; // Margin for rank labels
      const marginRight = 10;

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
          [10, 30],
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
      const color = d3.scaleOrdinal(autumnColors);
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
        .attr("id", (d, i) => `clip-path-${this.instanceId}-${i}`) // instance id (add to sankeydiagram.vue)
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
        .attr("stroke", (d) =>
          d.target.type === "unclassified"
            ? unclassifiedLabelColor
            : d3.color(d.source.color)
        ) // Set link color to source node color with reduced opacity
        .attr("stroke-width", (d) => Math.max(1, d.width))
        .attr("clip-path", (d, i) => `url(#clip-path-${this.instanceId}-${i})`) // add to sankeydiagram.vue
        .append("title")
        .text(
          (d) =>
            `${d.source.name} → ${d.target.name}\n${d.target.clade_reads} clade reads (${d.target.proportion}%)`
        );

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
        });

      // Create node rectangles
      nodeGroup
        .append("rect")
        .attr("width", (d) => d.x1 - d.x0)
        .attr("height", (d) => this.nodeHeight(d))
        .attr("fill", (d) =>
          d.type === "unclassified" ? unclassifiedLabelColor : d.color
        )
        .attr("class", "node"); // Apply the CSS class for cursor

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
        );
      // .style('cursor', d => d.type === 'unclassified' ? 'default' : 'pointer');

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
        .text((d) =>
          this.labelOption === "proportion"
            ? this.formatProportion(d.proportion)
            : this.formatCladeReads(d.clade_reads)
        )
        .style("cursor", (d) =>
          d.type === "unclassified" ? "default" : "pointer"
        );
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
    nodeHeight(d) {
      // FIXME
      let nodeHeight = d.y1 - d.y0;
      if (nodeHeight < 1) {
        return 1.5;
      } else {
        return d.y1 - d.y0;
      }
    },
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
