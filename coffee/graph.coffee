Extensible = require "./extensible"
CustomProperty = require "./customproperty"
Event = require "./event"

G = {}
Vertex = Event.makeListenable class extends Extensible
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
  outEdges: (edgeFilter) ->
    edges = (@graph.edges[e] for e in @outE)
    if edgeFilter?
      edges = (e for e in edges when edgeFilter(e))
    edges
  inEdges: (edgeFilter) ->
    edges = (@graph.edges[e] for e in @inE)
    if edgeFilter?
      edges = (e for e in edges when edgeFilter(e))
    edges

  # Returns a list of Vertex objects.
  outNeighbors: (vertexFilter, edgeFilter) ->
    vertices = (@graph.vertices[e.head] for e in @outEdges(edgeFilter))
    if vertexFilter?
      vertices = (v for v in vertices when vertexFilter(v))
    vertices
  inNeighbors: (vertexFilter, edgeFilter) ->
    vertices = (@graph.vertices[e.tail] for e in @inEdges(edgeFilter))
    if vertexFilter?
      vertices = (v for v in vertices when vertexFilter(v))
    vertices

  # Marks all incident edges as modified.  Useful if the vertex shape
  # changes and the edges need to be redrawn.
  edgesModified: ->
    for e in @outEdges()
      e.modified = true
    for e in @inEdges()
      e.modified = true
    @

Vertex = CustomProperty.addMany Vertex, [
  { name: "graph", type: "object", editable: false, shouldBeSaved: false, notify: false }
  { name: "id", type: "number", editable: false, shouldBeSaved: false }
  { name: "outE", type: "array", editable: false, shouldBeSaved: false }
  { name: "inE", type: "array", editable: false, shouldBeSaved: false }
  { name: "label", type: "string", defaultValue: "" }
  { name: "x", type: "number", defaultValue: 0, editable: false }
  { name: "y", type: "number", defaultValue: 0, editable: false }
  ]
G.Vertex = Vertex

Edge = Event.makeListenable class extends Extensible
  # No methods here.  Everything is in custom properties.
  @

Edge = CustomProperty.addMany Edge, [
  { name: "graph", type: "object", editable: false, shouldBeSaved: false, notify: false }
  { name: "id", type: "number", editable: false, shouldBeSaved: false }
  { name: "head", type: "number", editable: false }
  { name: "tail", type: "number", editable: false }
  ]
G.Edge = Edge

G.Graph = Event.makeListenable class extends Extensible
  name: "Graph"

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
    @dispatch('postAddVertex', v)
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
        @dispatch('postRemoveVertex')
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
    @dispatch('postAddEdge', e)
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
        @dispatch('postRemoveEdge', f)
        return @
    @

  idTranslationTable = (what) ->
    ids = {}
    j = 0
    for x, i in what when x != null
      ids[i] = j++
    ids
  # Removes null vertices and edges by reassigning all ids.
  compressIds: ->
    idsV = idTranslationTable @vertices
    idsE = idTranslationTable @edges

    # Remove all null entries and then fix all the ids.
    @vertices = @getVertices()
    for v in @vertices
      v.id = idsV[v.id]
      v.outE = (idsE[i] for i in v.outE)
      v.inE = (idsE[i] for i in v.inE)

    @edges = @getEdges()
    for e in @edges
      e.id = idsE[e.id]
      e.tail = idsV[e.tail]
      e.head = idsV[e.head]
    @

  hasEdge: (tail, head) ->
    e = @parseEdge(tail, head)
    for f in @getEdges()
      return true if e.head == f.head and e.tail == f.tail
    return false

  getVertices: (vertexFilter) ->
    if vertexFilter?
      v for v in @vertices when v != null and vertexFilter(v)
    else
      v for v in @vertices when v != null
  getEdges: (edgeFilter) ->
    if edgeFilter?
      e for e in @edges when e != null and edgeFilter(e)
    else
      e for e in @edges when e != null

return G
