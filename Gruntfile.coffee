module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')

    buildDir: 'build'
    siteDir: 'site'
    srcDir: 'src'

    # Add AMD wrapper.
    wrap:
      gralog:
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
      gralog:
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
      gralog:
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
      gralog:
        files: [ '<%= srcDir %>/*.coffee', '<%= siteDir %>/*' ],
        tasks: [ 'compile', 'shell:test' ]
      test:
        files: [ 'spec/*.coffee' ]
        tasks: [ 'test' ]
      doc:
        files: 'doc/*.txt'
        tasks: [ 'doc' ]
    autoprefixer:
      gralog:
        src: "<%= buildDir %>/graphs.css"
        dest: "<%= buildDir %>/graphs.css"
    less:
      gralog:
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
        src: [ 'require.js', 'd3/d3.min.js', 'd3.slider/*.{js,css}' ]
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
        command: 'asciidoctor --destination-dir=\'<%= buildDir %>/doc\' doc/\*.txt'

  grunt.loadNpmTasks('grunt-contrib-coffee')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-requirejs')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-less')
  grunt.loadNpmTasks('grunt-contrib-copy')
  grunt.loadNpmTasks('grunt-wrap')
  grunt.loadNpmTasks('grunt-autoprefixer')
  grunt.loadNpmTasks('grunt-shell')

  grunt.registerTask('compile', [ 'wrap:gralog', 'coffee:gralog' ])
  grunt.registerTask('build', [ 'compile', 'less', 'autoprefixer', 'copy' ])
  grunt.registerTask('minify', [ 'compile', 'requirejs:gralog' ])

  grunt.registerTask('doc', [ 'shell:doc'])

  grunt.registerTask('test', [ 'coffee:test', 'shell:test' ])

  grunt.registerTask('default', [ 'build', 'doc', 'test' ])
