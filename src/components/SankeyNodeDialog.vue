<template>
    <v-dialog 
    class="d-flex align-center justify-center flex-wrap text-center mx-auto my-4 px-4" 
    v-model="localDialog" 
    max-width="window.innerWidth"
    scrollable
    >
        <!-- NODE DETAILS -->
        <v-card>
            <v-card-title>{{ nodeDetails.data.name }}</v-card-title>
            <v-card-text>
                <p>Rank <strong>{{ nodeDetails.data.rank }}</strong></p>

                <div class="taxid-breadcrumbs">
                  <p>TaxID {{ nodeDetails.data.id }}</p>
                  <p>
                    <a :href="`https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=${nodeDetails.data.id}`" target="_blank">NCBI Taxonomy</a> 
                    /
                    <a :href="`https://www.ncbi.nlm.nih.gov/assembly/?term=txid${nodeDetails.data.id}[Organism:exp]`" target="_blank">Assemblies</a>
                    /
                    <a :href="`https://pubmed.ncbi.nlm.nih.gov/?term=${nodeDetails.data.name}`" target="_blank">PubMed</a>
                  </p>
                </div>
                
                <br>

                <p><strong>Proportion:</strong> {{ nodeDetails.data.proportion }}%</p>
                <p><strong>Clade Reads:</strong> {{ nodeDetails.data.clade_reads }}</p>
                <p><strong>Taxon Reads:</strong> {{ nodeDetails.data.taxon_reads }}</p>
                
                <br>
                
                <p><strong>Lineage:</strong> {{ nodeDetails.data.lineage.map(n => `${n.name} (${n.rank})`).join(' > ') }}</p>
                
                <!-- NODE SUBTREE SANKEY DIAGRAM -->
                <SankeyNodeDialogDiagram :data="nodeDetails.subtreeData" :instanceId="uniqueInstanceId"/>
            </v-card-text>
            
            
            <v-card-actions>
                <v-btn color="primary" @click="closeDialog">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
  
<script>
import SankeyNodeDialogDiagram from './SankeyNodeDialogDiagram.vue';
import { v4 as uuidv4 } from 'uuid';

export default {
  name: 'SankeyNodeDialog',
  components: {
    SankeyNodeDialogDiagram
  },
  props: {
    nodeDetails: Object,
    dialog: Boolean,
    // subtreeData: Object
  },
  data() {
    return {
      localDialog: this.dialog,
      uniqueInstanceId: ''
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
  },
  mounted() {
    this.uniqueInstanceId = uuidv4();
  }

}
</script>
  
<style scoped>
.taxid-breadcrumbs a {
  text-decoration: none;
}
</style>
  