<template>
    <div ref="sankeyContainer"></div>
  </template>
  
  <script>
  import * as d3 from 'd3'
  import { sankey, sankeyLinkHorizontal, sankeyJustify } from 'd3-sankey'
  
  export default {
    props: {
      data: {
        type: Object,
        required: true
      }
    },
    mounted() {
      this.createSankey()
    },
    methods: {
      createSankey() {
        const container = this.$refs.sankeyContainer
        const width = 900
        const height = 550
  
        const svg = d3.select(container)
          .append('svg')
          .attr('width', width)
          .attr('height', height)
  
        const { nodes, links } = sankey()
          .nodeId(d => d.id)
          .nodeAlign(sankeyJustify)
          .nodeWidth(30)
          .nodePadding(10)
          .extent([[1, 1], [width - 1, height - 6]])(this.data)
  
        svg.append('g')
          .selectAll('rect')
          .data(nodes)
          .enter().append('rect')
          .attr('x', d => d.x0)
          .attr('y', d => d.y0)
          .attr('height', d => d.y1 - d.y0)
          .attr('width', d => d.x1 - d.x0)
          .attr("fill", d => d.color = d3.color(d3.interpolateRainbow(Math.random())))
          .append('title')
          .text(d => `${d.name}\n${d.value}`)
  
        const link = svg.append('g')
          .attr('fill', 'none')
          .attr('stroke', '#000')
          .attr('stroke-opacity', 0.2)
          .selectAll('path')
          .data(links)
          .enter().append('path')
          .attr('d', sankeyLinkHorizontal())
          .attr('stroke-width', d => Math.max(1, d.width))
  
        link.append('title')
          .text(d => `${d.source.name} → ${d.target.name}\n${d.value}`)
      
        // Add node labels
        svg.append('g')
          .selectAll('text')
          .data(nodes)
          .enter().append('text')
          .attr('x', d => d.x0 - 6)
          .attr('y', d => (d.y1 + d.y0) / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'end')
          .text(d => d.name)
          .filter(d => d.x0 < width / 2)
          .attr('x', d => d.x1 + 6)
          .attr('text-anchor', 'start');
      }
    }
  }
  </script>
  