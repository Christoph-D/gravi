#= require TimedProperty
#= require GraphEditor

class Extendable
  constructor: -> @init?()
  @mixin: (mixin) ->
    oldInit = this::init
    this::init = ->
      oldInit?.call this
      mixin.init?.call this
    this::[key] = value for key, value of mixin when key != "init"
    this

# Makes a vertex or an edge highlightable.
HighlightableMixin =
  init: -> @highlightClass = new TimedProperty ""
  highlight: (graph, highlightId) ->
    @highlightClass.valueAtTime(graph.currentStep, if highlightId? then "highlight#{highlightId}" else "")

class Vertex extends Extendable
  constructor: (v) ->
    @outE = []
    @inE = []
    this[key] = v[key] for own key of v
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
  @mixin VertexDrawableMixin

class Edge extends Extendable
  # e should contain at least the keys "tail" and "head".
  constructor: (e) ->
    this[key] = e[key] for own key of e
    super

  @mixin HighlightableMixin
  @mixin EdgeDrawableMixin

class Graph
  constructor: ->
    @vertices = []
    @edges = []
    @totalSteps = 0
    @currentStep = 0

  addVertex: (v) ->
    v.id = if @vertices.length > 0 then 1 + @vertices[@vertices.length - 1].id else 0
    @vertices.push(v)

  parseEdge: (tail, head) ->
    if not head?
      return tail # assume that tail is already an Edge object
    else
      return new Edge tail: tail, head: head

  addEdge: (tail, head) ->
    e = @parseEdge(tail, head)
    if @hasEdge e
      return # no duplicate edges
    e.id = if @edges.length > 0 then 1 + @edges[@edges.length - 1].id else 0
    @vertices[e.tail].addOutEdge e.id
    @vertices[e.head].addInEdge e.id
    @edges.push e

  # TODO: implement one parameter version by checking the edge id
  removeEdge: (tail, head) ->
    e = @parseEdge(tail, head)
    for f, i in @edges
      if e.head == f.head and e.tail == f.tail
        @vertices[e.tail].removeEdgeId f.id
        @vertices[e.head].removeEdgeId f.id
        @edges.splice(i, 1)
        return

  hasEdge: (tail, head) ->
    e = @parseEdge(tail, head)
    for f in @edges
      return true if e.head == f.head and e.tail == f.tail
    return false

  clearHighlights: ->
    v.highlightClass.clear() for v in @vertices
    e.highlightClass.clear() for e in @edges

  saveStep: ->
    ++@totalSteps
    ++@currentStep

graphToJSON = (graph) -> JSON.stringify(graph, undefined, 2)
graphFromJSON = (json) ->
  raw = JSON.parse(json)
  g = new Graph
  g.vertices = (new Vertex v for v in raw.vertices)
  g.edges = (new Edge e for e in raw.edges)
  return g

class FiniteAutomaton extends Graph
