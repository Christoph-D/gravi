class Vertex
  constructor: (v) ->
    @outE = []
    @inE = []
    this[key] = v[key] for key of v
  addOutEdge: (e) -> @outE.push(e)
  addInEdge: (e) -> @inE.push(e)
  # @outE contains only the ids of outgoing edges.  @outEdges()
  # returns the corresponding list of Edge objects.
  outEdges: (graph) -> graph.edges[e] for e in @outE
  inEdges: (graph) -> graph.edges[e] for e in @inE
  # Returns a list of Vertex objects.
  outNeighbors: (graph) -> graph.vertices[e.head] for e in @outEdges(graph)
  inNeighbors: (graph) -> graph.vertices[e.tail] for e in @inEdges(graph)

class Edge
  # e should contain at least the keys "tail" and "head".
  constructor: (e) -> this[key] = e[key] for key of e

class Graph
  constructor: ->
    @vertices = []
    @edges = []
  addVertex: (v) ->
    v.id = @vertices.length
    @vertices.push(v)
  addEdge: (e) ->
    e.id = @edges.length
    @vertices[e.tail].addOutEdge(e.id)
    @vertices[e.head].addInEdge(e.id)
    @edges.push(e)
  drawVertices: (svg) ->
    drag = d3.behavior.drag()
      .on("drag", (d) =>
        d.x = d3.event.x
        d.y = d3.event.y
        @draw(svg)
      )
    vertices = svg.selectAll(".vertex").data(@vertices)
    vertices.enter().append("circle").attr("class", "vertex")
      .attr("r", 10)
      .call(drag)
    vertices
      .attr("cx", (d) -> d.x)
      .attr("cy", (d) -> d.y)
  drawEdges: (svg) ->
    edges = svg.selectAll(".edge").data(@edges)
    edges.enter().append("line").attr("class", "edge")
    edges
      .attr("x1", (d) => @vertices[d.tail].x)
      .attr("y1", (d) => @vertices[d.tail].y)
      .attr("x2", (d) => @vertices[d.head].x)
      .attr("y2", (d) => @vertices[d.head].y)
  draw: (svg) ->
    d3.select("#dump").text(graphToJSON(this))
    @drawEdges(svg)
    @drawVertices(svg)

graphToJSON = (graph) -> JSON.stringify(graph)
graphFromJSON = (json) ->
  raw = JSON.parse(json)
  g = new Graph
  g.vertices = (new Vertex v for v in raw.vertices)
  g.edges = (new Edge e for e in raw.edges)
  return g

class FiniteAutomaton extends Graph
