//
// Copyright 2017 Alien Labs.
//

const _ = require('lodash');
const defaults = require('../../tools/grunt/defaults');

/**
 * Grunt config.
 */
module.exports = (grunt) => {

  defaults.init(grunt);

  grunt.config.init(_.assign(defaults.config(grunt), {
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
          'src/meta.js'
        ]
      }
    }
  }));

  // Hoisted modules.
  let cwd = process.cwd();
  process.chdir('../../');

  // https://www.npmjs.com/package/grunt-version
  grunt.loadNpmTasks('grunt-version');

  process.chdir(cwd);

  //
  // Tasks
  //

  grunt.registerTask('bump', ['version:app:patch']);
};
