<template>
    <div>
      <SearchSetting @job-complete="handleJobComplete" />
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
        console.log(payload.outdir); //DELETE
        this.$router.push( {
          
          name: 'ResultsPage',
          
          query: { 
            outdir: payload.outdir, 
            jobid: payload.jobid 
          }
        })
      },
      // handleJobComplete() {
      //   this.$router.push( {
      //     name: 'ResultsPage',

      //   });
      // }
    }
  };
</script>
  