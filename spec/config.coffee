requirejs = require("requirejs")

requirejs.config({
  paths: { gralog: "../js" },
  baseUrl: "specjs",
  nodeRequire: require})

global.require = requirejs
global.define = requirejs.define
