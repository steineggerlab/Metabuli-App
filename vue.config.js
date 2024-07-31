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
          let resourcesPath;
          if (process.platform === 'darwin') {
            const appName = context.packager.appInfo.productFilename;
            resourcesPath = path.join(context.appOutDir, `${appName}.app`, 'Contents', 'Resources', 'bin');
          } else if (process.platform === 'win32') {
            resourcesPath = path.join(context.appOutDir, 'resources', 'bin');
          } else if (process.platform === 'linux') {
            resourcesPath = path.join(context.appOutDir, 'resources', 'bin');
          }
          console.log('Resources Path:', resourcesPath);

          if (!fs.existsSync(resourcesPath)) {
            console.error(`Path does not exist: ${resourcesPath}`);
            return;
          }

          const binaries = [
            path.join(resourcesPath, 'metabuli')
          ];

          binaries.forEach(binary => {
            try {
              fs.chmodSync(binary, '755');
              console.log(`Permissions set for ${binary}`);
              const stats = fs.statSync(binary);
              console.log(`Permissions for ${binary}:`, stats.mode);

            } catch (error) {
              console.error(`Failed to set permissions for ${binary}: ${error.message}`);
            }
          });
        }
      },
    },
  }
})
