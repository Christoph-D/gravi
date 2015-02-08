class Node
  constructor: (options) ->
    {@label, @x, @y} = options
    @outV = []
    @inV = []
  addOutEdge: (vertex) -> @outV.push(vertex)
  addInEdge: (vertex) -> @inV.push(vertex)
  outNeighbors: (graph) -> graph.vertices[id] for id in @outV
  inNeighbors: (graph) -> graph.vertices[id] for id in @inV

class Edge

class Graph
  constructor: ->
    @vertices = []
  addVertex: (vertex) ->
    vertex.id = @vertices.length
    @vertices.push(vertex)
  addEdge: (s, t) ->
    @vertices[s].addOutEdge(t)
    @vertices[t].addInEdge(s)
  edges: ->
    [].concat (([id, t] for t in outV) for { id, outV } in @vertices)...
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
    edges = svg.selectAll(".edge").data(@edges())
    edges.enter().append("line").attr("class", "edge")
    edges
      .attr("x1", (d) => @vertices[d[0]].x)
      .attr("y1", (d) => @vertices[d[0]].y)
      .attr("x2", (d) => @vertices[d[1]].x)
      .attr("y2", (d) => @vertices[d[1]].y)
  draw: (svg) ->
    d3.select("#dump").text(@toString())
    @drawEdges(svg)
    @drawVertices(svg)
  toString: -> JSON.stringify(this)
  clone: ->
    g = new Graph
    # ...
    return g

class FiniteAutomaton extends Graph
