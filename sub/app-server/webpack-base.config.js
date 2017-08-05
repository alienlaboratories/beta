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

    extensions: ['.js'],

    // Resolve imports/requires.
    // NOTE: Webpack node checks ancestor directories, so hoisted modules (via lerna) are discovered.
    // https://webpack.js.org/configuration/resolve/#resolve-modules
    // https://webpack.js.org/concepts/module-resolution/#resolving-rules-in-webpack
    modules: [
      'node_modules'
    ],

    alias: {
      // Prevent multiple copies (from npm link). (NOTE: lerna hoisting resolves this issue).
      // https://facebook.github.io/react/warnings/refs-must-have-owner.html#multiple-copies-of-react
      // http://stackoverflow.com/questions/31169760/how-to-avoid-react-loading-twice-with-webpack-when-developing
      // 'react'                      : path.resolve('./node_modules/react'),

      // NOTE: Assumes yarn workspaces (hoist packages to root).
      // http://stackoverflow.com/questions/40053344/npm-multiple-entry-points
      'alien-client/crx'              : path.resolve('../../node_modules/alien-client/src/crx'),
      'alien-client/graphiql'         : path.resolve('../../node_modules/alien-client/src/graphiql/graphiql'),
      'alien-client/web-app'          : path.resolve('../../node_modules/alien-client/src/web/app'),
      'alien-client/web-test-apollo'  : path.resolve('../../node_modules/alien-client/src/web/testing/apollo/apollo.js'),
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

      // Allow direct imports of .graphql files.
      // http://dev.apollodata.com/react/webpack.html
      // https://github.com/apollostack/graphql-tag#webpack-preprocessing
      {
        test: /\.(graphql|gql)$/,
        exclude: /node_modules/,
        use: {
          loader: 'graphql-tag/loader'
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
          path.resolve(__dirname, '../client/src'),
          path.resolve(__dirname, '../core/src'),
          path.resolve(__dirname, '../scheduler/src'),
          path.resolve(__dirname, '../services/src'),
          path.resolve(__dirname, '../util/src')
        ],
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: './dist/babel-cache/'
          }
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

    // TODO(burdon): Remove; make explicit.
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

    // TODO(burdon): Use generated package file? (patch to specify file).
    // https://github.com/liady/webpack-node-externals/blob/82e7240d2df87f7e26dba5c693958924a489cf32/index.js
    modulesFromFile: true,

    whitelist: [
      'alien-api',
      'alien-api/server',
      'alien-client',
      'alien-core',
      'alien-core/src/testing',
      'alien-services',
      'alien-util',
      'alien-worker'
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

  // NOTE: entries cannot be compiled individually (requires separate config).
  entry: {

    // Main app.
    web: [
      'babel-polyfill',
      path.resolve(baseConfig.context, 'src/client/web_app.js')
    ],

    // Main app with HMR.
    // web_hot: [
    //   'babel-polyfill',
    //
    //   // BABEL_NODE=hot NODE_ENV=hot
    //   'webpack/hot/dev-server',
    //   'webpack-hot-middleware/client'
    //
    //   path.resolve(baseConfig.context, 'src/client/web_app.js'),
    // ],

    // Main app.
    test_app: [
      'babel-polyfill',
      path.resolve(baseConfig.context, 'src/client/test_app.js')
    ],

    // Test HMR.
    test_hot: [
      'babel-polyfill',

      // BABEL_NODE=hot NODE_ENV=hot
      'webpack/hot/dev-server',
      'webpack-hot-middleware/client',

      path.resolve(baseConfig.context, 'src/client/test_hot.js'),
    ],

    // Test end-to-end Apollo stack.
    test_apollo: [
      'babel-polyfill',
      path.resolve(baseConfig.context, 'src/client/test_apollo.js')
    ],

    // Test CRX sidebar.
    test_sidebar: [
      'babel-polyfill',
      path.resolve(baseConfig.context, 'src/client/test_sidebar.js')
    ],

    // GraphiQL test console.
    graphiql: [
      path.resolve(baseConfig.context, 'src/client/graphiql.js')
    ],

    // Web site (incl. CSS)
    site: [
      path.resolve(baseConfig.context, 'src/client/site.js')
    ],
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
