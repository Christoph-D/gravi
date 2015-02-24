#= require TimedProperty
#= require <customproperty.coffee>
#= require Extensible

class Vertex extends Extensible
  addOutEdge: (e) -> @outE.push(e)
  addInEdge: (e) -> @inE.push(e)

  removeEdgeId: (edgeId) ->
    @outE = (e for e in @outE when e != edgeId)
    @inE = (e for e in @inE when e != edgeId)

  # @outE contains only the ids of outgoing edges.  @outEdges()
  # returns the corresponding list of Edge objects.
  outEdges: -> @graph.edges[e] for e in @outE
  inEdges: -> @graph.edges[e] for e in @inE

  # Returns a list of Vertex objects.
  outNeighbors: -> @graph.vertices[e.head] for e in @outEdges(graph)
  inNeighbors: -> @graph.vertices[e.tail] for e in @inEdges(graph)

  # Marks all incident edges as modified.  Useful if the vertex shape
  # changes and the edges need to be redrawn.
  edgesModified: ->
    for e in @outEdges()
      e.modified = true
    for e in @inEdges()
      e.modified = true

Vertex = addCustomProperty(Vertex, name: "graph", type: "object", editable: false, shouldBeSaved: false)
Vertex = addCustomProperty(Vertex, name: "id", type: "number", editable: false, shouldBeSaved: false)
Vertex = addCustomProperty(Vertex, name: "outE", type: "array", editable: false, shouldBeSaved: false)
Vertex = addCustomProperty(Vertex, name: "inE", type: "array", editable: false, shouldBeSaved: false)
Vertex = addCustomProperty(Vertex, name: "label", type: "string", defaultValue: "")
Vertex = addCustomProperty(Vertex, name: "x", type: "number", defaultValue: 0, editable: false)
Vertex = addCustomProperty(Vertex, name: "y", type: "number", defaultValue: 0, editable: false)


class Edge extends Extensible

Edge = addCustomProperty(Edge, name: "graph", type: "object", editable: false, shouldBeSaved: false)
Edge = addCustomProperty(Edge, name: "id", type: "number", editable: false, shouldBeSaved: false)
Edge = addCustomProperty(Edge, name: "head", type: "number", editable: false)
Edge = addCustomProperty(Edge, name: "tail", type: "number", editable: false)


