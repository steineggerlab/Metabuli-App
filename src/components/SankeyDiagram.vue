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
      normalizeValue(value) {
        if (value > 90) {
          return 50;
        }
      }, 
      parseData(data) {
        const nodes = [];
        const links = [];
        const rankOrder = ["superkingdom", "kingdom", "phylum", "class", "order", "family", "genus", "species"];
        const rankHierarchy = rankOrder.reduce((acc, rank, index) => {
          acc[rank] = index;
          return acc;
        }, {});
        const rankMap = {};
        let lastNode = null;

        // Find the maximum proportion to use for normalization
        const maxProportion = Math.max(...data.map(d => parseFloat(d.proportion)));


        data.forEach( d => {
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
            console.log(node.rank, node.name);
            rankMap[d.rank] = node;

            if (lastNode) {
              console.log('lastNode: ', lastNode.name, lastNode.rank);
              console.log('currentNode: ', node.name, node.rank)
              console.log('rank compare: ', rankHierarchy[node.rank], rankHierarchy[lastNode.rank]);


              if (rankHierarchy[node.rank] <= rankHierarchy[lastNode.rank]) { // current node is of same rank
                let rankNumber = rankHierarchy[node.rank] - 1;
                let nodeToLeft = null;
                
                while (rankNumber >= 0 && !nodeToLeft) {
                  const rankAbove = rankOrder[rankNumber];
                  nodeToLeft = rankMap[rankAbove];
                  rankNumber--;
                }

                if (nodeToLeft) {
                  links.push({
                  source: nodeToLeft.id,
                  target: node.id,
                  // value: node.proportion
                  value: Math.log1p(node.proportion) / Math.log1p(maxProportion) // Normalized value
                  // value: this.normalizeValue(node.proportion)
                  });
                }
              
              } else if (rankHierarchy[node.rank] > rankHierarchy[lastNode.rank]) {
                console.log('lower rank: ', lastNode.rank, node.rank);
                links.push({
                  source: lastNode.id,
                  target: node.id,
                  // value: node.proportion
                  value: Math.log1p(node.proportion) / Math.log1p(maxProportion) // Normalized value
                  // value: this.normalizeValue(node.proportion)
                });
              }
            }
            lastNode = node;
          } else if (d.rank === "clade") {
            // lastNode = null; // little buggy, might need to find way set lastnode to the last highest hierarchy or something 
          }
        });

        return { nodes, links };
      },

      createSankey() {
        const { nodes, links } = this.parseData(this.data);

        const container = this.$refs.sankeyContainer;
        const width = 1100;
        const height = 650;

        const svg = d3.select(container)
          .append('svg')
          .attr('width', width)
          .attr('height', height);

        const sankeyGenerator = sankey()
          .nodeId(d => d.id)
          .nodeAlign(sankeyJustify)
          .nodeWidth(30)
          .nodePadding(10)
          .extent([[1, 1], [width - 1, height - 6]]);

        const graph = sankeyGenerator({
          nodes: nodes.map(d => Object.assign({}, d)),
          links: links.map(d => Object.assign({}, d))
        });

        // Manually adjust nodes position to align by rank
        const rankOrder = ["superkingdom", "kingdom", "phylum", "class", "order", "family", "genus", "species"];
        const columnMap = rankOrder.reduce((acc, rank, index) => {
          acc[rank] = index * (width / rankOrder.length);
          return acc;
        }, {});

        graph.nodes.forEach(node => {
          node.x0 = columnMap[node.rank];
          node.x1 = node.x0 + sankeyGenerator.nodeWidth();
        });

        svg.append('g')
          .selectAll('rect')
          .data(graph.nodes)
          .enter().append('rect')
          .attr('x', d => d.x0)
          .attr('y', d => d.y0)
          .attr('height', d => d.y1 - d.y0)
          .attr('width', d => d.x1 - d.x0)
          .attr('fill', '#696969')
          .append('title')
          .text(d => `${d.name}\n${d.proportion}\n${d.rank}`);

        const link = svg.append('g')
          .attr('fill', 'none')
          .attr('stroke', '#000')
          .attr('stroke-opacity', 0.2)
          .selectAll('path')
          .data(graph.links)
          .enter().append('path')
          .attr('d', sankeyLinkHorizontal())
          .attr('stroke-width', d => Math.max(1, d.width));

        link.append('title')
          .text(d => `${d.source.name} → ${d.target.name}\n${d.value}`);

        // Add hover effect on nodes and links
        svg.selectAll('rect')
          .on('mouseover', function() {
            d3.select(this).attr('fill', 'steelblue');
          })
          .on('mouseout', function() {
            d3.select(this).attr('fill', '#696969');
          });

        link.on('mouseover', function() {
          d3.select(this).attr('stroke-opacity', 0.3);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke-opacity', 0.2);
        });

        // Add node labels
        svg.append('g')
          .selectAll('text')
          .data(graph.nodes)
          .enter().append('text')
          // .attr('x', d => (d.x0 + d.x1) / 2)
          .attr('x', d =>  d.x1)
          .attr('y', d => (d.y0 + d.y1) / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .text(d => d.name);
      }
    }
  }
  </script>
