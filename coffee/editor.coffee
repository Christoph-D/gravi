# Mixin to draw a vertex with a circular shape.
class VertexDrawableCircular
  # Returns the coordinates of the endpoint of an adjacent edge from
  # the given other node.
  edgeAnchor: (otherNode, distanceOffset = 0) ->
    a = Math.atan2(@y - otherNode.y, @x - otherNode.x)
    return { x: @x - Math.cos(a) * (10 + distanceOffset), y: @y - Math.sin(a) * (10 + distanceOffset)}
  drawEnter: (editor, svgGroup) ->
    svgGroup.append("circle").attr("r", 10)
  drawUpdate: (editor, svgGroup) ->
    svgGroup.attr("class",
      "vertex " +
      @getHighlightClass() +
      (if editor.selection == this then " selected" else ""))
    svgGroup.selectAll("circle")
      .attr("cx", (d) -> d.x)
      .attr("cy", (d) -> d.y)

# Mixin to draw an edge with an arrow at its head.
class EdgeDrawable
  drawEnter: (editor, svgGroup) ->
    svgGroup.append("line")
    svgGroup.append("line").attr("class", "click-target")
    svgGroup.append("text")
  drawUpdate: (editor, svgGroup) ->
    s = @graph.vertices[@tail]
    t = @graph.vertices[@head]
    svgGroup.attr("class",
      "edge " +
      @getHighlightClass() +
      (if editor.selection == this then " selected" else ""))
    svgGroup.selectAll("line")
      .attr("x1", (d) -> s.edgeAnchor(t).x)
      .attr("y1", (d) -> s.edgeAnchor(t).y)
      .attr("x2", (d) -> t.edgeAnchor(s, 11).x)
      .attr("y2", (d) -> t.edgeAnchor(s, 11).y)
    if @letter?
      svgGroup.selectAll("text").text(@letter)
        .attr("x", (s.x + t.x) / 2 + 10)
        .attr("y", (s.y + t.y) / 2 - 10)
        .attr("font-family", "sans-serif")
        .attr("font-size", "20")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .style("stroke", "none")

class GraphEditor
  # This class may modify the graph @g.
  constructor: (g, @svg) ->
    # The current mouse position.
    @mouse = { x: 0, y: 0 }

    # Make vertices draggable.
    @drag = d3.behavior.drag()
      .on("dragstart", (d) =>
        d3.event.sourceEvent.stopPropagation()
        @selection = d
        @draw()
      )
      .on("drag", (d) =>
        d.x = d3.event.x
        d.y = d3.event.y
        @draw()
      )
    # Global click handler to deselect everything.
    @svg.on("click", =>
      return if d3.event.defaultPrevented
      @selection = null
      @drawEdgeMode = false
      @draw()
    )
    @setGraph g

  # Sets the underlying graph of this editor instance.
  setGraph: (@g) ->
    # This is true when the user is drawing a new edge.
    @drawEdgeMode = false

    # The currently selected vertex.
    @selection = null

    # Patch the vertices and edges to make them drawable.
    @g.VertexType = @g.VertexType.newTypeWithMixin VertexDrawableCircular
    newV = []
    for v in @g.vertices
      if v == null
        newV.push null
      else
        w = new @g.VertexType v
        w.onChangeLabel = @draw.bind(this)
        w.onChangeLetter = @draw.bind(this)
        newV.push w
    @g.vertices = newV
    @g.EdgeType = @g.EdgeType.newTypeWithMixin EdgeDrawable
    newE = []
    for e in @g.edges
      if e == null
        newE.push null
      else
        f = new @g.EdgeType e
        f.onChangeLetter = @draw.bind(this)
        newE.push f
    @g.edges = newE

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
        @selection = d
        @draw()
      )
      .on("dblclick", (d) =>
        d3.event.stopPropagation()
        @selection = d
        @drawEdgeMode = true
        @draw()
      )
      .on("mouseover", (d) =>
        if @drawEdgeMode and @selection != d
          e = new @g.EdgeType tail: @selection.id, head: d.id
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
    d3.select("#info2").text(JSON.stringify(vertexOrEdgeToJSONCompatible(@selection), undefined, 2))
    if @oldSelection != @selection
      d3.selectAll("#info *").remove()
      @selection?.appendPropertiesToDom(d3.select("#info"))
    @oldSelection = @selection

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
      .on("click", (d) =>
        d3.event.stopPropagation()
        @selection = d
        @draw()
      )
    edges.exit().remove()
    edges.each((e) -> e.drawUpdate(editor, d3.select(this)))

    # Draw an edge from the selected node to the mouse cursor.
    if @drawEdgeMode
      pointer = @svg.selectAll(".edge.pointer").data([@mouse])
      pointer.enter().append("line").attr("class", "edge pointer")
      pointer
          .attr("x1", (d) => @selection.edgeAnchor(d).x)
          .attr("y1", (d) => @selection.edgeAnchor(d).y)
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
