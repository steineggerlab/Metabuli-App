<template>
  <div>
  <v-container> 
    <v-card>


      <v-toolbar title="Search Settings"></v-toolbar>
      <v-file-input clearable density="compact" label="q1" variant="underlined"></v-file-input>
      <v-file-input clearable density="compact" label="q2" variant="underlined"></v-file-input>
      <v-file-input clearable density="compact" label="db" variant="underlined"></v-file-input>
      <v-file-input clearable density="compact" label="outdir" variant="underlined"></v-file-input>
      <v-text-field label="Job ID" variant="underlined"></v-text-field>
      <v-text-field label="Max RAM" variant="underlined"></v-text-field>

      <v-btn :loading="waiting" @click="clickButton">
        Click
      </v-btn>
    </v-card>

    
  
  </v-container>

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
  name: 'SearchSetting',

  data: () => ({
	waiting: false
}),
  methods: {
	clickButton () {
		this.waiting = true
		// do what you want
		this.waiting = false
	}
}
}
</script>
