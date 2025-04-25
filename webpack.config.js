const path = require('path');

module.exports = {
  target: 'node',
  // devtool: 'inline-source-map',
  mode: 'production',
  // entry: {
  //   main: './src/index.ts',
  // },

  output: {
    path: path.join(__dirname, '/build'),
    filename: 'bundle.js',
    chunkFilename: '[name].chunk.js',
  },
  resolve: {
    extensions: ['.ts', '.js'] //resolve all the modules other than index.ts
  },
  module: {
    rules: [
      {
        use: 'ts-loader',
        test: /\.ts?$/,
        exclude: /node_modules/,
      }
    ]
  },
};
