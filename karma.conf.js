/*eslint-env commonjs*/
var webpackConfig = require('./webpack.config.js');
webpackConfig.entry = undefined;
webpackConfig.output = undefined;
webpackConfig.mode = 'development';

const ci = process.env.CI || false

module.exports = function (config) {
  config.set({
    basePath: ".",
    frameworks: ["jasmine", "webpack"],
    plugins: [
      "karma-chrome-launcher",
      "karma-jasmine",
      "karma-webpack",
    ],
    files: [{ pattern: 'spec/*.js', watched: false }],
    exclude: [],
    preprocessors: { "spec/*.js": ["webpack"] },
    reporters: ["progress"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    browsers: ["ChromeHeadless"],
    singleRun: ci,
    webpack: webpackConfig
  });
};
