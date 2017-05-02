//
// Copyright 2016 Alien Labs.
//

const path = require('path');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

//
// Webpack base configuration.
//

const baseConfig = {

  context: __dirname,

  // https://webpack.js.org/configuration/resolve
  resolve: {

    // Resolve imports/requires.
    modules: [
      'node_modules'
    ],

    extensions: ['.js'],

    // Prevent multiple copies (from npm link).
    // https://facebook.github.io/react/warnings/refs-must-have-owner.html#multiple-copies-of-react
    // http://stackoverflow.com/questions/31169760/how-to-avoid-react-loading-twice-with-webpack-when-developing
    alias: {
      'react'                           : path.resolve('./node_modules/react'),

      // http://stackoverflow.com/questions/40053344/npm-multiple-entry-points
      'alien-client/web-app'            : path.resolve('./node_modules/alien-client/src/web/app'),
      'alien-client/web-testing-apollo' : path.resolve('./node_modules/alien-client/src/web/app/testing/apollo/apollo.js'),
    }
  },

  // https://webpack.js.org/configuration/stats/#components/sidebar/sidebar.jsx
  stats: {
    assets: true,
    modules: false,

    // Suppress ExtractTextPlugin output (for each file).
    children: false,
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

      // https://www.npmjs.com/package/yaml-loader
      {
        test: /\.yml$/,
        use: [{
          loader: 'yaml-loader'
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
          path.resolve(__dirname, '../api/src'),
          path.resolve(__dirname, '../client/src'),
          path.resolve(__dirname, '../core/src'),
          path.resolve(__dirname, '../services/src'),
          path.resolve(__dirname, '../util/src'),
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
        loader: 'graphql-tag/loader',
        exclude: /node_modules/
      },

      // https://github.com/webpack/css-loader
      {
        test: /\.css$/,
        use: [{
          loader: 'css-loader'
        }]
      },

      // https://github.com/webpack/less-loader
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'less-loader']
        })
      }
    ]
  },

  // https://github.com/webpack/docs/wiki/list-of-plugins
  plugins: [

    // Generate separate CSS files.
    // https://github.com/webpack/extract-text-webpack-plugin
    new ExtractTextPlugin('[name].css'),

    // webpackDevMiddleware imports config file.
    // https://github.com/webpack/docs/wiki/list-of-plugins#hotmodulereplacementplugin
    new webpack.HotModuleReplacementPlugin(),

    // Automatically include packages without import statement.
    new webpack.ProvidePlugin({ _: 'lodash' }),
    new webpack.ProvidePlugin({ $: 'jquery' }),
  ]
};

//
// Server config.
//

const srvConfig = webpackMerge(baseConfig, {

  target: 'node',

  // https://webpack.github.io/docs/configuration.html#node
  node: {

    // Otherwise __dirname === '/'
    __dirname: false,

    // https://webpack.js.org/configuration/node
    console: false,
    // fs:  'empty',    // TODO(burdon): ???
    net: 'empty',
    tls: 'empty'
  },

  // Source map shows original source and line numbers (and works with hot loader).
  // https://webpack.github.io/docs/configuration.html#devtool
//devtool: '#source-map',
  devtool: '#eval-source-map',

  entry: {
    server: [
      // This is automatically loaded when using babel-node, but required for runtime builds.
      // https://babeljs.io/docs/usage/polyfill
      'babel-polyfill',

      path.resolve(baseConfig.context, 'src/server/main.js')
    ]
  },

  output: {
    path: path.resolve(baseConfig.context, 'dist'),
    filename: '[name].bundle.js',
    publicPath: '/app/assets/' // Path for webpack-dev-server
  },

  // Define modules that should not be bundled.
  // https://www.npmjs.com/package/webpack-node-externals
  // https://github.com/liady/webpack-node-externals/issues/29 [richburdon]
  // NOTE: "googleapis" must be declared in this package, otherwise:
  // Error: ENOENT: no such file or directory, scandir '/app-server/apis'
  externals: [nodeExternals({

    modulesFromFile: true,

    whitelist: [
      'alien-api',
      'alien-client',
      'alien-core',
      'alien-services',
      'alien-util'
    ]}
  )]
});

//
// Web config.
//

const webConfig = webpackMerge(baseConfig, {

  target: 'web',

  // Source map shows original source and line numbers (and works with hot loader).
  // https://webpack.js.org/configuration/devtool/#components/sidebar/sidebar.jsx
  devtool: '#eval-source-map',

  // NOTE: entries cannot be compiled individually.
  entry: {
    web: [
      path.resolve(baseConfig.context, 'src/client/web_bootstrap.js')
    ],

    // TODO(burdon): Runtime server switch.
    // web_hot: [
    //   path.resolve(baseConfig.context, 'src/client/web_bootstrap.js'),
    //
    //   // BABEL_NODE=hot NODE_ENV=hot
    //   'webpack/hot/dev-server',
    //   'webpack-hot-middleware/client'
    // ],

    test_hot: [
      path.resolve(baseConfig.context, 'src/client/test_hot.js'),

      // BABEL_NODE=hot NODE_ENV=hot
      'webpack/hot/dev-server',
      'webpack-hot-middleware/client'
    ],

    test_apollo: [
      path.resolve(baseConfig.context, 'src/client/test_apollo.js')
    ],

    site: [
      path.resolve(baseConfig.context, 'src/client/site.js')
    ]
  },

  output: {
    path: path.resolve(baseConfig.context, 'dist'),
    filename: '[name].bundle.js',
    publicPath: '/app/assets/' // Path for webpack-dev-server
  }
});

//
// Multiple targets.
// https://webpack.js.org/concepts/targets/#multiple-targets
//

module.exports = {
  srv: srvConfig,
  web: webConfig
};
