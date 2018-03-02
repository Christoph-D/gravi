/*eslint-env commonjs*/
"use strict";

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),

    buildDir: "build",
    siteDir: "site",
    srcDir: "src",

    bower: {
      gravi: {}
    },
    watch: {
      options: {
        atBegin: true
      },
      gravi: {
        files: [ "<%= srcDir %>/*.{js,ts}" ],
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
        flatten: true,
        dest: "<%= buildDir %>/lib/",
        src: [ "js/requirejs/require.js", "js/d3/d3.min.js",
               "../node_modules/babel-polyfill/dist/polyfill.min.js" ],
        cwd: "lib"
      },
      morelib: {
        expand: true,
        dest: "<%= buildDir %>/lib/",
        src: [ "d3.slider/*.{js,css}" ],
        cwd: "lib"
      }
    },
    "string-replace": {
      index: {
        files: {
          "<%= buildDir %>/": "<%= buildDir %>/index.html"
        }
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
        src: [ "<%= srcDir %>/*.js", "<%= buildDir %>/ts/*.js" ],
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
    ts: {
      gravi: {
        src: "<%= srcDir %>/*.ts",
        dest: "<%= buildDir %>/ts",
        options: {
          target: "es6",
          additionalFlags: "--strictNullChecks",
          inlineSourceMap: true,
          inlineSources: true,
          rootDir: "<%= srcDir %>"
        }
      }
    },
    tslint: {
      gravi: {
        options: {
          configuration: "<%= srcDir %>/tslint.json"
        },
        src: [ "<%= srcDir %>/*.ts", "!<%= srcDir %>/*.d.ts" ]
      }
    },
    eslint: {
      test: {
        src: ["spec/*.js"]
      }
    },
    connect: {
      options: {
        port: 8000,
        base: "<%= buildDir %>",
        livereload: true,
        middleware: function(connect, options, middlewares) {
          const cgi = require("cgi");
          middlewares.unshift(cgi("./treewidth/treewidth", { mountPoint: "/treewidth" }));
          return middlewares;
        }
      },
      gravi: {}
    }
  });

  grunt.loadNpmTasks('grunt-bower-task');
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-requirejs");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-contrib-less");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-connect");
  grunt.loadNpmTasks("gruntify-eslint");
  grunt.loadNpmTasks("grunt-postcss");
  grunt.loadNpmTasks("grunt-shell");
  grunt.loadNpmTasks('grunt-string-replace');
  grunt.loadNpmTasks("grunt-karma");
  grunt.loadNpmTasks("grunt-babel");
  grunt.loadNpmTasks("grunt-ts");
  grunt.loadNpmTasks("grunt-tslint");

  // Read the current git version and use it as a GET parameter in
  // requirejs to circumvent overaggressive caching.
  grunt.registerTask('replace-nocache-token', function() {
    var done = this.async();

    grunt.util.spawn({
      cmd : "git",
      args : [ "describe", "--tags", "--always", "--long" ]
    }, function(err, result) {
      if(err) {
        grunt.log.error(err);
        return done(false);
      }
      grunt.config("string-replace.index.options", {
        replacements: [{pattern: '{% NOCACHE_TOKEN %}', replacement: result}]
      });
      grunt.task.run('string-replace');
      return done(result);
    });
  });

  grunt.registerTask("compile", [ "ts:gravi", "babel:gravi", "tslint:gravi" ]);
  grunt.registerTask("build-site", [ "less", "postcss", "bower", "copy", "replace-nocache-token" ]);
  grunt.registerTask("build", [ "compile", "build-site" ]);
  grunt.registerTask("minify", [ "compile", "requirejs:gravi" ]);

  grunt.registerTask("doc", [ "shell:doc"]);

  grunt.registerTask("test", [ "babel:test", "karma:single-test", "eslint:test" ]);

  grunt.registerTask("default", [ "build", "doc", "test" ]);
  grunt.registerTask("serve", ["connect", "watch"]);
};
