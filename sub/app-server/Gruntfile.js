//
// Copyright 2017 Alien Labs.
//

const _ = require('./node_modules/lodash/lodash');
const defaults = require('../../tools/grunt/defaults');

/**
 * Grunt config.
 */
module.exports = (grunt) => {

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
        // Matches ["version": "0.0.1"] and [__version__ = '0.0.1']
        prefix: '[^\\-]((version)|(VERSION))[\'"]?[_\\s]*[:=]\\s*[\'"]'
      },
      app: {
        options: {
          release: 'patch'
        },
        src: [
          'package.json',
          'src/server/meta.js'
        ]
      }
    },
  }));

  // https://github.com/gruntjs/grunt-contrib-clean
  grunt.loadNpmTasks('grunt-contrib-clean');

  // https://www.npmjs.com/package/grunt-version
  grunt.loadNpmTasks('grunt-version');

  //
  // Tasks
  //
};
