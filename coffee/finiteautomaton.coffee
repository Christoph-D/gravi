#= require Graph

class FiniteAutomaton extends Graph
  constructor: (options = {}) ->
    options.VertexType = addCustomProperty(options.VertexType ? Vertex, name: "accepting", type: "boolean", value: false)
    options.EdgeType = addCustomProperty(options.EdgeType ? Edge, name: "letter", type: "string", value: "")
    super options
