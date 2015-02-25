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
        src: 'coffee/*.coffee'
        dest: 'js'
        ext: '.js'
      tests:
        expand: true,
        flatten: true,
        src: 'spec/*.coffee'
        dest: 'jasmine/spec'
        ext: '.js'
      viewer:
        src: 'viewer.coffee'
        dest: 'js/viewer.js'
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
        files: [ 'coffee/*.coffee', 'spec/*.coffee' ]
        tasks: ['tests']
    "file-creator":
      options:
        openFlags: 'w'
      tests:
        "jasmine/speclist.js": (fs, fd, done) ->
          glob = grunt.file.glob;
          _ = grunt.util._;
          glob 'jasmine/spec/*.js', (err, files) ->
            files = ("\"#{f.replace(/^jasmine\/(.*)\.js/, '$1')}\"" for f in files)
            fs.writeSync(fd, "define(function(){return [\n  ")
            fs.writeSync(fd, files.join(",\n  "))
            fs.writeSync(fd, "\n];});")
            done()

  grunt.loadNpmTasks('grunt-contrib-coffee')
  grunt.loadNpmTasks('grunt-contrib-watch')
  grunt.loadNpmTasks('grunt-contrib-requirejs')
  grunt.loadNpmTasks('grunt-file-creator')

  grunt.registerTask('gralog', ['coffee:gralog', 'coffee:viewer', 'requirejs'])
  grunt.registerTask('tests', ['coffee:tests', 'file-creator:tests'])
