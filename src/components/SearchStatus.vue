<template>
    <div>
    <v-container> 
      <v-card>
  
  
        <v-toolbar title="Status"></v-toolbar>
        <v-file-input clearable density="compact" label="q1" variant="underlined"></v-file-input>

      </v-card>
    
    </v-container>
  
    </div>
  </template>
  
  <script>
  
  export default {
    name: 'SearchStatus',
  
    data: () => ({
        message: "",
        status: 'initial'
  }),
    methods: {
        //
  }
  }
  </script>
  