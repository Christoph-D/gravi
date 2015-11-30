/*eslint-env commonjs*/

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    buildDir: "build",
    siteDir: "site",
    srcDir: "src",

    watch: {
      options: {
        atBegin: true
      },
      gravi: {
        files: [ "<%= srcDir %>/*.js" ],
        tasks: [ "compile", "karma:single-test" ]
      },
      site: {
        files: [ "<%= siteDir %>/*" ],
        tasks: [ "build-site" ]
      },
      test: {
        files: [ "spec/*.js" ],
        tasks: [ "test" ]
      },
      doc: {
        files: "doc/*.adoc",
        tasks: [ "doc" ]
      }
    },
    postcss: {
      options: {
        processors: [
          require("autoprefixer")(),
          require("cssnano")()
        ]
      },
      gravi: {
        expand: true,
        cwd: "<%= buildDir %>/",
        src: "*.css",
        dest: "<%= buildDir %>/"
      }
    },
    less: {
      gravi: {
        src: "<%= siteDir %>/graphs.less",
        dest: "<%= buildDir %>/graphs.css"
      }
    },
    copy: {
      index: {
        expand: true,
        dest: "<%= buildDir %>/",
        src: "index.html",
        cwd: "<%= siteDir %>"
      },
      lib: {
        expand: true,
        dest: "<%= buildDir %>/lib/",
        src: [ "require.js", "d3/d3.min.js", "d3.slider/*.{js,css}",
               "jquery-2.*.min.js", "jquery-ui/**/*",
               "babel-polyfill.min.js" ],
        cwd: "lib"
      }
    },
    clean: {
      all: [ "<%= buildDir %>/**/*" ]
    },
    shell: {
      doc: {
        command: "asciidoctor --destination-dir='<%= buildDir %>/doc' doc/\*.adoc || true"
      }
    },
    karma: {
      "single-test": {
        configFile: "karma.conf.js",
        singleRun: true
      },
      watch: {
        configFile: "karma.conf.js"
      }
    },
    babel: {
      gravi: {
        expand: true,
        flatten: true,
        src: "<%= srcDir %>/*.js",
        dest: "<%= buildDir %>/js"
      },
      test: {
        expand: true,
        flatten: true,
        src: "spec/*.js",
        dest: "<%= buildDir %>/specjs"
      },
      options: {
        sourceMap: true
      }
    },
    eslint: {
      gravi: {
        src: ["<%= srcDir %>/*.js"]
      },
      test: {
        src: ["spec/*.js"]
      }
    }
  });

  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-requirejs");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("gruntify-eslint");
  grunt.loadNpmTasks("grunt-postcss");
  grunt.loadNpmTasks("grunt-shell");
  grunt.loadNpmTasks("grunt-karma");
  grunt.loadNpmTasks("grunt-babel");

  grunt.registerTask("compile", [ "babel:gravi", "eslint:gravi" ]);
  grunt.registerTask("build-site", [ "less", "postcss", "copy" ]);
  grunt.registerTask("build", [ "compile", "build-site" ]);
  grunt.registerTask("minify", [ "compile", "requirejs:gravi" ]);

  grunt.registerTask("doc", [ "shell:doc"]);

  grunt.registerTask("test", [ "babel:test", "karma:single-test", "eslint:test" ]);

  grunt.registerTask("default", [ "build", "doc", "test" ]);
};
