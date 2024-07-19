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
      parseData(data) {
        const nodes = [];
        const links = [];
        const rankOrder = ["superkingdom", "kingdom", "phylum", "class", "order", "family", "genus", "species"];
        const rankHierarchy = {'superkingdom': 0, 'kingdom': 1, "phylum": 2, "class": 3, "order": 4, "family": 5, "genus": 6, "species": 7}
        const rankMap = {};
        let lastNode = null;

        console.log(data);

        data.forEach( d => {
          // const id = index;
          // console.log(d); //DELETE
          const node = {
            id: d.taxon_id,
            name: d.name,
            rank: d.rank,
            proportion: parseFloat(d.proportion),
            clade_reads: d.clade_reads,
            taxon_reads: d.taxon_reads
          };

          if (rankOrder.includes(d.rank)) {
            nodes.push(node);
            // console.log(node.name, node.rank) //DELETE
            rankMap[d.rank] = node;

            if (lastNode) {
              console.log('lastNode: ', lastNode.name, lastNode.rank);
              console.log('currentNode: ', node.name, node.rank)
              console.log('rank compare: ', rankHierarchy[node.rank], rankHierarchy[lastNode.rank]);
              console.log('rank compare: ', rankHierarchy[node.rank] - rankHierarchy[lastNode.rank]);
              // const rankCompare = rankHierarchy[node.rank] - rankHierarchy[lastNode.rank]

              if (node.rank === lastNode.rank) { // current node is of same rank
                console.log('same rank: ',lastNode.rank, node.rank);
                const rankNumber = rankHierarchy[node.rank];
                const rankAbove = rankOrder[rankNumber - 1];
                const nodeToLeft = rankMap[rankAbove];
                
                links.push({
                source: nodeToLeft.id,
                target: node.id,
                value: node.proportion
                });
              } else if (rankHierarchy[node.rank] < rankHierarchy[lastNode.rank]) { // current node is higher rank
                console.log('higher rank: ', node.rank, lastNode.rank);
                const rankNumber = rankHierarchy[node.rank];
                const rankAbove = rankOrder[rankNumber - 1];
                console.log('rankAbove: ', rankAbove);
                const nodeToLeft = rankMap[rankAbove];
                console.log('nodeToLeft: ', nodeToLeft)

                links.push({
                source: nodeToLeft.id,
                target: node.id,
                value: node.proportion
                });
              } else if (rankHierarchy[node.rank] > rankHierarchy[lastNode.rank]) {
                console.log('lower rank: ', lastNode.rank, node.rank);
                links.push({
                  source: lastNode.id,
                  target: node.id,
                  value: node.proportion
                });
              }
            }
            lastNode = node;
          } else if (d.rank === "clade") {
            lastNode = null; // little buggy, might need to find way set lastnode to the last highest hierarchy or something 
          }
        });

        return { nodes, links };
      },
      createSankey() {
        const container = this.$refs.sankeyContainer
        const width = 900
        const height = 550
  
        const svg = d3.select(container)
          .append('svg')
          .attr('width', width)
          .attr('height', height)

        // const { nodes, links } = parseData(data);
  
        const { nodes, links } = sankey()
          .nodeId(d => d.id)
          .nodeAlign(sankeyJustify)
          .nodeWidth(30)
          .nodePadding(10)
          .extent([[1, 1], [width, height]])(this.parseData(this.data))
  
        // Add nodes
        svg.append('g')
          .selectAll('rect')
          .data(nodes)
          .enter().append('rect')
          .attr('x', d => d.x0)
          .attr('y', d => d.y0)
          .attr('height', d => d.y1 - d.y0)
          .attr('width', d => d.x1 - d.x0)
          .attr("fill", d => d.color = d3.color(d3.interpolateRainbow(Math.random())))
          .attr('rx', 2) // Set the radius for rounded corners
          .attr('ry', 2) // Set the radius for rounded corners
          .on('mouseover', function() {
            d3.select(this).attr('fill', 'grey');
          })
          .on('mouseout', function() {
            d3.select(this).attr('fill', d3.color(d3.interpolateRainbow(Math.random())));
          })
          .append('title')
          .text(d => `${d.name}\n${d.value}`)
  
        // Add links
        const link = svg.append('g')
          .attr('fill', 'none')
          .attr('stroke', '#000')
          .attr('stroke-opacity', 0.2)
          .selectAll('path')
          .data(links)
          .enter().append('path')
          .attr('d', sankeyLinkHorizontal())
          .attr('stroke-width', d => Math.max(1, d.width))
          .on('mouseover', function() {
            d3.select(this).attr('stroke-opacity', 0.5);
          })
          .on('mouseout', function() {
            d3.select(this).attr('stroke-opacity', 0.2);
          });
  
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
  