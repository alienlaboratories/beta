//
// Copyright 2017 Alien Labs.
//

const path = require('path');
const webpack = require('webpack');
const webpackMerge = require('webpack-merge');
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

    alias: {
      // Prevent multiple copies (from npm link).
      // https://facebook.github.io/react/warnings/refs-must-have-owner.html#multiple-copies-of-react
      // http://stackoverflow.com/questions/31169760/how-to-avoid-react-loading-twice-with-webpack-when-developing
      'react' : path.resolve('./node_modules/react')
    }
  },

  module: {

    rules: [

      // See .babelrc for the presets.
      // https://github.com/babel/babel-loader
      {
        test: /\.js$/,
        exclude: /node_modules/,    // Don't transpile deps.
        include: [
          path.resolve('src'),
          path.resolve(__dirname, '../api/src'),
          path.resolve(__dirname, '../core/src'),
          path.resolve(__dirname, '../util/src'),
        ],
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: './dist/babel-cache/'
          }
        }
      },

      // https://github.com/webpack/json-loader
      {
        test: /\.json$/,
        use: {
          loader: 'json-loader'
        }
      },

      // https://github.com/webpack/css-loader
      {
        test: /\.css$/,
        use: {
          loader: 'css-loader'
        }
      },

      // https://github.com/webpack/less-loader
      {
        test: /\.less$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: ['css-loader', 'less-loader']
        })
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

    // https://github.com/webpack/extract-text-webpack-plugin
    new ExtractTextPlugin('[name].css'),

    // https://github.com/webpack/docs/wiki/list-of-plugins#hotmodulereplacementplugin
    new webpack.HotModuleReplacementPlugin(),

    new webpack.ProvidePlugin({ _: 'lodash' }),
    new webpack.ProvidePlugin({ $: 'jquery' }),
  ]
};

//
// Web config.
//

const web = webpackMerge(baseConfig, {

  target: 'web',

  // Source map shows original source and line numbers (and works with hot loader).
  // https://webpack.github.io/docs/configuration.html#devtool
  devtool: '#source-map',

  // TODO(burdon): Split into separate configs.
  // http://localhost:8080/assets/
  entry: {

    // test_apollo: [
    //   'babel-polyfill',
    //   path.resolve(baseConfig.context, './src/web/testing/apollo/apollo_test_app.js'),
    // ],

    test_d3: [
      'babel-polyfill',
      path.resolve(baseConfig.context, './src/web/testing/d3/test_d3.js'),
    ],

    test_gallery: [
      'babel-polyfill',
      path.resolve(baseConfig.context, './src/web/testing/gallery/gallery.js'),
    ],

    test_layout: [
      'babel-polyfill',
      path.resolve(baseConfig.context, './src/web/testing/layout/test_layout.js'),
    ],

    test_router: [
      'babel-polyfill',
      path.resolve(baseConfig.context, './src/web/testing/router/test_router.js'),
    ],
  },

  output: {
    path: path.resolve(baseConfig.context, './dist'),
    filename: '[name].bundle.js',
    publicPath: '/assets/' // Path for webpack-dev-server
  }
});

//
// CRX config.
//

const crx = webpackMerge(baseConfig, {

  target: 'web',

  // Cuts build time to 50%.
  devtool: 'eval',

  entry: {

    background: [
      'babel-polyfill',
      path.resolve(baseConfig.context, './src/crx/background.js')
    ],

    content_script: [
      'babel-polyfill',
      path.resolve(baseConfig.context, './src/crx/content_script.js')
    ],

    browser_action: [
      'babel-polyfill',
      path.resolve(baseConfig.context, './src/crx/browser_action.js')
    ],

    sidebar: [
      'babel-polyfill',
      path.resolve(baseConfig.context, './src/crx/sidebar.js')
    ],

    options: [
      'babel-polyfill',
      path.resolve(baseConfig.context, './src/crx/options.js')
    ]
  },

  output: {
    path: path.resolve(baseConfig.context, './dist/crx/robotik/assets'),
    filename: '[name].bundle.js'
  }
});

module.exports = {
  web,
  crx
};
