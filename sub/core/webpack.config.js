//
// Copyright 2017 Alien Labs.
//

const _ = require('lodash');

module.exports = _.filter(require('./webpack-base.config.js'), (conf, key) => key !== 'karma' && conf);
