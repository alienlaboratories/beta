//
// Copyright 2017 Alien Labs.
//

const path = require('path');
const webpackMerge = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');

//
// Webpack base configuration.
//

const baseConfig = {

  context: __dirname,

  resolve: {

    // Where to resolve imports/requires.
    modules: [
      'node_modules'
    ],

    extensions: ['.js']
  },

  module: {

    rules: [

      // https://github.com/webpack/json-loader
      {
        test: /\.json$/,
        use: {
          loader: 'json-loader'
        }
      },

      // https://www.npmjs.com/package/yaml-loader
      {
        test: /\.yml$/,
        use: {
          loader: 'yaml-loader'
        }
      },

      // See .babelrc for the presets.
      // https://github.com/babel/babel-loader
      {
        test: /\.js$/,
        exclude: /node_modules/,    // Don't transpile deps.
        include: [
          path.resolve('src'),
          path.resolve(__dirname, '../api/src'),
          path.resolve(__dirname, '../core/src'),
          path.resolve(__dirname, '../services/src'),
          path.resolve(__dirname, '../util/src')
        ],
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: './dist/babel-cache/'
          }
        }
      }
    ]
  }
};

//
// Server config.
//

const srvConfig = webpackMerge(baseConfig, {

  target: 'node',

  entry: {
    worker: [
      'babel-polyfill',
      path.resolve(baseConfig.context, 'src/worker.js')
    ]
  },

  output: {
    path: path.resolve(baseConfig.context, 'dist'),
    filename: '[name].bundle.js'
  },

  // https://www.npmjs.com/package/webpack-node-externals
  externals: [nodeExternals({

    modulesFromFile: true,

    whitelist: [
      'alien-api',
      'alien-core',
      'alien-core/src/testing',
      'alien-services',
      'alien-util',
    ]}
  )]
});

//
// Multiple targets.
// https://webpack.js.org/concepts/targets/#multiple-targets
//

module.exports = {
  main: srvConfig
};
