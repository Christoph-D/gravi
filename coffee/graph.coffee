getHighlightClass = (graph, obj) ->
  i = graph.currentStep
  --i while i > 0 and not obj.class[i]?
  if obj.class[i]?
    return obj.class[i]
  return ""

class Vertex
  constructor: (v) ->
    @outE = []
    @inE = []
    @class = []
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

  # Returns the coordinates of the endpoint of an adjacent edge from
  # the given other node.
  edgeAnchor: (otherNode) ->
    a = Math.atan2(@y - otherNode.y, @x - otherNode.x)
    return { x: @x - Math.cos(a) * 10, y: @y - Math.sin(a) * 10}

  drawEnter: (graph, svgGroup) ->
    svgGroup.append("circle").attr("r", 10)
  drawUpdate: (graph, svgGroup) ->
    svgGroup.attr("class", "vertex " + getHighlightClass(graph, this))
    svgGroup.selectAll("circle")
      .attr("cx", (d) -> d.x)
      .attr("cy", (d) -> d.y)

  highlight: (graph, highlightId) ->
    if highlightId?
      @class[graph.currentStep] = "highlight#{highlightId}"
    else
      @class[graph.currentStep] = ""

class Edge
  # e should contain at least the keys "tail" and "head".
  constructor: (e) ->
    @class = []
    this[key] = e[key] for key of e

  highlight: (graph, highlightId) ->
    if highlightId?
      @class[graph.currentStep] = "highlight#{highlightId}"
    else
      @class[graph.currentStep] = ""

  drawEnter: (graph, svgGroup) ->
    svgGroup.append("line")
  drawUpdate: (graph, svgGroup) ->
    svgGroup.attr("class", "edge " + getHighlightClass(graph, this))
    s = graph.vertices[@tail]
    t = graph.vertices[@head]
    svgGroup.selectAll("line")
      .attr("x1", (d) => s.edgeAnchor(t).x)
      .attr("y1", (d) => s.edgeAnchor(t).y)
      .attr("x2", (d) => t.edgeAnchor(s).x)
      .attr("y2", (d) => t.edgeAnchor(s).y)

class Graph
  constructor: ->
    @vertices = []
    @edges = []
    @totalSteps = 0
    @currentStep = 0

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
    vertices = svg.select("#vertices").selectAll(".vertex").data(@vertices)
    graph = this
    vertices.enter().append("g")
      .each((v) -> v.drawEnter(graph, d3.select(this)))
      .call(drag)
    vertices.each((v) -> v.drawUpdate(graph, d3.select(this)))

  drawEdges: (svg) ->
    edges = svg.select("#edges").selectAll(".edge").data(@edges)
    graph = this
    edges.enter().append("g").each((e) -> e.drawEnter(graph, d3.select(this)))
    edges.each((e) -> e.drawUpdate(graph, d3.select(this)))

  draw: (svg) ->
    d3.select("#dump").text(graphToJSON(this))
    @drawEdges(svg)
    @drawVertices(svg)

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
