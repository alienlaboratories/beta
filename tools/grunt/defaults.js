//
// Copyright 2017 Alien Labs.
//

/**
 * Standard Grunt config for all modules.
 *
 * const _ = require('./node_modules/lodash/lodash');
 * const defaults = require('../tools/src/grunt/defaults');
 * grunt.config.init(_.assign(defaults.config(grunt), {}));
 */
function config(grunt) {
  return {
    pkg: grunt.file.readJSON('package.json'),
  };
}

/**
 * @param grunt
 */
function init(grunt) {}

module.exports = { config, init };
