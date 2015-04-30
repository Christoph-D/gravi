requirejs = require("requirejs")

requirejs.config({
  paths: { gravi: "../js" },
  baseUrl: ".",
  nodeRequire: require})

global.require = requirejs
global.define = requirejs.define
