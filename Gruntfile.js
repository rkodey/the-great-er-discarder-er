const fs = require('fs');

module.exports = function(grunt) {

  const pkg       = grunt.file.readJSON('package.json');
  const manifest  = grunt.file.readJSON('src/manifest.json');

  const watchSources  = [
    "src/js/db.js",
    "src/js/storage.js",
    "src/js/tabStates.js",
    "src/js/eventPage.js",
  ];

  const bundleSources = [
    "src/**/*",
    "!src/js/db.js",
    "!src/js/storage.js",
    "!src/js/tabStates.js",
    "!src/js/eventPage.js",
    "!**/Thumbs.db"
  ]

  grunt.initConfig({

    concat: {
      options: {
        banner:
          // '// @ts-check\n' +
          `// ${manifest.name} - v${manifest.version} - <%= grunt.template.today("yyyy-mm-dd") %>\n\n`
      },
      dist: {
        src: watchSources,
        dest: 'src/js/background.js',
      },
    },

    watch: {
      scripts: {
        files: [ ...watchSources, 'Gruntfile.js' ],
        tasks: [ 'concat' ],
        options: { spawn: false },
      },
    },

    crx: {
      myPublicExtension: {
        src: bundleSources,
        dest: `build/zip/${pkg.name}.zip`,
      },

      mySignedExtension: {
        src: bundleSources,
        dest: `build/crx/${pkg.name}.crx`,
        options: {
          privateKey: "key.pem"
        }
      }
    }
  });

  // grunt.registerTask('clean', 'Remove zip and crx files', function() {
  //   console.log(grunt.config.get(['crx']).myPublicExtension.dest);
  //   // fs.rmSync(grunt.config.get(['crx']).myPublicExtension.dest);
  //   // fs.rmSync(grunt.config.get(['crx']).mySignedExtension.dest);
  // });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-crx');
  grunt.registerTask('default', ['concat', 'crx']);
  grunt.registerTask('build-watch', ['concat', 'watch']);

};
