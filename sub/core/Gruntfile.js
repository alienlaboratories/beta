//
// Copyright 2016 Minder Labs.
//

const _ = require('./node_modules/lodash/lodash');
const defaults = require('../../tools/grunt/defaults');

/**
 * Grunt config.
 */
module.exports = (grunt) => {

  defaults.init(grunt);

  grunt.config.init(_.assign(defaults.config(grunt), {
  }));

  //
  // Tasks
  //
};
