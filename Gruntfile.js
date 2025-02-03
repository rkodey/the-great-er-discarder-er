module.exports = function(grunt) {

    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      manifest: grunt.file.readJSON('src/manifest.json'),
      concat: {
        options: {},
        dist: {
          src: [
            "src/js/db.js", "src/js/storage.js", "src/js/tabStates.js", "src/js/eventPage.js",
          ],
          dest: "src/js/background.js",
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
          dest: "build/zip/<%= pkg.name %>-<%= manifest.version %>.zip",
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
          dest: "build/crx/<%= pkg.name %>-<%= manifest.version %>.crx",
          options: {
            privateKey: "key.pem"
          }
        }
      }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-crx');
    grunt.registerTask('default', ['concat', 'crx']);
};

