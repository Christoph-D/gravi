const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const outputDir = './dist';

module.exports = {
  entry: './src/viewer.ts',
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: { presets: [ 'env' ]}
          }
        ],
        exclude: /node_modules/
      },
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
            options: { presets: [ 'env' ]}
          },
          'ts-loader'
        ],
        exclude: /node_modules/
      },
      {
        test: /\.less$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 2 } },
          'postcss-loader',
          'less-loader'
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          'postcss-loader'
        ]
      }
    ]
  },
  devServer: {
    contentBase: outputDir
  },
  resolve: {
    extensions: [ '.ts', '.js' ],
    alias: {
      "assets": path.resolve(__dirname, 'assets'),
      "d3.slider": path.resolve(__dirname, 'lib/d3.slider/d3.slider.js'),
      "gravi": path.resolve(__dirname, 'src')
    }
  },
  output: {
    filename: 'gravi.js'
  },
  plugins: [
    new CleanWebpackPlugin([outputDir]),
    new HtmlWebpackPlugin({
      title: 'Gravi',
      template: 'assets/index.html',
      hash: true
    })
  ]
};