class Graph extends Extensible
  constructor: (options = {}) ->
    @VertexType = options.VertexType ? Vertex
    @EdgeType = options.EdgeType ? Edge
    @vertices = []
    if options.numVertices? and options.numVertices > 0
      @addVertex new @VertexType for i in [1..options.numVertices]
    @edges = []
    @addEdge e[0], e[1] for e in options.edgeList ? []
    @totalSteps = 0
    @currentStep = 0
    super

  addVertex: (v) ->
    v.id = @vertices.length
    v.graph = this
    @vertices.push(v)

  removeVertex: (v) ->
    for w, i in @vertices
      continue unless w?
      if v == w
        for e in v.inEdges()
          @removeEdge(e)
        for e in v.outEdges()
          @removeEdge(e)
        @vertices[i] = null
        return

  parseEdge: (tail, head) ->
    if not head?
      e = tail # assume that tail is already an Edge object
    else
      e = new @EdgeType tail: tail, head: head
    if not e.tail?
      throw new Error("Missing property \"tail\"")
    if not @vertices[e.tail]?
      throw new Error("Invalid property \"tail\". Not a vertex id: #{e.tail}")
    if not e.head?
      throw new Error("Missing property \"head\"")
    if not @vertices[e.head]?
      throw new Error("Invalid property \"head\". Not a vertex id: #{e.head}")
    return e

  addEdge: (tail, head) ->
    e = @parseEdge(tail, head)
    if @hasEdge e
      return # no duplicate edges
    e.id = @edges.length
    e.graph = this
    @vertices[e.tail].addOutEdge e.id
    @vertices[e.head].addInEdge e.id
    @edges.push e

  # Accepts a single Edge object or tail, head.  Ignores the edge id.
  removeEdge: (tail, head) ->
    e = @parseEdge(tail, head)
    for f, i in @edges
      continue unless f?
      if e.head == f.head and e.tail == f.tail
        @vertices[e.tail].removeEdgeId i
        @vertices[e.head].removeEdgeId i
        # We set the entry to null in order to preserve the indices in
        # @edges.  Removing/adding lots of edges will thus clutter
        # @edges with null entries.  See @compressIds().
        @edges[i] = null
        return

  # Removes null vertices and edges by reassigning all ids.
  compressIds: ->
    translationTable = (what) ->
      ids = {}; j = 0
      for x, i in what when x != null
        ids[i] = j++
      ids
    idsV = translationTable @vertices
    idsE = translationTable @edges

    for v in @getVertices()
      v.outE = (idsE[i] for i in v.outE)
      v.inE = (idsE[i] for i in v.inE)
    for e in @getEdges()
      e.tail = idsV[e.tail]
      e.head = idsV[e.head]

    @edges = @getEdges()
    @vertices = @getVertices()
    e.id = idsE[e.id] for e, i in @edges
    v.id = idsV[v.id] for v, i in @vertices

  hasEdge: (tail, head) ->
    e = @parseEdge(tail, head)
    for f in @getEdges()
      return true if e.head == f.head and e.tail == f.tail
    return false

  getVertices: -> v for v in @vertices when v != null
  getEdges: -> e for e in @edges when e != null

  saveStep: ->
    ++@totalSteps
    ++@currentStep

  clearHistory: ->
    # Reset all timed properties to their default value.
    for v in @getVertices()
      for key, value of v when value instanceof TimedProperty
        value.reset()
    for e in @getEdges()
      for key, value of e when value instanceof TimedProperty
        value.reset()
    @totalSteps = 0
    @currentStep = 0

  @vertexOrEdgeToJSON = (v) ->
    if v == null
      return null
    w = {}
    for p in v.propertyDescriptors?() ? []
      # Save only properties different from the default value.
      if p.shouldBeSaved != false and v[p.name] != p.defaultValue
        w[p.name] = v[p.name]
    return w
  toJSON: ->
    g = type: @constructor.name, version: @version, vertices: [], edges: []
    for v in @vertices
      g.vertices.push(Graph.vertexOrEdgeToJSON v)
    for e in @edges
      g.edges.push(Graph.vertexOrEdgeToJSON e)
    g


graphFromJSON = (json, validTypes = ["SimpleGraph", "FiniteAutomaton", "ParityGame"]) ->
  raw = JSON.parse(json)
  if raw.type?
    if raw.type in validTypes
      g = new window[raw.type]
    else
      throw TypeError("Don't know how to make a graph of type \"#{raw.type}\". Known types: #{validTypes}")
  else
    g = new window[validTypes[0]]
  for v, i in raw.vertices ? []
    if v == null
      g.vertices.push(null)
    else
      g.addVertex(new g.VertexType v)
  for e, i in raw.edges ? []
    if e == null
      g.edges.push(null)
    else
      g.addEdge(new g.EdgeType e)
  return g


# Marks a vertex in the graph.  Useful to show the state of
# depth-first search and related algorithms.
class GraphCursorMixin
  constructor: -> @cursor = new TimedProperty null, ["x", "y"]
  setCursor: (cursor) -> @cursor.valueAtTime(@currentStep, cursor)
  getCursor: -> @cursor.valueAtTime(@currentStep)

# Mixin to make a vertex or an edge highlightable.
class HighlightableMixin
  constructor: -> @highlightClass = new TimedProperty ""
  highlight: (highlightId) ->
    if highlightId?
      c = "highlight#{highlightId}"
    else
      c = ""
    @highlightClass.valueAtTime(@graph.currentStep, c)
  getHighlightClass: -> @highlightClass.valueAtTime(@graph.currentStep)

Vertex.mixin HighlightableMixin
Edge.mixin HighlightableMixin
Graph.mixin GraphCursorMixin
