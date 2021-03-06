/** @typedef { import('webpack').Configuration } WebpackConfiguration */

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const Dotenv = require('dotenv-webpack');

/** @type { WebpackConfiguration } */
module.exports = {
  entry: {
    app: './src/main.ts',
    preload: './src/preload/index.ts'
  },
  target: 'node',
  plugins: [new CleanWebpackPlugin(), new VueLoaderPlugin(), new CopyPlugin({ patterns: [{ from: 'public' }, { from: 'README.md' }] }), new Dotenv({ systemvars: true })],
  resolve: {
    extensions: ['.js', '.ts', '.json'],
    alias: { '@': path.join(__dirname, 'src') }
  },
  module: {
    rules: [
      {
        test: /\.js$/, //正则匹配.js后缀文件,使用babel-loader进行解析
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: ['babel-loader', { loader: 'ts-loader', options: { appendTsSuffixTo: [/\.vue$/] } }]
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'style-loader', 'css-loader']
      },
      {
        test: /\.(jpg|png|svg|gif)$/,
        use: ['file-loader']
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: ['file-loader']
      },
      {
        test: /\.vue$/,
        use: [{ loader: 'vue-loader', options: { optimizeSSR: false } }]
      },
      {
        test: /\.stylus$/,
        use: ['style-loader', 'css-loader', 'stylus-loader']
      }
    ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        exclude: /preload\.js/,
        terserOptions: { compress: { drop_console: process.env.DEBUG !== 'true' } }
      }),
      new TerserPlugin({
        include: /preload\.js/,
        terserOptions: {
          compress: false,
          keep_classnames: true,
          keep_fnames: true,
          mangle: false,
          format: { beautify: true, comments: 'some' }
        }
      })
    ]
  }
};
