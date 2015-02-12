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
  constructor: (g, @svg) ->
    # The current mouse position.
    @mouse = { x: 0, y: 0 }

    # Make vertices draggable.
    @drag = d3.behavior.drag()
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
    # Global click handler to deselect everything.
    @svg.on("click", =>
      return if d3.event.defaultPrevented
      @selectedV = null
      @drawEdgeMode = false
      @draw(svg)
    )
    @setGraph g

  # Sets the underlying graph of this editor instance.
  setGraph: (@g) ->
    # This is true when the user is drawing a new edge.
    @drawEdgeMode = false

    # The currently selected vertex.
    @selectedV = null

    # Patch the vertices and edges to make them drawable.
    @g.VertexType = @g.VertexType.newTypeWithMixin VertexDrawableCircular
    @g.vertices = (new @g.VertexType(v) for v in @g.vertices)
    @g.EdgeType = @g.EdgeType.newTypeWithMixin EdgeDrawable
    @g.edges = (new @g.EdgeType(v) for v in @g.edges)

    # Make sure that the svg nodes we need are clean.
    @svg.select("#vertices").selectAll(".vertex").remove()
    @svg.select("#edges").selectAll(".edge").remove()

  drawVertices: ->
    vertices = @svg.select("#vertices").selectAll(".vertex").data(@g.getVertices())
    editor = this
    vertices.enter().append("g")
      .each((v) -> v.drawEnter(editor, d3.select(this)))
      .call(@drag)
      .on("click", (d) =>
        d3.event.stopPropagation()
        @selectedV = d
        @draw()
      )
      .on("dblclick", (d) =>
        d3.event.stopPropagation()
        @selectedV = d
        @drawEdgeMode = true
        @draw()
      )
      .on("mouseover", (d) =>
        if @drawEdgeMode and @selectedV != d
          e = new @g.EdgeType tail: @selectedV.id, head: d.id
          if @g.hasEdge e
            @g.removeEdge e
          else
            @g.addEdge e
          @drawEdgeMode = false
          @draw()
      )
    vertices.exit().remove()
    vertices.each((v) -> v.drawUpdate(editor, d3.select(this)))
    @drawCursor()
    d3.select("#info").text(JSON.stringify(@selectedV, undefined, 2))

  drawCursor: ->
    cursor = @svg.selectAll("#cursor").data([@g.getCursor()])
    cursor.enter().append("circle").attr("id", "cursor")
      .attr("r", "5")
      .style("pointer-events", "none")
    cursor
      .attr("cx", (d) -> d.x)
      .attr("cy", (d) -> d.y)

  drawEdges: ->
    edges = @svg.select("#edges").selectAll(".edge").data(@g.getEdges())
    editor = this
    edges.enter().append("g").each((e) -> e.drawEnter(editor, d3.select(this)))
    edges.exit().remove()
    edges.each((e) -> e.drawUpdate(editor, d3.select(this)))

    # Draw an edge from the selected node to the mouse cursor.
    if @drawEdgeMode
      pointer = @svg.selectAll(".edge.pointer").data([@mouse])
      pointer.enter().append("line").attr("class", "edge pointer")
      pointer
          .attr("x1", (d) => @selectedV.edgeAnchor(d).x)
          .attr("y1", (d) => @selectedV.edgeAnchor(d).y)
          .attr("x2", (d) -> d.x)
          .attr("y2", (d) -> d.y)
    else
      @svg.selectAll(".edge.pointer").remove()

  draw: ->
    #d3.select("#dump").text(graphToJSON(@g))
    editor = this
    @svg.on("mousemove", ->
      [editor.mouse.x, editor.mouse.y] = d3.mouse(this)
      if editor.drawEdgeMode
        editor.draw()
    )
    @drawEdges()
    @drawVertices()
