const Path = require("path");
const Fs = require("fs");
const Webpack = require("webpack");
const { merge } = require("webpack-merge");
const ESLintPlugin = require("eslint-webpack-plugin");
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
  devtool: "eval-cheap-source-map",
  devServer: {
    static: { directory: dest },
    host: "0.0.0.0", // allow connection from outside the docker container
    port: parseInt(process.env.TINX_UI_HTTP_PORT) || 8080,
    allowedHosts: "all",
    client: {
      webSocketURL: `ws://localhost:${process.env.TINX_UI_HTTP_PORT || 8080}/ws`,
    },
  },
  plugins: [
    new Webpack.DefinePlugin({
      "process.env.NODE_ENV": JSON.stringify("development"),
      "process.env.API_ROOT": JSON.stringify(process.env.API_ROOT),
    }),
    new ESLintPlugin({
      context: Path.resolve(__dirname, "../src"),
      emitWarning: true,
    }),
  ],
  module: {
    rules: [
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
        use: [
          "style-loader",
          { loader: "css-loader", options: { sourceMap: true } },
          {
            loader: "sass-loader",
            options: {
              sassOptions: {
                loadPaths: [Path.resolve(__dirname, "../node_modules")],
              },
            },
          },
        ],
      },
    ],
  },
});
