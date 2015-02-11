# Mixin to draw a vertex with a circular shape.
VertexDrawableCircular =
  # Returns the coordinates of the endpoint of an adjacent edge from
  # the given other node.
  edgeAnchor: (otherNode) ->
    a = Math.atan2(@y - otherNode.y, @x - otherNode.x)
    return { x: @x - Math.cos(a) * 10, y: @y - Math.sin(a) * 10}
  drawEnter: (editor, svgGroup) ->
    svgGroup.append("circle").attr("r", 10)
  drawUpdate: (editor, svgGroup) ->
    svgGroup.attr("class",
      "vertex " +
      @getHighlightClass(editor.g) +
      (if editor.selectedV == this then " selected" else ""))
    svgGroup.selectAll("circle")
      .attr("cx", (d) -> d.x)
      .attr("cy", (d) -> d.y)

# Mixin to draw an edge with an arrow at its head.
EdgeDrawable =
  drawEnter: (editor, svgGroup) ->
    svgGroup.append("line")
  drawUpdate: (editor, svgGroup) ->
    s = editor.g.vertices[@tail]
    t = editor.g.vertices[@head]
    svgGroup.attr("class", "edge " + @getHighlightClass(editor.g))
    svgGroup.selectAll("line")
      .attr("x1", (d) -> s.edgeAnchor(t).x)
      .attr("y1", (d) -> s.edgeAnchor(t).y)
      .attr("x2", (d) -> t.edgeAnchor(s).x)
      .attr("y2", (d) -> t.edgeAnchor(s).y)

class GraphEditor
  # This class may modify the graph @g.
  constructor: (@g) ->
    # This is true when the user is drawing a new edge.
    @drawEdgeMode = false
    # The current mouse position.
    @mouse = { x: 0, y: 0 }
    # The currently selected vertex.
    @selectedV = null

    # Patch the vertices and edges to make them drawable.
    @g.VertexType = @g.VertexType.newTypeWithMixin VertexDrawableCircular
    @g.vertices = (new @g.VertexType(v) for v in @g.vertices)
    @g.EdgeType = @g.EdgeType.newTypeWithMixin EdgeDrawable
    @g.edges = (new @g.EdgeType(v) for v in @g.edges)

  drawVertices: (svg) ->
    drag = d3.behavior.drag()
      .on("dragstart", (d) =>
        d3.event.sourceEvent.stopPropagation()
        @selectedV = d
        @draw(svg)
      )
      .on("drag", (d) =>
        d.x = d3.event.x
        d.y = d3.event.y
        @draw(svg)
      )
    svg.on("click", (d) =>
      return if d3.event.defaultPrevented
      @selectedV = d
      @draw(svg))
    vertices = svg.select("#vertices").selectAll(".vertex").data(@g.vertices)
    editor = this
    vertices.enter().append("g")
      .each((v) -> v.drawEnter(editor, d3.select(this)))
      .call(drag)
      .on("click", (d) =>
        @selectedV = d
        @draw(svg)
        d3.event.stopPropagation()
      )
      .on("dblclick", (d) =>
        @selectedV = d
        @drawEdgeMode = true
        @draw(svg)
        d3.event.stopPropagation()
      )
      .on("mouseover", (d) =>
        if @drawEdgeMode and @selectedV.id != d.id
          e = new @g.EdgeType tail: @selectedV.id, head: d.id
          if @g.hasEdge(e)
            @g.removeEdge(e)
          else
            @g.addEdge(e)
          @drawEdgeMode = false
          @draw(svg)
      )
    vertices.exit().remove()
    vertices.each((v) -> v.drawUpdate(editor, d3.select(this)))
    d3.select("#info").text(JSON.stringify(@selectedV, undefined, 2))

  drawEdges: (svg) ->
    edges = svg.select("#edges").selectAll(".edge").data(@g.edges)
    editor = this
    edges.enter().append("g").each((e) -> e.drawEnter(editor, d3.select(this)))
    edges.exit().remove()
    edges.each((e) -> e.drawUpdate(editor, d3.select(this)))

    # s will be null if the user clicks on empty space because this
    # deselects all vertices.  In this case, abort drawEdgeMode.
    s = @selectedV
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
    #d3.select("#dump").text(graphToJSON(this))
    editor = this
    svg.on("mousemove", ->
      [editor.mouse.x, editor.mouse.y] = d3.mouse(this)
      editor.draw(svg))
    @drawEdges(svg)
    @drawVertices(svg)
