module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')

    buildDir: 'build'
    siteDir: 'site'
    srcDir: 'src'

    # Add AMD wrapper.
    wrap:
      gravi:
        expand: true,
        flatten: true,
        src: '<%= srcDir %>/*.coffee',
        dest: '<%= buildDir %>/js',
        options:
          wrapper: ['`define(function (require, exports, module) {`\n', '\n`})`\n']
    # Compile coffeescript.
    coffee:
      options:
        bare: true
        sourceMap: true
      gravi:
        expand: true,
        flatten: true,
        src: '<%= buildDir %>/js/*.coffee'
        dest: '<%= buildDir %>/js'
        ext: '.js'
      test:
        expand: true,
        flatten: true,
        src: 'spec/*.coffee'
        dest: '<%= buildDir %>/specjs'
        ext: '.js'
    requirejs:
      gravi:
        options:
          baseUrl: "<%= buildDir %>/js"
          name: "viewer"
          out: "<%= buildDir %>/js/viewer.min.js"
          optimize: "uglify2"
          uglify2:
            output:
              semicolons: false
    watch:
      options:
        atBegin: true
      gravi:
        files: [ '<%= srcDir %>/*.coffee' ],
        tasks: [ 'compile', 'shell:test' ]
      site:
        files: [ '<%= siteDir %>/*' ],
        tasks: [ 'build-site' ]
      test:
        files: [ 'spec/*.coffee' ]
        tasks: [ 'test' ]
      doc:
        files: 'doc/*.adoc'
        tasks: [ 'doc' ]
    autoprefixer:
      gravi:
        src: "<%= buildDir %>/graphs.css"
        dest: "<%= buildDir %>/graphs.css"
    less:
      gravi:
        src: "<%= siteDir %>/graphs.less"
        dest: "<%= buildDir %>/graphs.css"
    copy:
      index:
        expand: true
        dest: '<%= buildDir %>/'
        src: 'index.html'
        cwd: '<%= siteDir %>'
      lib:
        expand: true
        dest: '<%= buildDir %>/'
        src: [ 'require.js', 'd3/d3.min.js', 'd3.slider/*.{js,css}', 'jquery-2.*.min.js', 'jquery-ui/**/*' ]
        cwd: 'lib'
    clean:
      all: [ "<%= buildDir %>/**/*" ]
    shell:
      test:
        command: '../../node_modules/jasmine-node/bin/jasmine-node --color --matchall --captureExceptions --runWithRequireJs --requireJsSetup config.js .'
        options:
          execOptions:
            cwd: '<%= buildDir %>/specjs'
      doc:
        command: 'asciidoctor --destination-dir=\'<%= buildDir %>/doc\' doc/\*.adoc || true'

  grunt.loadNpmTasks('grunt-contrib-coffee')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-requirejs')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-wrap')
  grunt.loadNpmTasks('grunt-autoprefixer')
  grunt.loadNpmTasks('grunt-shell')

  grunt.registerTask('compile', [ 'wrap:gravi', 'coffee:gravi' ])
  grunt.registerTask('build-site', [ 'less', 'autoprefixer', 'copy' ])
  grunt.registerTask('build', [ 'compile', 'build-site' ])
  grunt.registerTask('minify', [ 'compile', 'requirejs:gravi' ])

  grunt.registerTask('doc', [ 'shell:doc'])

  grunt.registerTask('test', [ 'coffee:test', 'shell:test' ])

  grunt.registerTask('default', [ 'build', 'doc', 'test' ])
