const { defineConfig } = require('@vue/cli-service')
const path = require('path');
const fs = require('fs');

module.exports = defineConfig({
  transpileDependencies: true,

  outputDir: path.resolve(__dirname, 'build'),

  pluginOptions: {
    vuetify: {
			// https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vuetify-loader
		},
    electronBuilder: {
      preload: path.resolve(__dirname, 'src/preload.js'), // Ensure this path is correct
      builderOptions: {
        directories: {
          output: 'build' // Set the output directory for the built app
        },
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
          },
          {
            from: 'public/assets',
            to: 'assets',
            filter: ['**/*']
          },
          {
            "from": "resources/${os}/${arch}",
            "to": "bin",
            filter: ['**/*']
          }
        ],
         // Add icon paths for different platforms
         mac: {
          icon: path.resolve(__dirname, 'src/assets/icons/icon.icns'),
          target: [
            {
              target: 'dmg',
              arch: [ 
                'universal' 
              ]
            }
          ]
        },
        win: {
          icon: path.resolve(__dirname, 'src/assets/icons/icon.ico'),
          target: [
            {
              "target": "nsis",
              "arch": [
                "x64"
              ]
            } 
          ] 
        },
        linux: {
          icon: path.resolve(__dirname, 'src/assets/icons/icon.png'),
          "target": [
            {
              "target": "AppImage",
              "arch": [
                "x64",
                "arm64"
              ]
            }
          ]
        },
        // Define the targets for the build
        target: [
          'mac',
          'win',
          'linux'
        ],
        afterPack: async (context) => {
          const resourcesPath = context.appOutDir;
          const binaries = [
            path.join(resourcesPath, 'bin', 'metabuli')
          ];

          binaries.forEach(binary => {
            try {
              fs.chmodSync(binary, '755');
              console.log(`Permissions set for ${binary}`);
            } catch (error) {
              console.error(`Failed to set permissions for ${binary}: ${error.message}`);
            }
          });
        }
      },
    },
  }
})
