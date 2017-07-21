//
// Copyright 2017 Alien Labs.
//

const _ = require('lodash/lodash');
const defaults = require('../../tools/grunt/defaults');

/**
 * Grunt config.
 */
module.exports = function(grunt) {

  defaults.init(grunt);

  grunt.config.init(_.assign(defaults.config(grunt), {
  }));

  //
  // Tasks
  //
};
