G = require "./graph"
require "./graphjson"
require "./historygraph"
require "./algorithmrunner"
require "./simplegraph"
require "./finiteautomaton"
require "./paritygame"
require "./strategyimprovement"
require "./generators"
require "./editor"
if window?
  window.G = G
return G
