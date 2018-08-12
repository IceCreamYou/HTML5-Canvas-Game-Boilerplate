module.exports = function(grunt) {
  var banner = '/**\n' +
               ' * HTML5 Canvas Game Boilerplate <%= pkg.version %>-<%= grunt.template.today("ddmmyyyy") %>\n' +
               ' * Certain components copyright their respective authors.\n' +
               ' *\n' +
               ' * @author <%= pkg.author %>\n' +
               ' * @license <%= pkg.license %> License\n' +
               ' * @ignore\n' +
               ' */\n';
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        banner: banner + "\n",
        separator: grunt.util.linefeed
      },
      target: {
        src: [
              'js/libraries/jquery.hotkeys.js',
              'js/libraries/classes.js',
              'js/libraries/sprite.js',
              'js/boilerplate/core.js',
              'js/boilerplate/drawing.js',
              'js/boilerplate/mouse.js',
              'js/boilerplate/events.js',
              'js/boilerplate/storage.js',
              'js/boilerplate/collections.js',
              'js/boilerplate/actors.js'
              ],
        dest: 'js/combined.js',
        nonull: true
      }
    },
    uglify: {
      options: {
        banner: banner,
        sourceMap: 'js/combined.min.map',
        compress: {
          side_effects: false,
          unused: false
        },
        mangle: true,
        report: 'min'
      },
      target: {
        src: ['js/combined.js'],
        dest: 'js/combined.min.js'
      }
    },
    jsduck: {
      main: {
        src: [
              'js/app',
              'js/boilerplate',
              'js/libraries'
              ],
        dest: 'docs',
        options: {
          external: ['Image', 'Event', 'CanvasPattern'],
          footer: '<span style="float: left; padding-left: 1em;"><a href="https://github.com/IceCreamYou/HTML5-Canvas-Game-Boilerplate">Fork this project on Github</a></span><span>By <a href="http://www.isaacsukin.com/">Isaac Sukin</a> (<a href="https://github.com/IceCreamYou">IceCreamYou</a>)</span>',
          guides: 'guides/guides.json',
          'local-storage-db': 'jsduckh5gb',
          title: 'HTML5 Canvas Boilerplate Documentation',
          warnings: ['-global']
        }
      }
    },
    jshint: {
      options: {
        trailing: true
      },
      target: {
        src : [
               'js/app/*.js',
               'js/boilerplate/*.js',
               'examples/*.js'
               ]
      }
    },
    jscs: {
      options: {
        config: '.jscs.json',
      },
      main: [
             'js/app/*.js',
             'js/boilerplate/*.js',
             'examples/*.js'
             ]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-jsduck');
  grunt.loadNpmTasks("grunt-jscs");
  grunt.registerTask('default', ['concat', 'uglify', 'jshint', 'jscs', 'jsduck']);
};