const serverModules = {
  loaders: [
    {
      test: /\.js$/,
      exclude: /node_modules/,
      loader: 'babel-loader',
      query: {
          // https://github.com/babel/babel-loader#options
        presets: ['stage-2', 'es2015'],
        plugins: ['transform-class-properties', 'transform-decorators-legacy', 'add-module-exports', 'transform-runtime'],
      },
    },
    {
      test: /\.json/,
      loader: 'json-loader',
    },
  ],
};
// entry point doesn't vary by build
const entry = './server/app.js';

// ===========================================================================
// debug builds a source map decorated, non minified version of the extension
// ===========================================================================
const debug = {
  entry,
  target: 'node',
  node: {
    '__dirname': true,
  },
  output: {
    filename: './server-build.js',
    libraryTarget: 'commonjs2',
  },
  devtool: 'inline-source-map',
  module: serverModules,
};

// ===========================================================================
// release builds a minified version of the extension
// ===========================================================================
const release = {
  entry,
  target: 'node',
  node: {
    '__dirname': true,
  },
  output: {
    filename: './server-build.js',
    libraryTarget: 'commonjs2',
  },
  module: serverModules,
};

// ===========================================================================
// dev is a modified version of the debug build that puts the output directly in the app.
// Change the filename to put to your dev file.
// ===========================================================================
const dev = {
  entry,
  target: 'node',
  node: {
    '__dirname': true,
  },
  output: {
    filename: './server-build.js',
    libraryTarget: 'commonjs2',
  },
  module: serverModules,
  devtool: 'inline-source-map',
};

// get target from npm command used to start the build
const TARGET = process.env.npm_lifecycle_event;

// now build the required target ( for debug and/or watch mode )
if (TARGET === 'debug-server') {
  module.exports = debug;
}

if (TARGET === 'release-server') {
  module.exports = release;
}

if (TARGET === 'watch-server') {
  module.exports = dev;
}
