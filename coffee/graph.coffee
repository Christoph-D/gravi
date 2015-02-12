#= require TimedProperty
#= require Extensible

# Marks a vertex in the graph.  Useful to show the state of
# depth-first search and related algorithms.
GraphCursorMixin =
  constructor: -> @cursor = new TimedProperty null, ["x", "y"]
  setCursor: (cursor) -> @cursor.valueAtTime(@currentStep, cursor)
  getCursor: -> @cursor.valueAtTime(@currentStep)

# Mixin to make a vertex or an edge highlightable.
HighlightableMixin =
  constructor: -> @highlightClass = new TimedProperty ""
  highlight: (graph, highlightId) ->
    if highlightId?
      c = "highlight#{highlightId}"
    else
      c = ""
    @highlightClass.valueAtTime(graph.currentStep, c)
  getHighlightClass: (graph) -> @highlightClass.valueAtTime(graph.currentStep)

# Mixin to make a graph highlightable.
HighlightableGraphMixin =
  clearHistory: ->
    v.highlightClass.clear() for v in @getVertices()
    e.highlightClass.clear() for e in @getEdges()
    @totalSteps = 0
    @currentStep = 0

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
  constructor: (@VertexType = Vertex, @EdgeType = Edge) ->
    @vertices = []
    @edges = []
    @totalSteps = 0
    @currentStep = 0
    super

  addVertex: (v) ->
    v.id = @vertices.length
    @vertices.push(v)

  parseEdge: (tail, head) ->
    if not head?
      return tail # assume that tail is already an Edge object
    else
      return new @EdgeType tail: tail, head: head

  addEdge: (tail, head) ->
    e = @parseEdge(tail, head)
    if @hasEdge e
      return # no duplicate edges
    e.id = @edges.length
    @vertices[e.tail].addOutEdge e.id
    @vertices[e.head].addInEdge e.id
    @edges.push e

  # TODO: implement one parameter version by checking the edge id
  removeEdge: (tail, head) ->
    e = @parseEdge(tail, head)
    for f, i in @edges
      continue unless f?
      if e.head == f.head and e.tail == f.tail
        @vertices[e.tail].removeEdgeId i
        @vertices[e.head].removeEdgeId i
        # We set the entry to null in order to preserve the indices
        # because they are the edge ids.  Removing/adding lots of
        # edges will thus clutter @edges with null entries.
        # TODO: There should be a function to renumber edges and clean
        # up null entries.
        @edges[i] = null
        return

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

  @mixin HighlightableGraphMixin
  @mixin GraphCursorMixin


graphToJSON = (graph) ->
  g = vertices: [], edges: []
  for v in graph.vertices
    w = {}
    if v == null
      w = null
    else
      for key in ["x", "y"]
        w[key] = v[key]
    g.vertices.push(w)
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
  for v, i in raw.vertices
    if v == null
      g.vertices.push(null)
    else
      g.addVertex(new Vertex v)
  for e, i in raw.edges
    if e == null
      g.edges.push(null)
    else
      g.addEdge(new Edge e)
  return g

class FiniteAutomaton extends Graph
