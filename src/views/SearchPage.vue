<template>
    <div>
      <SearchSetting @job-complete="handleJobComplete" />

      <!-- Footer: Reference to Paper -->
      <v-container>
        <v-card>
          <v-card-title>Reference</v-card-title>
          <v-card-text>
            Kim J, Steinegger M. 
            <a href="https://www.nature.com/articles/s41592-024-02273-y" target="_blank">
              Metabuli: sensitive and specific metagenomic classification via joint analysis of amino acid and DNA.
            </a> 
            Nature Methods (2024).
          </v-card-text>
        </v-card>

      </v-container> 
    </div>
  </template>
  
<script>
import SearchSetting from '@/components/SearchSetting.vue';

  export default {
    name: 'SearchPage',
    components: {
      SearchSetting: SearchSetting
    },
    methods: {
      handleJobComplete(payload) {
        this.$emit('job-complete', { 
          outdir: payload.outdir, 
          jobid: payload.jobid 
        });
      },
    }
  };
</script>
  