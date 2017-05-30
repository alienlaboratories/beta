//
// Copyright 2017 Alien Labs.
//

const _ = require('./node_modules/lodash/lodash');
const defaults = require('../../tools/grunt/defaults');

/**
 * Grunt config.
 */
module.exports = (grunt) => {
  require('time-grunt')(grunt);

  defaults.init(grunt);

  grunt.config.init(_.assign(defaults.config(grunt), {

    clean: {
      all: [
        'dist'
      ]
    },

    // Version: "grunt version:app:patch" (to inc version).
    version: {
      options: {
        // Match both ["version": "0.0.1"] and [__version__ = '0.0.1']
        prefix: '[^\\-]((version)|(VERSION))[\'"]?[_\\s]*[:=]\\s*[\'"]'
      },
      app: {
        options: {
          release: 'patch'
        },
        src: [
          'package.json',
          'src/common/defs.js',
          'src/crx/manifest.yml'
        ]
      }
    },

    //
    // Chrome Extension
    //

    convert: {
      yml2json: {
        // CRX manifest.
        files: [{
          src: ['src/crx/manifest.yml'],
          dest: 'dist/crx/robotik/manifest.json'
        }]
      }
    },

    copy: {
      crx: {
        files: [
          {
            expand: true,
            cwd: 'src/crx',
            src: [
              'img/*',
              'page/*'
            ],
            dest: 'dist/crx/robotik/'
          }
        ]
      }
    },

    // Create Chrome Extension.
    // NODE thinks this module is out of date:
    // https://github.com/oncletom/grunt-crx/issues/59
    // https://developer.chrome.com/extensions/packaging
    // NOTE: pem (private key) is created by manually packing the extension from chrome (first time only).
    // TODO(burdon): set baseURL (for auto-updates).
    crx: {
      robotik: {
        options: {
          privateKey: 'src/crx/cert/robotik.pem'
        },
        src: ['dist/crx/robotik/**/*'],
        dest: 'dist/crx/robotik.crx'
      }
    },

    // Create CRX zip file (with PEM)
    // unzip -vl target/crx/nx.zip
    // To install (must be logged in with alienlaboratories.com account):
    // https://chrome.google.com/webstore/developer/dashboard
    // NOTE: Click Publish after upload After upload (up to 60 mins to update).
    compress: {
      crx: {
        options: {
          archive: 'dist/crx/robotik.zip'
        },
        files: [
          {
            expand: true,
            cwd: 'dist/crx/robotik/',
            src: ['**']
          }
        ]
      }
    },

    watch: {
      options: {
        atBegin: true
      },
      crx: {
        files: [
          'Gruntfile.js',
          'webpack*',
          'src/**',
          '../core/src/**',
          '../util/src/**'
        ],
        tasks: [ 'build-crx' ]
      }
    },

    // Webpack
    // NOTE: Use webpack --watch to automatically update all config entries.
    // https://webpack.github.io/docs/usage-with-grunt.html
    // https://github.com/webpack/webpack-with-common-libs/blob/master/Gruntfile.js
    // webpack -d --config webpack-crx.config.js --display-modules --progress
    webpack: {
      crx: require('./webpack-crx.config.js'),
    },
  }));

  // https://github.com/gruntjs/grunt-contrib-clean
  grunt.loadNpmTasks('grunt-contrib-clean');

  // https://github.com/gruntjs/grunt-contrib-compress
  grunt.loadNpmTasks('grunt-contrib-compress');

  // https://github.com/gruntjs/grunt-contrib-copy
  grunt.loadNpmTasks('grunt-contrib-copy');

  // https://github.com/gruntjs/grunt-contrib-watch
  grunt.loadNpmTasks('grunt-contrib-watch');

  // https://www.npmjs.com/package/grunt-convert
  grunt.loadNpmTasks('grunt-convert');

  // https://www.npmjs.com/package/grunt-crx
  grunt.loadNpmTasks('grunt-crx');

  // https://www.npmjs.com/package/grunt-run
  grunt.loadNpmTasks('grunt-run');

  // https://www.npmjs.com/package/grunt-version
  grunt.loadNpmTasks('grunt-version');

  // https://webpack.github.io/docs/usage-with-grunt.html
  grunt.loadNpmTasks('grunt-webpack');

  //
  // Tasks
  //

  grunt.registerTask('default',   ['build']);
  grunt.registerTask('build',     ['clean', 'webpack', 'build-crx']);
  grunt.registerTask('build-crx', ['webpack:crx', 'convert:yml2json', 'copy:crx']);
  grunt.registerTask('pack-crx',  ['build-crx', 'crx:robotik', 'compress:crx']);
};
