import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg' // Built-in aliases: https://vuetifyjs.com/en/features/icon-fonts/#built-in-aliases
import { mdiAccount, mdiCloudUpload, mdiChartBar, mdiApi, mdiMagnify } from '@mdi/js' // Icon search: https://vuetifyjs.com/en/features/icon-fonts/#mdi-icon-search 

export default createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases,
      account: mdiAccount,
      upload: mdiCloudUpload,
      chartBar: mdiChartBar,
      api: mdiApi,
      magnify: mdiMagnify
    },
    // aliases,
    sets: {
      mdi,
    },
  },
})
