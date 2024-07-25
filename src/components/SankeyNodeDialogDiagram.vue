<template>
    <div ref="sankeyContainer" class="sankey-diagram"></div>
</template>
  
<script>
import * as d3 from 'd3'
import { sankey, sankeyLinkHorizontal, sankeyJustify } from 'd3-sankey'
  
export default {
    name: 'SankeyNodeDialogDiagram',
    props: {
        data: Object
    },
    mounted() {
        this.createSankey();
    },
    methods: {
        createSankey() {
            const { nodes, links } = this.data;
    
            const container = this.$refs.sankeyContainer;
            d3.select(container).selectAll('*').remove(); // Clear the previous diagram
            const width = window.innerWidth * 0.9; // Set width to 90% of the window width
            const height = 400;
            const marginBottom = 50; // Margin for rank labels
    
            const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height + marginBottom);
    
            const sankeyGenerator = sankey()
            .nodeId(d => d.id)
            .nodeAlign(sankeyJustify)
            .nodeWidth(20)
            .nodePadding(12)
            .extent([[10, 10], [width - 200, height - 6]]);
    
            const graph = sankeyGenerator({
            nodes: nodes.map(d => Object.assign({}, d)),
            links: links.map(d => Object.assign({}, d))
            });
    
            // Define color scale
            const color = d3.scaleOrdinal(d3.schemeCategory10);
    
            graph.nodes.forEach(node => {
            node.color = color(node.id); // Assign color to node
            });
    
            // Add nodes
            const nodeGroup = svg.append('g')
            .selectAll('.node-group')
            .data(graph.nodes)
            .enter().append('g')
            .attr('class', 'node-group')
            .attr('transform', d => `translate(${d.x0}, ${d.y0})`);
    
            nodeGroup.append('rect')
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => d.color)
            .attr('class', 'node');
    
            nodeGroup.append('text')
            .attr('x', d => d.x1 - d.x0 + 3)
            .attr('y', d => (d.y1 - d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'start')
            .text(d => d.name)
            .style('font-size', '10px')
            .style('fill', 'black');
    
            nodeGroup.append('text')
            .attr('x', d => (d.x1 - d.x0) / 2)
            .attr('y', -5)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', 'black')
            .text(d => `${d.clade_reads} clade reads`);
    
            // Add links
            svg.append('g')
            .attr('fill', 'none')
            .attr('stroke-opacity', 0.3)
            .selectAll('path')
            .data(graph.links)
            .enter().append('path')
            .attr('d', sankeyLinkHorizontal())
            .attr('stroke', d => d3.color(d.source.color))
            .attr('stroke-width', d => Math.max(1, d.width))
            .append('title')
            .text(d => `${d.source.name} → ${d.target.name}\n${d.target.clade_reads} clade reads`);
      }
    }
  }
</script>
  
<style scoped>
.sankey-diagram {
    overflow-x: auto;
    overflow-y: auto;
    max-height: 400px;
}
</style>
