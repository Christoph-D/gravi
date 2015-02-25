module.exports = (grunt) ->
  grunt.initConfig
    pkg: grunt.file.readJSON('package.json')
    banner: """/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - 
      '<%= grunt.template.today("yyyy-mm-dd") %>
      '<%= pkg.homepage ? "* " + pkg.homepage + "\\n" : "" %>\
       '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;
      ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */
      """

    coffee:
      options:
        bare: true
        sourceMap: true
      gralog:
        expand: true,
        flatten: true,
        src: 'coffee/*.coffee',
        dest: 'js',
        ext: '.js'
      tests:
        expand: true,
        flatten: true,
        src: 'spec/*.coffee',
        dest: 'jasmine/spec',
        ext: '.js'
      viewer:
        src: 'viewer.coffee',
        dest: 'js/viewer.js'

    concat:
      tests:
        src: 'jasmine/spec/*.js'
        dest: 'jasmine/spec/gralog.js'

    requirejs:
      compile:
        options:
          baseUrl: "js"
          name: "viewer"
          out: "js/viewer.min.js"
          optimize: "uglify2"

    watch:
      gralog:
        files: 'coffee/*.coffee',
        tasks: ['coffee:gralog']
      viewer:
        files: 'viewer.coffee',
        tasks: ['coffee:viewer']
      tests:
        files: [ 'coffee/*.coffee', 'spec/*.coffee' ],
        tasks: ['coffee:tests']

  grunt.loadNpmTasks('grunt-contrib-coffee');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.registerTask('gralog', ['coffee:gralog', 'coffee:viewer', 'requirejs']);
  grunt.registerTask('tests', ['coffee:tests', 'concat:tests']);
