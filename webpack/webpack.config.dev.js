const Path = require("path");
const Fs = require("fs");
const Webpack = require("webpack");
const merge = require("webpack-merge");
const common = require("./webpack.common.js");

// Load .env.development into process.env (only for keys not already set,
// so Docker Compose / shell env vars always take precedence).
try {
  Fs.readFileSync(Path.resolve(__dirname, "../.env.development"), "utf8")
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

const dest = Path.join(__dirname, "../dist");

module.exports = merge(common, {
  mode: "development",
  devtool: "cheap-eval-source-map",
  devServer: {
    contentBase: dest,
    inline: true,
    host: "0.0.0.0", // allow connection from outside the docker container
    public: "localhost:${process.env.TINX_UI_HTTP_PORT || 8080}",
  },
  plugins: [
    new Webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("development"),
      "process.env.API_ROOT": JSON.stringify(process.env.API_ROOT),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        include: Path.resolve(__dirname, "../src"),
        enforce: "pre",
        loader: "eslint-loader",
        options: {
          emitWarning: true,
        },
      },
      {
        test: /\.(js)$/,
        include: [
          Path.resolve(__dirname, "../src"),
          Path.resolve(__dirname, "../node_modules/tom-select"),
        ],
        loader: "babel-loader",
      },
      {
        test: /\.s?css$/i,
        use: ["style-loader", "css-loader?sourceMap=true", "sass-loader"],
      },
    ],
  },
});
