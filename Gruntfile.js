module.exports = function(grunt) {

    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      manifest: grunt.file.readJSON('src/manifest.json'),
      concat: {
        options: {},
        dist: {
          src: [ "src/js/db.js", "src/js/storage.js", "src/js/tabStates.js", "src/js/eventPage.js" ],
          dest: "src/js/background.js",
        },
      },
      watch: {
        scripts: {
          files: [ "src/js/db.js", "src/js/storage.js", "src/js/tabStates.js", "src/js/eventPage.js" ],
          tasks: ['concat'],
          options: { spawn: false },
        },
      },
      crx: {
        myPublicExtension: {
          src: [
              "src/**/*",
              "!src/js/db.js",
              "!src/js/storage.js",
              "!src/js/tabStates.js",
              "!src/js/eventPage.js",
              "!**/screenshot*.png",
              "!**/Thumbs.db"
          ],
          dest: "build/zip/<%= pkg.name %>.zip",
        },

        mySignedExtension: {
          src: [
              "src/**/*",
              "!src/js/db.js",
              "!src/js/storage.js",
              "!src/js/tabStates.js",
              "!src/js/eventPage.js",
              "!**/screenshot*.png",
              "!**/Thumbs.db"
          ],
          dest: "build/crx/<%= pkg.name %>.crx",
          options: {
            privateKey: "key.pem"
          }
        }
      }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-crx');
    grunt.registerTask('default', ['concat', 'crx']);
};
