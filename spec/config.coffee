requirejs = require("requirejs")

requirejs.config({
  paths: { gralog: "../js" },
  baseUrl: ".",
  nodeRequire: require})

global.require = requirejs
global.define = requirejs.define
