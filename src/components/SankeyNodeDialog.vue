<template>
    <v-dialog class="d-flex align-center justify-center flex-wrap text-center mx-auto my-4 px-4" v-model="localDialog" max-width="window.innerWidth">
        <!-- NODE DETAILS -->
        <v-card>
            <v-card-title>{{ hoverDetails.data.name }}</v-card-title>
            <v-card-text>
                <!-- <p v-if="hoverDetails.type === 'link'"><strong>Link:</strong> {{ hoverDetails.data.source.name }} → {{ hoverDetails.data.target.name }}</p> -->
                <p>Rank <strong>{{ hoverDetails.data.rank }}</strong></p>

                <p>TaxID {{ hoverDetails.data.id }}</p>
                <div class="taxid-breadcrumbs">
                    <p>
                    <a :href="`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${hoverDetails.data.id}`" target="_blank">
                        NCBI Taxonomy
                    </a> 
                    /
                    <a :href="`https://www.ncbi.nlm.nih.gov/assembly/?term=txid${hoverDetails.data.id}[Organism:exp]`" target="_blank">
                        Assemblies
                    </a>
                    /
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
                
            </v-card-text>
            
            <!-- NODE SUBTREE SANKEY DIAGRAM -->
             <SankeyDiagram :data="subtreeData" :isParsed="true"/>
            
            <v-card-actions>
                <v-btn color="primary" @click="closeDialog">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
  
<script>
import SankeyDiagram from './SankeyDiagram.vue';

  export default {
    name: 'SankeyNodeDialog',
    components: {
        SankeyDiagram
    },
    props: {
      hoverDetails: Object,
      dialog: Boolean,
      subtreeData: Object
    },
    data() {
      return {
        localDialog: this.dialog
      };
    },
    watch: {
      dialog(newVal) {
        this.localDialog = newVal;
      },
      localDialog(newVal) {
        if (!newVal) {
          this.$emit('close-dialog');
        } 
      }
    },
    methods: {
      closeDialog() {
        this.localDialog = false;
      }
    }
  }
</script>
  
<style scoped>
.taxid-breadcrumbs a {
  text-decoration: none;
}
</style>
  