#= require TimedProperty
#= require Extensible

# Marks a vertex in the graph.  Useful to show the state of
# depth-first search and related algorithms.
class GraphCursorMixin
  constructor: -> @cursor = new TimedProperty null, ["x", "y"]
  setCursor: (cursor) -> @cursor.valueAtTime(@currentStep, cursor)
  getCursor: -> @cursor.valueAtTime(@currentStep)

# Mixin to make a vertex or an edge highlightable.
class HighlightableMixin
  constructor: -> @highlightClass = new TimedProperty ""
  highlight: (graph, highlightId) ->
    if highlightId?
      c = "highlight#{highlightId}"
    else
      c = ""
    @highlightClass.valueAtTime(graph.currentStep, c)
  getHighlightClass: (graph) -> @highlightClass.valueAtTime(graph.currentStep)

class Vertex extends Extensible
  constructor: (v) ->
    @outE = []
    @inE = []
    this[key] = value for own key, value of v
    super

  addOutEdge: (e) -> @outE.push(e)
  addInEdge: (e) -> @inE.push(e)

  removeEdgeId: (edgeId) ->
    @outE = (e for e in @outE when e != edgeId)
    @inE = (e for e in @inE when e != edgeId)

  # @outE contains only the ids of outgoing edges.  @outEdges()
  # returns the corresponding list of Edge objects.
  outEdges: (graph) -> graph.edges[e] for e in @outE
  inEdges: (graph) -> graph.edges[e] for e in @inE

  # Returns a list of Vertex objects.
  outNeighbors: (graph) -> graph.vertices[e.head] for e in @outEdges(graph)
  inNeighbors: (graph) -> graph.vertices[e.tail] for e in @inEdges(graph)

  @mixin HighlightableMixin

class Edge extends Extensible
  # e should contain at least the keys "tail" and "head".
  constructor: (e) ->
    this[key] = value for own key, value of e
    super

  @mixin HighlightableMixin

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
    @vertices.push(v)

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
        # @edges with null entries.  See @compressEdgeIds().
        @edges[i] = null
        return

  # Removes null edges by reassigning all edge ids.
  compressEdgeIds: ->
    ids = {} # translation table for the ids
    j = 0
    for e, i in @edges when e != null
      ids[i] = j++
    # Convert the edge references in the vertices.
    for v in @getVertices()
      v.outE = (ids[i] for i in v.outE)
      v.inE = (ids[i] for i in v.inE)
    # Remove all null edges.
    @edges = @getEdges()
    # Fix the edge ids.
    e.id = ids[e.id] for e, i in @edges

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

  @mixin GraphCursorMixin


vertexToJSONVertex = (v) ->
  if v == null
    return null
  w = {}
  for key in ["x", "y"]
    w[key] = v[key]
  for p in v.propertyDescriptors?() ? []
    # Save only properties different from the default value.
    if v[p.name] != p.value
      w[p.name] = v[p.name]
  return w
graphToJSON = (graph) ->
  g = vertices: [], edges: []
  for v in graph.vertices
    g.vertices.push(vertexToJSONVertex v)
  for e in graph.edges
    f = {}
    if e == null
      f = null
    else
      for key in ["head", "tail"]
        f[key] = e[key]
    g.edges.push(f)
  JSON.stringify(g, undefined, 2)

graphFromJSON = (json) ->
  raw = JSON.parse(json)
  g = new Graph
  for v, i in raw.vertices ? []
    if v == null
      g.vertices.push(null)
    else
      g.addVertex(new Vertex v)
  for e, i in raw.edges ? []
    if e == null
      g.edges.push(null)
    else
      g.addEdge(new Edge e)
  return g


addVertexProperty = (VertexType, descriptor) ->
  name = descriptor.name
  Name = name[0].toUpperCase() + name[1..]

  switch descriptor.type
    when "string", "number"
      descriptor.appendToDom = (dom) ->
        self = this
        dom.append("input").attr("type", "text").attr("name", name)
          .property("value", @[name])
          .on("input", -> self[name] = this.value)
    else
      descriptor.appendToDom = (dom) ->

  class VertexTypeWithProperty extends VertexType
    if @propertyDescriptors?
      @propertyDescriptors = (p for p in @propertyDescriptors)
    else
      @propertyDescriptors = []
    for p in @propertyDescriptors
      if p.name == name
        throw TypeError("Vertex property \"#{name}\" already exists.")
    @propertyDescriptors.push(descriptor)

    constructor: (v) ->
      super
      if not @_properties?
        Object.defineProperty this, '_properties',
          configurable: true
          enumerable: false
          writable: true
          value: {}
      self = this
      Object.defineProperty this, name,
        configurable: true
        enumerable: true
        get: -> self._properties[name]
        set: (value) ->
          self._properties[name] = value
          self["onChange#{Name}"]?()
      if v?[name]?
        @_properties[name] = v[name]
      else
        @_properties[name] = descriptor.value
      @["pretty#{Name}"] = => descriptor.pretty @[name]

    eachProperty: (f) -> f p for p in @propertyDescriptors()
    propertyDescriptors: -> VertexTypeWithProperty.propertyDescriptors

    appendPropertiesToDom: (dom) ->
      self = this
      @eachProperty (p) -> p.appendToDom.call self, dom

Vertex = addVertexProperty(Vertex, name: "label", type: "string", value: "")
Vertex = addVertexProperty(Vertex, name: "x", type: "number", value: 0)
Vertex = addVertexProperty(Vertex, name: "y", type: "number", value: 0)
Vertex = addVertexProperty(Vertex,
  name: "accepting",
  type: "boolean",
  value: false,
  trueValue: "accepting",
  falseValue: "rejecting")
