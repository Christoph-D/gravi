`define(function(require){`

G = require './graph'

class G.AlgorithmRunner
  constructor: (@algorithm) ->
  run: (graph) ->
    properties = p.name for p in graph.VertexType.propertyDescriptors
    for p in @algorithm.requiredProperties ? []
      if p not in properties
        throw Error("Property \"#{p}\" required by this algorithm does not exist in this graph.")
    graph.clearHistory()
    @algorithm.checkPreConditions?(graph)
    result = @algorithm(graph)
    graph.currentStep = 0
    result
return G

`})`
