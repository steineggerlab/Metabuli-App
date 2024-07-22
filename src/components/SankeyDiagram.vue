<template>
  <div class="sankey-container">
    <div ref="sankeyContainer" class="sankey-diagram"></div>

    <!-- NODE OR LINK DETAILS PANEL -->
    <v-sheet class="details-sheet" elevation="2">
      <v-card-text v-if="hoverDetails">
        <div v-if="hoverDetails.type === 'node'">

          <h3>{{ hoverDetails.data.name }}</h3>

          <p>Rank <strong>{{ hoverDetails.data.rank }}</strong></p>
          
          <p>TaxID {{ hoverDetails.data.id }}</p>
          <div class="tab">
            <p>
              <a :href="`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${hoverDetails.data.id}`" target="_blank">
                NCBI Taxonomy
              </a> 
            </p>
            <p>
              <a :href="`https://www.ncbi.nlm.nih.gov/assembly/?term=txid${hoverDetails.data.id}[Organism:exp]`" target="_blank">
                Assemblies
              </a>
            </p>
            <p>
              <a :href="`https://pubmed.ncbi.nlm.nih.gov/?term=${hoverDetails.data.name}`" target="_blank">
                PubMed
              </a>
            </p>
          </div>

          <br>

          <p><strong>Proportion:</strong> {{ hoverDetails.data.proportion }}%</p>
          <p><strong>Clade Reads:</strong> {{ hoverDetails.data.clade_reads }}</p>
          <p><strong>Taxon Reads:</strong> {{ hoverDetails.data.taxon_reads }}</p>

          <br>
          <!-- <p><strong>Lineage:</strong> {{ hoverDetails.data.lineage.map(n => n.name).join(' > ') }}</p> -->
          <pre>{{ formattedLineage }}</pre>
         

        </div>
        <div v-else-if="hoverDetails.type === 'link'">
          <h3>Link Details</h3>
          <p><strong>Source:</strong> {{ hoverDetails.data.source.name }}</p>
          <p><strong>Target:</strong> {{ hoverDetails.data.target.name }}</p>
          <p><strong>Value:</strong> {{ hoverDetails.data.value }}</p>
        </div>
      </v-card-text>
      <v-card-text v-else>
        <p>Hover over a node or link to see details.</p>
      </v-card-text>
    </v-sheet>
  </div>
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
    data() {
      return {
        hoverDetails: null
        };
    },
    computed: {
      formattedLineage() {
        if (!this.hoverDetails || !this.hoverDetails.data.lineage) return '';
        return this.hoverDetails.data.lineage.map((node, index) => {
          const prefix = ' '.repeat(index * 2) + (index === 0 ? '' : '└ ');
          return `${prefix}${node.name}`;
        }).join('\n');
      }
    },
    methods: {
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
        let currentLineage = [];

        // Find the maximum proportion to use for normalization
        const maxProportion = Math.max(...data.map(d => parseFloat(d.proportion)));

        data.forEach( d => {
          const node = {
            id: d.taxon_id,
            name: d.name,
            rank: d.rank,
            proportion: parseFloat(d.proportion),
            clade_reads: d.clade_reads,
            taxon_reads: d.taxon_reads,
            lineage: [...currentLineage, {id: d.taxon_id, name: d.name, rank: d.rank}]  // Copy current lineage
          };

          // Include all ranks for lineage tracking
          if (node.rank !== "no rank") {
            currentLineage.push(node);
          }

          // Add node to sankey diagram
          if (rankOrder.includes(d.rank)) {
            nodes.push(node);
            console.log(node.rank, node.name); //DELETE
            rankMap[d.rank] = node; // Store the most recent node in the current hierarchy

            if (lastNode) {
              if (rankHierarchy[node.rank] <= rankHierarchy[lastNode.rank]) { // Current node is of EQUAL OR HIGHER RANK than the last added node
                let rankNumber = rankHierarchy[node.rank] - 1;
                let nodeToLeft = null;

                // Adjust lineage by removing the lastNode
                
                // Find most recent non-null node to the left to create link with
                while (rankNumber >= 0 && !nodeToLeft) {
                  const rankAbove = rankOrder[rankNumber];
                  nodeToLeft = rankMap[rankAbove];
                  rankNumber--;
                }
                if (nodeToLeft) {
                  links.push({
                  source: nodeToLeft.id,
                  target: node.id,
                  value: Math.log1p(node.proportion) / Math.log1p(maxProportion) // Normalized value
                  });
                }
              
              } else if (rankHierarchy[node.rank] > rankHierarchy[lastNode.rank]) { // Current node is of LOWER RANK than the last added node
                console.log('lower rank: ', lastNode.rank, node.rank);
                links.push({
                  source: lastNode.id,
                  target: node.id,
                  value: Math.log1p(node.proportion) / Math.log1p(maxProportion) // Normalized value
                });
              }
            }
            lastNode = node;
          } 
          // else if (d.rank === "clade") {
          //   // currentLineage = [];  // Reset lineage for new clade
          // }
        });

        return { nodes, links };
      },

      nodeHeight(d) { // FIXME
        console.log(d.proportion);
        if (d.value < 0.05) {
          return 2;
        } 
        // else if (d.value > 92 ) {
        //   return 50;
        // } 
        else {
          return d.y1 - d.y0;
        }
      },

      createSankey() {
        const { nodes, links } = this.parseData(this.data);

        const container = this.$refs.sankeyContainer;
        const width = 900;
        const height = 650;
        const marginBottom = 50; // Margin for rank labels

        const svg = d3.select(container)
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .attr('height', height + marginBottom); // Increase height for labels

        const sankeyGenerator = sankey()
          .nodeId(d => d.id)
          .nodeAlign(sankeyJustify)
          .nodeWidth(20)
          .nodePadding(11)
          .extent([[1, 1], [width, height - 6]]); 

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

        // Add column labels
        svg.append('g')
          .selectAll('text')
          .data(rankOrder)
          .enter().append('text')
          .attr('x', rank => columnMap[rank] + sankeyGenerator.nodeWidth() / 2)
          .attr('y', height + marginBottom / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .text(rank => rank[0].toUpperCase());

        // Draw the line above the nodes
        svg.append('line')
          .attr('x1', 0)
          .attr('y1', height+10)
          .attr('x2', width)
          .attr('y2', height+10)
          .attr('stroke', '#000')
          .attr('stroke-width', 1);

        // Add nodes
        svg.append('g')
          .selectAll('rect')
          .data(graph.nodes)
          .enter().append('rect')
          .attr('x', d => d.x0)
          .attr('y', d => d.y0)
          .attr('height', d => d.y1 - d.y0)
          .attr('height', d => this.nodeHeight(d))
          .attr('width', d => d.x1 - d.x0)
          .attr('fill', '#696969')
          .append('title')
          .text(d => `${d.name}\n${d.proportion}\n${d.rank}`);

        // Add links
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
          .on('mouseover', (event) => {
            d3.select(event.currentTarget).attr('fill', 'steelblue');
          })
          .on('mouseout', (event) => {
            d3.select(event.currentTarget).attr('fill', '#696969');
          })
          .on('click', (event, d) => {
            this.showNodeDetails(event, d);
          });

        link
          .on('mouseover', (event) => {
            d3.select(event.currentTarget).attr('stroke-opacity', 0.3);
          })
          .on('mouseout', (event) => {
            d3.select(event.currentTarget).attr('stroke-opacity', 0.2);
          })
          .on('click', (event, d) => {
            this.showLinkDetails(event, d);
          });

        // Add node labels
        svg.append('g')
          .selectAll('text')
          .data(graph.nodes)
          .enter().append('text')
          .attr('x', d =>  d.x1 + 3)
          .attr('y', d => (d.y0 + d.y1) / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'start')
          .style('font-size', '10px') // Adjust the font size here
          .text(d => d.name);
      },
      showNodeDetails(event, d) {
        this.hoverDetails = {
          type: 'node',
          data: d
        };
        console.log(this.hoverDetails);
      },
      showLinkDetails(event, d) {
        this.hoverDetails = {
          type: 'link',
          data: d
        };
      },
      clearDetails() {
        this.hoverDetails = null;
      }
    },
    mounted() {
      this.createSankey()
    },
  }
  </script>

<style scoped>
.sankey-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
}  
.sankey-diagram {
  flex: 1;
}  
.details-sheet {
  /* width: 300px; */
  /* height: 500px; */
}
.tab {
  margin-left: 15px;
}
</style>