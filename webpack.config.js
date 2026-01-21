const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/index.ts',

  output: {
    path: path.resolve(__dirname, 'public'),
    filename: '[name].bundle.js',
    clean: true, // automatically cleans the output folder before each build
  },

  plugins: [
    // html template for index
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html', // output filename
    }),

    // extract and save compiled CSS
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
  ],

  module: {
    rules: [
      { // HTML files
        test: /\.html$/i,
        loader: 'html-loader',
        options: {
          sources: {
            list: [
              '...', // keep default processing
            ],
          },
        },
      },
      { // SCSS files
        test: /\.scss$/, // match SCSS files
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader', // resolve CSS imports
          'sass-loader', // compile SCSS into CSS
        ],
      },
      { // TS files
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      { // image files in assets/
        test: /\.(png|jpe?g|gif|svg|webp|avif|ico)$/i,
        type: 'asset/resource',
        generator: {
          // outputs to: public/assets/<original path under src/assets>/filename.ext
          filename: (pathData) => {
            // pathData.filename is the original resource path relative to context
            const rel = pathData.filename
              .replace(/^src[\\/]/, '')       // -> "assets/icons/logo.png"
              .replace(/\\/g, '/');           // normalize windows slashes
            return rel;                        // -> emitted to "public/assets/icons/logo.png"
          },
        },
      },
    ],
  },

  resolve: {
    extensions: ['.ts', '.js'], // resolve these file extensions for imports
  },

  // webpack dev server config
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'), // serve files from public
    },
    port: 5000, // use port 5000
    open: true, // automatically open browser
  },

  devtool: 'eval-source-map', // faster rebuilds in development
};