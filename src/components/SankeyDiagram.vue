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
          <p><strong>Lineage:</strong> {{ hoverDetails.data.lineage.map(n => `${n.name} (${n.rank})`).join(' > ') }}</p>
          <!-- <pre>{{ formattedLineage }}</pre> -->
         

        </div>
        <div v-else-if="hoverDetails.type === 'link'">
          <h3>Link Details</h3>
          <p><strong>Source:</strong> {{ hoverDetails.data.source.name }}</p>
          <p><strong>Target:</strong> {{ hoverDetails.data.target.name }}</p>
          <p><strong>Value:</strong> {{ hoverDetails.data.value }}</p>
        </div>
      </v-card-text>
      <v-card-text v-else>
        <p>Click on a node or link to see details.</p>
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
        const rankOrderFull = ["superkingdom", "kingdom", "subkingdom", "superphylum", "phylum", "subphylum", "superclass", "class", "subclass", "superorder", "order", "suborder", "superfamily", "family", "subfamily", "supergenus", "genus", "subgenus", "superspecies", "species", "subspecies"];
        const rankHierarchyFull = rankOrderFull.reduce((acc, rank, index) => {
          acc[rank] = index;
          return acc;
        }, {});
        let currentLineage = [];
        const nodesByRank = {}; // Store nodes by rank for filtering top 10

        // Step 1: Create nodes and save lineage data
        data.forEach( d => {
          const node = {
            id: d.taxon_id,
            name: d.name,
            rank: d.rank,
            proportion: parseFloat(d.proportion),
            clade_reads: parseFloat(d.clade_reads),
            taxon_reads: d.taxon_reads,
            lineage: [...currentLineage, {id: d.taxon_id, name: d.name, rank: d.rank}]  // Copy current lineage
          };

          // Add node to rank-specific collection
          if (!nodesByRank[d.rank]) {
            nodesByRank[d.rank] = [];
          }
          nodesByRank[d.rank].push(node);
          
          // Include all ranks for lineage tracking
          if (node.rank !== "no rank" && node.rank !== "clade") {
            let lastLineageNode = currentLineage[currentLineage.length-1];

            if (lastLineageNode) {
              while (lastLineageNode && rankHierarchyFull[node.rank] <= rankHierarchyFull[lastLineageNode.rank]) {
                currentLineage.pop(); 
                lastLineageNode = currentLineage[currentLineage.length-1];
              }
            }

            // Append current node to currentLineage array + store lineage data 
            currentLineage.push(node);
            node.lineage = [...currentLineage];
          }
        });

        // Step 2: Filter top 10 nodes by clade_reads for each rank in rankOrder + add nodes to sankey diagram
        rankOrder.forEach(rank => {
          if (nodesByRank[rank]) {
            const topNodes = nodesByRank[rank].sort((a, b) => b.clade_reads - a.clade_reads).slice(0, 100);
            nodes.push(...topNodes);
          }
        });

        // Step 3: Create links based on filtered nodes' lineage
        nodes.forEach(node => {
          // Find the previous node in the lineage that is in rankOrder
          const lineage = node.lineage;
          let previousNode = null;
          for (let i = lineage.length - 2; i >= 0; i--) { // Start from the second last item
              if (rankOrder.includes(lineage[i].rank) && nodes.includes(lineage[i])) {
              previousNode = lineage[i];
              break;
            }
          }

          if (previousNode) {
            links.push({
              source: previousNode.id,
              target: node.id,
              value: node.proportion
            });
          }
        });
        
        return { nodes, links };
      },

      nodeHeight(d) { // FIXME
        let nodeHeight = d.y1 - d.y0;
        if (nodeHeight < 1) {
          return 1.5;
        } 
        // if (d.clade_reads < 10){
        //   d.clade_reads *= 2;
        //   return d.y1 - d.y0;
        // }
        else {
          return d.y1 - d.y0;
        }
      },

      createSankey() {
        const { nodes, links } = this.parseData(this.data);

        const container = this.$refs.sankeyContainer;
        const width = window.innerWidth-300;
        const height = 680;
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
          .nodePadding(12)
          .extent([[10, 10], [width - 200, height - 6]]); 

        const graph = sankeyGenerator({
          nodes: nodes.map(d => Object.assign({}, d)),
          links: links.map(d => Object.assign({}, d))
        });

        // Manually adjust nodes position to align by rank
        const rankOrder = ["superkingdom", "kingdom", "phylum", "class", "order", "family", "genus", "species"];
        const columnWidth = (width - 150) / rankOrder.length;
        const columnMap = rankOrder.reduce((acc, rank, index) => {
          const leftMargin = 10;
          acc[rank] = index * columnWidth + leftMargin;
          return acc;
        }, {});

        graph.nodes.forEach(node => {
          node.x0 = columnMap[node.rank];
          node.x1 = node.x0 + sankeyGenerator.nodeWidth();
        });

        // // Add column labels
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

        // Define the drag behavior
        const drag = d3.drag()
          .subject(function(d) { return d; })
          .on('start', function() {
            d3.select(this).raise().attr('stroke', 'black');
          })
          .on('drag', function(event, d) {
            d.y0 = d.y0 + event.dy;
            d.y1 = d.y1 + event.dy;
            d3.select(this).attr('y', d.y0);
            sankeyGenerator.update(graph);
            svg.selectAll('path').attr('d', sankeyLinkHorizontal());

            // Update the positions of the labels
            d3.select(`#cladeReads-${d.id}`).attr('y', d.y0 - 5);
            d3.select(`#nodeName-${d.id}`).attr('y', (d.y0 + d.y1) / 2);
          })
          .on('end', function() {
            d3.select(this).attr('stroke', null);
          });

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

        // Add nodes
        svg.append('g')
          .selectAll('rect')
          .data(graph.nodes)
          .enter().append('rect')
          .attr('x', d => d.x0)
          .attr('y', d => d.y0)
          // .attr('height', d => d.y1 - d.y0)
          .attr('height', d => this.nodeHeight(d))
          .attr('width', d => d.x1 - d.x0)
          .attr('fill', '#696969')
          .attr('class', 'node') // Apply the CSS class for cursor
          .append('title')
          .text(d => `${d.name}\n${d.clade_reads} clade reads (${d.proportion}%)`);

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
          .text(d => `${d.source.name} → ${d.target.name}\n${d.target.clade_reads} clade reads (${d.target.proportion}%)`);

        // Add mouse event on nodes and links
        svg.selectAll('rect')
          .call(drag) // Apply drag behavior
          .on('mouseover', (event, d) => {
            d3.select(event.currentTarget).attr('fill', 'steelblue');
            highlightLineage(d);
          })
          .on('mouseout', (event) => {
            d3.select(event.currentTarget).attr('fill', '#696969');
            resetHighlight();
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

        // Add node name labels next to node
        svg.append('g')
          .selectAll('text')
          .data(graph.nodes)
          .enter().append('text')
          .attr('id', d => `nodeName-${d.id}`)
          .attr('class', 'node-name') // Needed for greying out on node hover
          .attr('x', d =>  d.x1 + 3)
          .attr('y', d => (d.y0 + d.y1) / 2)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'start')
          .style('font-size', '10px') 
          .text(d => d.name);

        // Add clade reads label above node
        svg.append('g')
          .selectAll('text')
          .data(graph.nodes)
          .enter().append('text')
          .attr('id', d => `cladeReads-${d.id}`)
          .attr('class', 'clade-reads') // Needed for greying out on node hover
          .attr('x', d => (d.x0 + d.x1) / 2)
          .attr('y', d => d.y0 - 5)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .style('font-size', '10px')
          .text(d => this.formatCladeReads(d.clade_reads));
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
      },
      formatCladeReads(value) {
        if (value >= 1000) {
          return `${(value / 1000).toFixed(2)}k`;
        }
        return value.toString();
      }
    },
    mounted() {
      this.createSankey()
    },
  }
  </script>

<style>
.sankey-container {
  display: flex;
  flex-direction: row;
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


.node {
  cursor: grab;
}

.node:active {
  cursor: grabbing;
}

</style>