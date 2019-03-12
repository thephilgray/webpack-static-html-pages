const path = require('path');
const fs = require('fs-extra');
const HtmlWebpackPlugin = require('html-webpack-plugin');

class DevelopmentSettings {
  constructor(options = {}) {
    this.SRC_DIRECTORY = 'src';
    this.PAGES_DIRECTORY = 'pages';
    this.SRC_PATH = path.resolve(__dirname, this.SRC_DIRECTORY);
    this.PAGES_PATH = path.resolve(this.SRC_PATH, this.PAGES_DIRECTORY);
    this.pages = [];
    this.entry = {};
    this.HtmlWebpackPluginSettings = [];
    Object.assign(this, options);
    this.init();
  }

  init() {
    this.pages = fs.readdirSync(this.PAGES_PATH);
    this.entry = this.pages.reduce((acc, page) => {
      acc[
        path
          .basename(page)
          .split('.')
          .shift()
      ] = `./${path.relative(__dirname, path.join(this.PAGES_PATH, page))}/index.js`;
      return acc;
    }, {});
    this.HtmlWebpackPluginSettings = Object.keys(this.entry).map(page => ({
      filename: `${page}.html`,
      template: fs.pathExistsSync(`${path.dirname(this.entry[page])}/tmpl.pug`)
        ? `${path.dirname(this.entry[page])}/tmpl.pug`
        : path.resolve(process.cwd(), 'src/templates/layout.pug'),
      chunks: [page],
      inject: 'body'
    }));
  }
}

const settings = new DevelopmentSettings();

module.exports = () => ({
  // This option controls if and how source maps are generated.
  // https://webpack.js.org/configuration/devtool/
  devtool: 'eval-cheap-module-source-map',

  // https://webpack.js.org/concepts/entry-points/#multi-page-application
  entry: {
    ...settings.entry
  },

  // https://webpack.js.org/configuration/dev-server/
  devServer: {
    port: 8080
  },

  // https://webpack.js.org/concepts/loaders/
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      },
      {
        test: /\.pug$/,
        use: ['html-loader?attrs=false', 'pug-html-loader']
      },
      {
        test: /\.s?css$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
          // Please note we are not running postcss here
        ]
      },
      {
        // Load all images as base64 encoding if they are smaller than 8192 bytes
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              // On development we want to see where the file is coming from, hence we preserve the [path]
              name: '[path][name].[ext]?hash=[hash:20]',
              limit: 8192
            }
          }
        ]
      }
    ]
  },
  // https://webpack.js.org/concepts/plugins/
  plugins: [
    ...settings.HtmlWebpackPluginSettings.map(pageSettings => new HtmlWebpackPlugin(pageSettings))
  ]
});
