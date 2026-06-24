const Path = require("path");
const Fs = require("fs");
const Webpack = require("webpack");
const merge = require("webpack-merge");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const common = require("./webpack.common.js");

// Load .env.staging into process.env (only for keys not already set,
// so Docker Compose / shell env vars always take precedence).
try {
  Fs.readFileSync(Path.resolve(__dirname, "../.env.staging"), "utf8")
    .split("\n")
    .forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIdx = trimmed.indexOf("=");
        const key = trimmed.slice(0, eqIdx).trim();
        if (eqIdx > 0 && !(key in process.env))
          process.env[key] = trimmed.slice(eqIdx + 1).trim();
      }
    });
} catch (_) {}

module.exports = merge(common, {
  mode: "production",
  devtool: "source-map",
  stats: "errors-only",
  optimization: {
    minimize: true,
  },
  plugins: [
    new Webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("staging"),
      "process.env.API_ROOT": JSON.stringify(process.env.API_ROOT),
    }),
    new Webpack.optimize.ModuleConcatenationPlugin(),
    new MiniCssExtractPlugin({
      filename: "bundle.css",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules\/(?!tom-select)/,
        use: "babel-loader",
      },
      {
        test: /\.s?css/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
    ],
  },
});
