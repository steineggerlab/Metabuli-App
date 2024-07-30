const { defineConfig } = require('@vue/cli-service')
const path = require('path');

module.exports = defineConfig({
  transpileDependencies: true,

  pluginOptions: {
    vuetify: {
			// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
		},
    electronBuilder: {
      preload: path.resolve(__dirname, 'src/preload.js'), // Ensure this path is correct
      builderOptions: {
        extraResources: [
          {
            from: path.resolve(__dirname, 'src/preload.js'), // Ensure this path is correct
            to: 'preload.js',
            filter: ['**/*'],
          },
          {
            from: 'public/sample_data',
            to: 'sample_data',
            filter: ['**/*']
          }
        ],
         // Add icon paths for different platforms
         mac: {
           icon: path.resolve(__dirname, 'src/assets/icons/icon.icns')
         },
        //  win: {
        //   icon: path.resolve(__dirname, 'src/assets/icons/icon.ico')
        // },
        // linux: {
        //   icon: path.resolve(__dirname, 'src/assets/icons/icon.png')
        // }
      },
    },
  }
})
