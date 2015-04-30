module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    banner: """/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - 
      '<%= grunt.template.today("yyyy-mm-dd") %>
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>\
       '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */
      """
    # Add AMD wrapper.
    wrap:
      gralog:
        expand: true,
        flatten: true,
        src: ['coffee/*.coffee'],
        dest: 'js',
        options:
          wrapper: ['`define(function (require, exports, module) {`\n', '\n`})`\n']
    # Compile coffeescript.
    coffee:
      options:
        bare: true
        sourceMap: true
      gralog:
        expand: true,
        flatten: true,
        src: 'js/*.coffee'
        dest: 'js'
        ext: '.js'
      tests:
        expand: true,
        flatten: true,
        src: 'spec/*.coffee'
        dest: 'specjs'
        ext: '.js'
    requirejs:
      gralog:
        options:
          baseUrl: "js"
          name: "viewer"
          out: "js/viewer.min.js"
          optimize: "uglify2"
          uglify2:
            output:
              semicolons: false
    watch:
      options:
        atBegin: true
      gralog:
        files: [ 'coffee/*.coffee', 'graphs.less' ],
        tasks: ['gralog']
      tests:
        files: [ 'coffee/*.coffee', 'spec/*.coffee' ]
        tasks: ['tests']
    autoprefixer:
      gralog:
        src: "graphs.css"
        dest: "graphs.css"
    less:
      gralog:
        src: "graphs.less"
        dest: "graphs.css"
    clean:
      gralog: [ "js/*.{coffee,js,js.map}", "graphs.css" ]
      tests: [ "specjs/*.js", "specjs/*.js.map" ]
    shell:
      tests:
        command: './node_modules/jasmine-node/bin/jasmine-node --color --matchall --coffee --captureExceptions --runWithRequireJs --requireJsSetup spec/config.coffee spec'

  grunt.loadNpmTasks('grunt-contrib-coffee')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-requirejs')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-wrap')
  grunt.loadNpmTasks('grunt-autoprefixer')
  grunt.loadNpmTasks('grunt-shell')

  grunt.registerTask('gralog', ['wrap:gralog', 'coffee:gralog', 'less', 'autoprefixer', 'requirejs:gralog'])
  grunt.registerTask('tests', ['coffee:tests', 'shell:tests'])
  grunt.registerTask('default', ['gralog', 'tests'])
