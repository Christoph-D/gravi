# Turns a vertex into a drawable vertex.
VertexDrawableMixin =
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

# Turns an edge into a drawable edge.
EdgeDrawableMixin =
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

class GraphEditor
  constructor: (@g = new Graph) ->
    @drawEdgeMode = false
    @mouse = { x: 0, y: 0 }

  # Selects w or deselects all vertices if w == null.
  selectVertex: (w) ->
    v.selected = undefined for v in @g.vertices
    w.selected = true if w?
  # Returns the currently selected vertex.
  getSelectedVertex: ->
    for v in @g.vertices
      return v if v.selected?
    return null

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
    vertices = svg.select("#vertices").selectAll(".vertex").data(@g.vertices)
    graph = @g
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
          if @g.hasEdge(e)
            @g.removeEdge(e)
          else
            @g.addEdge(e)
          @drawEdgeMode = false
          @draw(svg)
      )
    vertices.exit().remove()
    vertices.each((v) -> v.drawUpdate(graph, d3.select(this)))
    d3.select("#info").text(JSON.stringify(@getSelectedVertex(), undefined, 2))

  drawEdges: (svg) ->
    edges = svg.select("#edges").selectAll(".edge").data(@g.edges)
    graph = @g
    edges.enter().append("g").each((e) -> e.drawEnter(graph, d3.select(this)))
    edges.exit().remove()
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
    editor = this
    svg.on("mousemove", ->
      [editor.mouse.x, editor.mouse.y] = d3.mouse(this)
      editor.draw(svg))
    @drawEdges(svg)
    @drawVertices(svg)
