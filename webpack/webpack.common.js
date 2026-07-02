const webpack = require("webpack");
const Path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { env } = require("process");

const dest = Path.join(__dirname, "../dist");

module.exports = {
  entry: [
    Path.resolve(__dirname, "./polyfills"),
    Path.resolve(__dirname, "../src/scripts/index"),
  ],
  output: {
    path: dest,
    filename: "bundle.[contenthash].js",
    publicPath: env.ASSET_URL ? env.ASSET_URL : "/",
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [{ from: Path.resolve(__dirname, "../public"), to: "public" }],
    }),
    new HtmlWebpackPlugin({
      template: Path.resolve(__dirname, "../src/index.pug"),
    }),
    new webpack.ProvidePlugin({
      jQuery: "jquery",
      $: "jquery",
    }),
  ],
  resolve: {
    alias: {
      "~": Path.resolve(__dirname, "../src"),
    },
  },
  module: {
    rules: [
      {
        test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)(\?.*)?$/,
        type: "asset/resource",
        generator: {
          filename: "[path][name][ext]",
        },
      },
      {
        test: /\.(pug)$/i,
        use: [
          { loader: "html-loader", options: { sources: false } },
          { loader: "pug-html-loader", options: {} },
        ],
      },
    ],
  },
};
