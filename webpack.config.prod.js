var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: [
    './src/index'
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
  module: {
    loaders: [
      { test: /\.jsx?$/, exclude: /node_modules/, loaders: ['react-hot', 'babel']},
      { test: /\.scss$/, loaders: [
          'style',
          'css?modules&importLoaders=2&sourceMap&localIdentName=[local]___[hash:base64:5]',
          'autoprefixer?browsers=last 2 version',
          'sass?outputStyle=expanded&sourceMap'
      ] },
      { test: /(\.jpg|\.png)$/, loader: 'url?limit=10000' }
    ]
  }
};
