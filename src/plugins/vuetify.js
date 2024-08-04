import { createVuetify } from "vuetify";
import "vuetify/styles";
import { aliases, mdi } from "vuetify/iconsets/mdi-svg"; // Built-in aliases: https://vuetifyjs.com/en/features/icon-fonts/#built-in-aliases
import {
  mdiAccount,
  mdiCloudUpload,
  mdiChartBar,
  mdiApi,
  mdiMagnify,
  mdiDownload,
  mdiCogs,
  mdiTimer,
  mdiTimerSand,
  mdiFileUpload,
  mdiFileAlert,
  mdiHelpCircle,
  mdiDna,
  mdiOpenInNew
} from "@mdi/js"; // Icon search: https://vuetifyjs.com/en/features/icon-fonts/#mdi-icon-search

export default createVuetify({
  defaults: {
    VBtn: {
      rounded: "lg",
    },
  },
  theme: {
    dark: false, // dark theme 제외
    default: "light",
    themes: {
      light: {
        primary: "#1976D2",
        secondary: "#424242",
        accent: "#82B1FF",
        error: "#FF5252",
        info: "#2196F3",
        success: "#4CAF50",
        warning: "#FB8C00",
        blue: "#004DE5",
      },
    },
  },

  icons: {
    defaultSet: "mdi",
    aliases: {
      ...aliases,
      account: mdiAccount,
      upload: mdiCloudUpload,
      chartBar: mdiChartBar,
      api: mdiApi,
      magnify: mdiMagnify,
      download: mdiDownload,
      setting: mdiCogs,
      timer: mdiTimer,
      timerSand: mdiTimerSand,
      fileUpload: mdiFileUpload,
      fileAlert: mdiFileAlert,
      helpCircle: mdiHelpCircle,
      dna: mdiDna,
      openInNew: mdiOpenInNew
    },
    sets: {
      mdi,
    },
  },
});
