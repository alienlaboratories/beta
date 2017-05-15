//
// Copyright 2017 Alien Labs.
//

const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');

//
// Webpack base configuration.
//

const baseConfig = {

  context: __dirname,

  devtool: 'inline-source-map',

  resolve: {

    // Where to resolve imports/requires.
    modules: [
      'node_modules'
    ],

    extensions: ['.js'],
  },

  module: {

    rules: [

      // https://github.com/webpack/json-loader
      {
        test: /\.json$/,
        use: [{
          loader: 'json-loader'
        }]
      },

      // See .babelrc for the presets.
      // https://github.com/babel/babel-loader
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,    // Don't transpile deps.
        include: [
          path.resolve('src'),
          path.resolve('../util'),
        ],
        options: {
          cacheDirectory: './dist/babel-cache/'
        }
      },
    ]
  },

  plugins: [

    new webpack.ProvidePlugin({ _: 'lodash' })
  ]
};

//
// Test config.
//

const test = webpackMerge(baseConfig, {

  target: 'web',

  entry: {
    main: [
      path.resolve(baseConfig.context, 'index.js')
    ]
  },

  output: {
    path: path.join(baseConfig.context, 'dist'),
    filename: '[name].bundle.js'
  }
});

//
// Multiple targets.
// https://webpack.js.org/concepts/targets/#multiple-targets
//

module.exports = [
  test
];
