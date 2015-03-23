`define(function(require){`
# Functions to convert between a graph and its JSON representation.

G = require './graph'

G.vertexOrEdgeToJSON = (v) ->
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
    g.vertices.push(G.vertexOrEdgeToJSON v)
  for e in @edges
    g.edges.push(G.vertexOrEdgeToJSON e)
  return g

G.graphFromJSON = (json, validTypes = ["SimpleGraph", "FiniteAutomaton", "ParityGame"]) ->
  raw = JSON.parse(json)
  # If the input has no type, assume it has the first valid type.
  raw.type ?= validTypes[0]

  if raw.type not in validTypes
    throw TypeError("Don't know how to make a graph of type \"#{raw.type}\". Known types: #{validTypes}")

  if raw.type of G
    g = new G[raw.type]
  else
    g = new window[raw.type]

  for v, i in raw.vertices ? []
    # Also insert null vertices to preserve the vertex ids.
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
