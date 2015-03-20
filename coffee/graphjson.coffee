`define(function(require){`
# Functions to convert between a graph and its JSON representation.

G = require './graph'

vertexOrEdgeToJSON = (v) ->
  if v == null
    return null
  w = {}
  for p in v.propertyDescriptors?() ? []
    # Save only properties different from the default value.
    if p.shouldBeSaved != false and v[p.name] != p.defaultValue
      w[p.name] = v[p.name]
  return w

G.Graph::toJSON = ->
  g = type: @constructor.name, version: @version, vertices: [], edges: []
  for v in @vertices
    g.vertices.push(vertexOrEdgeToJSON v)
  for e in @edges
    g.edges.push(vertexOrEdgeToJSON e)
  g

G.graphFromJSON = (json, validTypes = ["SimpleGraph", "FiniteAutomaton", "ParityGame"]) ->
  raw = JSON.parse(json)
  if raw.type?
    if raw.type in validTypes
      if raw.type of G
        g = new G[raw.type]
      else
        g = new window[raw.type]
    else
      throw TypeError("Don't know how to make a graph of type \"#{raw.type}\". Known types: #{validTypes}")
  else
    g = new window[validTypes[0]]
  for v, i in raw.vertices ? []
    if v == null
      g.vertices.push(null)
    else
      try
        g.addVertex(new g.VertexType v)
      catch error
        error.message += " on vertex ##{i}: #{JSON.stringify(v)}"
        throw error
  for e, i in raw.edges ? []
    if e == null
      g.edges.push(null)
    else
      try
        g.addEdge(new g.EdgeType e)
      catch error
        error.message += " on edge ##{i}: #{JSON.stringify(e)}"
        throw error
  return g

return G

`})`
