<template>
  <div ref="dialogSankeyContainer"></div>
</template>
  
<script>
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, sankeyJustify } from 'd3-sankey';
  
export default {
  name: 'SankeyNodeDialogDiagram',
  props: {
    data: Object,
    instanceId: String // Add an instanceId prop to ensure unique IDs
  },
  mounted() {
      this.createSankey();
  },
  methods: {
    createSankey() {
      const { nodes, links } = this.data;

      const container = this.$refs.dialogSankeyContainer;
      d3.select(container).selectAll('*').remove(); // Clear the previous diagram
      const width = window.innerWidth*0.9; // Set width to 90% of the window width
      const height = 600;
      const marginBottom = 50; // Margin for rank labels
      const marginRight = 10;

      const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height + marginBottom);
  
      const sankeyGenerator = sankey()
      .nodeId(d => d.id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(20)
      .nodePadding(12)
      .iterations(64)
      .extent([[10, 30], [width - marginRight, height - 6]]);

      const graph = sankeyGenerator({
          nodes: nodes.map(d => Object.assign({}, d)),
          links: links.map(d => Object.assign({}, d))
      });
  
      // Define color scale
      const color = d3.scaleOrdinal(d3.schemeCategory10);
      const unclassifiedLabelColor = 'gray';

      // Manually adjust nodes position to align by rank
      const rankOrder = ["superkingdom", "kingdom", "phylum", "class", "order", "family", "genus", "species", "no rank"];
      const columnWidth = (width - marginRight) / rankOrder.length;
      const columnMap = rankOrder.reduce((acc, rank, index) => {
          const leftMargin = 10;
          acc[rank] = index * columnWidth + leftMargin;
          return acc;
      }, {});

      graph.nodes.forEach(node => {
          node.x0 = columnMap[node.rank];
          node.x1 = node.x0 + sankeyGenerator.nodeWidth();
          node.color = color(node.id);
      });

      // Add rank column labels
      svg.append('g')
        .selectAll('text')
        .data(rankOrder)
        .enter().append('text')
        .attr('x', rank => columnMap[rank] + sankeyGenerator.nodeWidth() / 2)
        .attr('y', height + marginBottom / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .text(rank => rank[0].toUpperCase());

      // Draw rank label divider link 
      svg.append('line')
        .attr('x1', 0)
        .attr('y1', height+10)
        .attr('x2', width)
        .attr('y2', height+10)
        .attr('stroke', '#000')
        .attr('stroke-width', 1);

      // Function to highlight lineage
      const highlightLineage = (node) => {
        const lineageIds = new Set(node.lineage.map(n => n.id));
        lineageIds.add(node.id);

        svg.selectAll('rect').style('opacity', d => lineageIds.has(d.id) ? 1 : 0.2);
        svg.selectAll('path').style('opacity', d => lineageIds.has(d.source.id) && lineageIds.has(d.target.id) ? 1 : 0.2);
        svg.selectAll('.node-name').style('opacity', d => lineageIds.has(d.id) ? 1 : 0.1);
        svg.selectAll('.clade-reads').style('opacity', d => lineageIds.has(d.id) ? 1 : 0.1);
      };

      // Function to reset highlight
      const resetHighlight = () => {
        svg.selectAll('rect').style('opacity', 1);
        svg.selectAll('path').style('opacity', 1);
        svg.selectAll('.node-name').style('opacity', 1);
        svg.selectAll('.clade-reads').style('opacity', 1);
      };

      // Create node group (node + labels) and add mouse events
      const nodeGroup = svg.append('g')
        .selectAll('.node-group')
        .data(graph.nodes)
        .enter().append('g')
        .attr('class', 'node-group')
        .attr('transform', d => `translate(${d.x0}, ${d.y0})`)
        // .call(this.dragBehavior(graph, sankeyGenerator, svg))
        .on('mouseover', (event, d) => {
          if (d.type !== 'unclassified') {
            highlightLineage(d);
          }
        })
        .on('mouseout', (event, d) => {
          if (d.type !== 'unclassified') {
            resetHighlight();
          }
        })

      // Create node rectangles
      nodeGroup.append('rect')
        .attr('width', d => d.x1 - d.x0)
        .attr('height', d => this.nodeHeight(d))
        .attr('fill', d => d.type === 'unclassified' ? 'gray' : d.color) 
        .attr('class', 'node') // Apply the CSS class for cursor
        .style('cursor', d => d.type === 'unclassified' ? 'default' : 'grab')
        .append('title')
        .text(d => `${d.name}\n${d.clade_reads} clade reads (${d.proportion}%)`);
    
      // Add node name labels next to node
      nodeGroup.append('text')
        .attr('id', d => `nodeName-${d.id}`)
        .attr('class', 'node-name')
        .attr('x', d => d.x1 - d.x0 + 3)
        .attr('y', d => this.nodeHeight(d) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .text(d => d.name)
        .style('font-size', '10px')
        .style('fill',  d => d.type === 'unclassified' ? unclassifiedLabelColor : 'black')
        .style('cursor', d => d.type === 'unclassified' ? 'default' : 'pointer');
      
      // Add clade reads label above node
      nodeGroup.append('text')
        .attr('id', d => `cladeReads-${d.id}`)
        .attr('class', 'clade-reads')
        .attr('x', d => (d.x1 - d.x0) / 2)
        .attr('y', -5)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill',  d => d.type === 'unclassified' ? unclassifiedLabelColor : 'black')
        .text(d => this.formatCladeReads(d.clade_reads))
        .style('cursor', d => d.type === 'unclassified' ? 'default' : 'pointer');

      // Add links
      const link = svg.append('g')
        .attr('fill', 'none')
        .attr('stroke-opacity', 0.3)
        .selectAll('path')
        .data(graph.links)
        .enter().append('path')
        .attr('d', sankeyLinkHorizontal())
        .attr('stroke', d => d.target.type === 'unclassified' ? 'grey' : d3.color(d.source.color)) // Set link color to source node color with reduced opacity
        .attr('stroke-width', d => Math.max(1, d.width))
        .append('title')
        .text(d => `${d.source.name} → ${d.target.name}\n${d.target.clade_reads} clade reads (${d.target.proportion}%)`);

      // Add mouse event on links
      link
        .on('mouseover', (event, d) => {
          if (d.target.type !== 'unclassified') {
            d3.select(event.currentTarget).attr('stroke-opacity', 0.5);
          }
        })
        .on('mouseout', (event, d) => {
          if (d.target.type !== 'unclassified') {
            d3.select(event.currentTarget).attr('stroke-opacity', 0.2);
          }
        });
    },
    nodeHeight(d) { // FIXME
      let nodeHeight = d.y1 - d.y0;
      if (nodeHeight < 1) {
        return 1.5;
      } else {
        return d.y1 - d.y0;
      }
    },
    dragBehavior(graph, sankeyGenerator, svg) {
      // Function for defining drag behavior
      return d3.drag()
        .on('start', function () {
        })
        .on('drag', function (event, d) {
          d.y0 += event.dy;
          d.y1 += event.dy;
          d3.select(this).attr('transform', `translate(${d.x0}, ${d.y0})`);
          sankeyGenerator.update(graph);
          svg.selectAll('path').attr('d', sankeyLinkHorizontal());
        })
        .on('end', function () {
          d3.select(this).attr('stroke', null);
        });
    },
    formatCladeReads(value) {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(2)}k`;
      }
      return value.toString();
    }
  }
}
</script>
