# webpack

- https://webpack.github.io

## Config

- Loaders do transformations (e.g., JSX, CSS)
  - https://webpack.github.io/docs/list-of-loaders.html
  - https://webpack.github.io/docs/stylesheets.html

- If any library uses babel-polyfill, the main entry point needs to be an array including 'babel-polyfill'.
  See the [babel docs](https://babeljs.io/docs/usage/polyfill/).


## Modules

- submodules are defined via npm-workspace.
- Each module defines a default entry point via "main" in the package.json file.
- Additional webpack entry points may be defined using aliases.


## Babel

- ES6 modules must be transpiled using babel.
  - Ensure all dependent submodules are included.
  - Each submodule needs to have a .babelrc configuration.

~~~~
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
  }
~~~~
