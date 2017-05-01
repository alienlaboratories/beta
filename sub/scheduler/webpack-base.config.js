//
// Copyright 2017 Alien Labs.
//

const _ = require('lodash');
const path = require('path');
const webpack = require('webpack');
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

    extensions: ['.js'],

    // Prevent multiple copies.
    // https://facebook.github.io/react/warnings/refs-must-have-owner.html#multiple-copies-of-react
    // http://stackoverflow.com/questions/31169760/how-to-avoid-react-loading-twice-with-webpack-when-developing
    alias: {
      graphql: path.resolve('./node_modules/graphql')
    }
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
          path.resolve(__dirname, '../core/src'),
          path.resolve(__dirname, '../graphql/src'),
        ],
        options: {
          cacheDirectory: './dist/babel-cache/'
        }
      },

      // Allow direct imports of .graphql files.
      // http://dev.apollodata.com/react/webpack.html
      // https://github.com/apollostack/graphql-tag#webpack-preprocessing
      {
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        loader: 'graphql-tag/loader'
      }
    ]
  },

  // https://github.com/webpack/docs/wiki/list-of-plugins
  plugins: [

    new webpack.ProvidePlugin({ _: 'lodash' }),
  ]
};

//
// Server config.
//

const srvConfig = webpackMerge(baseConfig, {

  target: 'node',

  entry: {
    scheduler: [
      path.resolve(baseConfig.context, 'src/main.js')
    ]
  },

  output: {
    path: path.resolve(baseConfig.context, 'dist'),
    filename: '[name].bundle.js'
  },

  // https://www.npmjs.com/package/webpack-node-externals
  externals: [nodeExternals({
    whitelist: [
      'alien-api',
      'alien-core',
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
