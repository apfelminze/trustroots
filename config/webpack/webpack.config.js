const webpack = require('webpack');
const merge = require('webpack-merge');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// This is very experimental library
// There might be another favourite react-refresh webpack plugin at some point ...
// See https://github.com/facebook/react/issues/16604 for discussion
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

const { join } = require('path');

const shims = require('./webpack.shims');
const basedir = join(__dirname, '../..');

const config = require('../config');

const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

const ifDevelopment = (...items) => {
  return isDevelopment ? items : [];
};

const ifProduction = (...items) => {
  return ifProduction ? items : [];
};

const styleLoaders = [
  isProduction ? {
    loader: MiniCssExtractPlugin.loader
  } : {
    loader: 'style-loader'
  },
  {
    loader: 'css-loader',
    options: { importLoaders: 1 }
  },
  {
    loader: 'postcss-loader',
    options: {
      ident: 'postcss',
      plugins: [
        require('autoprefixer')()
      ]
    }
  }
];

module.exports = merge(shims, {
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? 'source-map' : 'cheap-module-eval-source-map',
  entry: require.resolve('./entries/main'),
  output: {
    path: join(basedir, 'public/assets'),
    publicPath: '/assets/'
  },
  devServer: {
    index: '',
    host: config.host,
    port: 3000,
    contentBase: false,
    publicPath: '/assets/',
    proxy: {
      context: () => true,
      target: 'http://localhost:3001'
    },
    // @pmmmwh/react-refresh-webpack-plugin is setting up an overlay too
    // which seems a bit cheeky for a plugin to do, but we don't want two!
    overlay: false
  },
  resolve: {
    alias: {
      '@': basedir,

      // These are (mainly) to use within less/css files
      'img': join(basedir, 'public/img'),
      'less': join(basedir, 'modules/core/client/less'),
      'modules': join(basedir, 'modules')
    }
  },
  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.js$/,
        loader: 'eslint-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                corejs: 2,
                modules: 'commonjs',
                useBuiltIns: 'usage'
              }],
              ['@babel/preset-react']
            ],
            plugins: [
              '@babel/plugin-proposal-object-rest-spread',
              'angularjs-annotate',
              ...ifDevelopment('react-refresh/babel')
            ]
          }
        }]
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: '[name].[hash:7].[ext]',
          outputPath: 'fonts/'
        }
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 10000,
              name: '[name]-[hash:7].[ext]',
              outputPath: 'images/'
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: styleLoaders
      },
      {
        test: /\.less$/,
        use: [
          ...styleLoaders,
          {
            loader: 'less-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    ...ifProduction(new MiniCssExtractPlugin({
      filename: 'main.css'
    })),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'FCM_SENDER_ID': JSON.stringify(config.fcm.senderId)
    }),
    ...ifDevelopment(new ReactRefreshWebpackPlugin({
      disableRefreshCheck: true
    }))
  ]
});