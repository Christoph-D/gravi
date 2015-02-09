#= require TimedProperty

class Vertex
  constructor: (v) ->
    @outE = []
    @inE = []
    @highlightClass = new TimedProperty ""
    this[key] = v[key] for own key of v

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
    svgGroup.attr("class",
      "vertex " +
      @highlightClass.valueAtTime(graph.currentStep) +
      (if @selected? then " selected" else ""))
    svgGroup.selectAll("circle")
      .attr("cx", (d) -> d.x)
      .attr("cy", (d) -> d.y)

  highlight: (graph, highlightId) ->
    @highlightClass.valueAtTime(graph.currentStep, if highlightId? then "highlight#{highlightId}" else "")

class Edge
  # e should contain at least the keys "tail" and "head".
  constructor: (e) ->
    @highlightClass = new TimedProperty ""
    this[key] = e[key] for own key of e

  highlight: (graph, highlightId) ->
    @highlightClass.valueAtTime(graph.currentStep, if highlightId? then "highlight#{highlightId}" else "")

  drawEnter: (graph, svgGroup) ->
    svgGroup.append("line")
  drawUpdate: (graph, svgGroup) ->
    svgGroup.attr("class", "edge " + @highlightClass.valueAtTime(graph.currentStep))
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
    @drawEdgeMode = false
    @mouse = { x: 0, y: 0 }

  addVertex: (v) ->
    v.id = @vertices.length
    @vertices.push(v)

  parseEdge: (tail, head) ->
    if not head?
      return tail # assume that tail is already an Edge object
    else
      return new Edge tail: tail, head: head

  addEdge: (tail, head) ->
    e = @parseEdge(tail, head)
    return if @hasEdge(e)
    e.id = @edges.length
    @vertices[e.tail].addOutEdge(e.id)
    @vertices[e.head].addInEdge(e.id)
    @edges.push(e)

  # TODO: implement one parameter version by checking the edge id
  removeEdge: (tail, head) ->
    @edges = (e for e in @edges when e.tail != tail or e.head != head)

  hasEdge: (tail, head) ->
    e = @parseEdge(tail, head)
    for f in @edges
      return true if e.head == f.head and e.tail == f.tail
    return false

  # Selects w or deselects all vertices if w == null.
  selectVertex: (w) ->
    v.selected = undefined for v in @vertices
    w.selected = true if w?
  # Returns the currently selected vertex.
  getSelectedVertex: () ->
    for v in @vertices
      return v if v.selected?
    return null

  clearHighlights: () ->
    v.highlightClass.clear() for v in @vertices
    e.highlightClass.clear() for e in @edges

  drawVertices: (svg) ->
    drag = d3.behavior.drag()
      .on("dragstart", (d) =>
        @selectVertex(d)
        @draw(svg)
        d3.event.sourceEvent.stopPropagation()
      )
      .on("drag", (d) =>
        d.x = d3.event.x
        d.y = d3.event.y
        @draw(svg)
      )
    svg.on("click", (d) =>
      return if d3.event.defaultPrevented
      @selectVertex(d)
      @draw(svg))
    vertices = svg.select("#vertices").selectAll(".vertex").data(@vertices)
    graph = this
    vertices.enter().append("g")
      .each((v) -> v.drawEnter(graph, d3.select(this)))
      .call(drag)
      .on("click", (d) =>
        @selectVertex(d)
        @draw(svg)
        d3.event.stopPropagation()
      )
      .on("dblclick", (d) =>
        @selectVertex(d)
        @drawEdgeMode = true
        @draw(svg)
        d3.event.stopPropagation()
      )
      .on("mouseover", (d) =>
        if @drawEdgeMode and @getSelectedVertex().id != d.id
          e = new Edge tail: @getSelectedVertex().id, head: d.id
          if @hasEdge(e)
            @removeEdge(e)
          else
            @addEdge(e)
          @drawEdgeMode = false
          @draw(svg)
      )
    vertices.each((v) -> v.drawUpdate(graph, d3.select(this)))
    d3.select("#info").text(JSON.stringify(@getSelectedVertex(), undefined, 2))

  drawEdges: (svg) ->
    edges = svg.select("#edges").selectAll(".edge").data(@edges)
    graph = this
    edges.enter().append("g").each((e) -> e.drawEnter(graph, d3.select(this)))
    edges.each((e) -> e.drawUpdate(graph, d3.select(this)))

    # s will be null if the user clicks on empty space because this
    # deselects all vertices.  In this case, abort drawEdgeMode.
    s = @getSelectedVertex()
    if @drawEdgeMode and s?
      pointer = svg.selectAll(".edge.pointer").data([@mouse])
      pointer.enter().append("line").attr("class", "edge pointer")
      pointer
          .attr("x1", (d) -> s.edgeAnchor(d).x)
          .attr("y1", (d) -> s.edgeAnchor(d).y)
          .attr("x2", (d) -> d.x)
          .attr("y2", (d) -> d.y)
    else
      @drawEdgeMode = false
      svg.selectAll(".edge.pointer").remove()

  draw: (svg) ->
    d3.select("#dump").text(graphToJSON(this))
    g = this
    svg.on("mousemove", () ->
      [g.mouse.x, g.mouse.y] = d3.mouse(this)
      g.draw(svg))
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
