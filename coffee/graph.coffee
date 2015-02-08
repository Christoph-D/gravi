class Vertex
  constructor: ->
    @outE = []
    @inE = []
  addOutEdge: (e) -> @outE.push(e)
  addInEdge: (e) -> @inE.push(e)
  outEdges: (graph) -> graph.edges[e] for e in @outE
  inEdges: (graph) -> graph.edges[e] for e in @inE
  outNeighbors: (graph) -> graph.vertices[e.head] for e in @outEdges(graph)
  inNeighbors: (graph) -> graph.vertices[e.tail] for e in @inEdges(graph)

class Edge
  constructor: ({@tail, @head}) ->

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
    d3.select("#dump").text(@toString())
    @drawEdges(svg)
    @drawVertices(svg)
  toString: -> JSON.stringify(this)

graphFromJSON = (json) ->
  raw = JSON.parse(json)
  g = new Graph
  for v in raw.vertices
    v2 = new Vertex
    v2[key] = value for key, value of v
    v2.inE = []
    v2.outE = [] # edges will be added later
    g.addVertex(v2)
  for e in raw.edges
    e2 = new Edge tail: e.tail, head: e.head
    e2[key] = value for key, value of e
    g.addEdge(e2)
  return g

class FiniteAutomaton extends Graph
