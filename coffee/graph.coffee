`define(function(require){`

Extensible = require './extensible'
CustomProperty = require './customproperty'

G = {}
class Vertex extends Extensible
  addOutEdge: (e) ->
    @outE.push(e)
    @
  addInEdge: (e) ->
    @inE.push(e)
    @

  removeEdgeId: (edgeId) ->
    @outE = (e for e in @outE when e != edgeId)
    @inE = (e for e in @inE when e != edgeId)
    @

  # @outE contains only the ids of outgoing edges.  @outEdges()
  # returns the corresponding list of Edge objects.
  outEdges: -> @graph.edges[e] for e in @outE
  inEdges: -> @graph.edges[e] for e in @inE

  # Returns a list of Vertex objects.
  outNeighbors: -> @graph.vertices[e.head] for e in @outE
  inNeighbors: -> @graph.vertices[e.tail] for e in @inE

  # Marks all incident edges as modified.  Useful if the vertex shape
  # changes and the edges need to be redrawn.
  edgesModified: ->
    for e in @outEdges()
      e.modified = true
    for e in @inEdges()
      e.modified = true
    @

Vertex = CustomProperty.add(Vertex, name: "graph", type: "object", editable: false, shouldBeSaved: false)
Vertex = CustomProperty.add(Vertex, name: "id", type: "number", editable: false, shouldBeSaved: false)
Vertex = CustomProperty.add(Vertex, name: "outE", type: "array", editable: false, shouldBeSaved: false)
Vertex = CustomProperty.add(Vertex, name: "inE", type: "array", editable: false, shouldBeSaved: false)
Vertex = CustomProperty.add(Vertex, name: "label", type: "string", defaultValue: "")
Vertex = CustomProperty.add(Vertex, name: "x", type: "number", defaultValue: 0, editable: false)
Vertex = CustomProperty.add(Vertex, name: "y", type: "number", defaultValue: 0, editable: false)
Vertex::onChangeLabel = -> @onRedrawNeeded?()
G.Vertex = Vertex

class Edge extends Extensible
  # No methods here.  Everything is in custom properties.

Edge = CustomProperty.add(Edge, name: "graph", type: "object", editable: false, shouldBeSaved: false)
Edge = CustomProperty.add(Edge, name: "id", type: "number", editable: false, shouldBeSaved: false)
Edge = CustomProperty.add(Edge, name: "head", type: "number", editable: false)
Edge = CustomProperty.add(Edge, name: "tail", type: "number", editable: false)
G.Edge = Edge

class G.Graph extends Extensible
  constructor: (options = {}) ->
    @VertexType = options.VertexType ? Vertex
    @EdgeType = options.EdgeType ? Edge
    @vertices = []
    if options.numVertices? and options.numVertices > 0
      @addVertex new @VertexType for i in [1..options.numVertices]
    @edges = []
    @addEdge e[0], e[1] for e in options.edgeList ? []
    super

  addVertex: (v) ->
    v.id = @vertices.length
    v.graph = this
    @vertices.push(v)
    @

  removeVertex: (v) ->
    for w, i in @vertices
      continue unless w?
      if v == w
        for e in v.inEdges()
          @removeEdge(e)
        for e in v.outEdges()
          @removeEdge(e)
        @vertices[i] = null
        return @
    @

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
      return @ # no duplicate edges
    e.id = @edges.length
    e.graph = this
    @vertices[e.tail].addOutEdge e.id
    @vertices[e.head].addInEdge e.id
    @edges.push e
    @

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
        return @
    @

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
    @

  hasEdge: (tail, head) ->
    e = @parseEdge(tail, head)
    for f in @getEdges()
      return true if e.head == f.head and e.tail == f.tail
    return false

  getVertices: -> v for v in @vertices when v != null
  getEdges: -> e for e in @edges when e != null

return G

`})`
