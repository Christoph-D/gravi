`define(function(require){`

G = require './historygraph'

# A GraphEditor expects vertices and edges to offer the methods
# drawEnter() and drawUpdate().  It calls drawEnter() once on every
# new vertex/edge and drawUpdate() every time a redraw is needed.
#
# It also excepts vertices and edges to *not* have a method
# onRedrawNeeded because GraphEditor will add this method under the
# expectation that it will be called whenever something changes.

class G.GraphEditor
  # Changing stroke-color etc. on edges does not affect the marker
  # (the arrow head).  In order to affect the marker, we need
  # different markers for each possible edge highlight.  Highlighting
  # an edge then amounts to changing the css class of the edge, which
  # selects the correct marker.
  addHighlightedMarkers = (svg) ->
    # Markers have to be defined once in <defs> in the svg.
    defs = svg.append("defs")
    newMarker = ->
      marker = defs.append("marker").attr("id", "edgeArrow")
        .attr("viewBox", "0 0 10 10")
        .attr("refX", "2").attr("refY", "5")
        .attr("markerUnits", "userSpaceOnUse")
        .attr("markerWidth", "20").attr("markerHeight", "14")
        .attr("orient", "auto")
      # An arrow head.
      marker.append("path").attr("d", "M 0 0 L 10 5 L 0 10 z")
      marker
    # Create one marker without highlights.
    newMarker()
    # Create markers for all possible edge highlights.
    for i in [1..2]
      newMarker()
        .attr("id", "edgeArrowHighlight#{i}")
        .attr("class", "highlight#{i}")

  constructor: (g, @svg) ->
    # The current mouse position.
    @mouse = x: 0, y: 0

    @svg.selectAll("*").remove()
    addHighlightedMarkers(@svg)
    # Append the vertices after the edges or the click targets of
    # edges would obscure the vertices.
    @svg.append("g").attr("id", "edges")
    @svg.append("g").attr("id", "vertices")

    # The drag behavior for the vertices.
    isLeftClickDrag = false
    @drag = d3.behavior.drag()
      .on("dragstart", (d) =>
        isLeftClickDrag = d3.event.sourceEvent.which == 1
        return unless isLeftClickDrag
        @select(d)
        @draw())
      .on("drag", (d) =>
        # No dragging except on left clicks.
        return unless isLeftClickDrag
        # Update the vertex position.
        d.x = d3.event.x
        d.y = d3.event.y
        # Invalidate the incident edges because the vertex moved.
        d.edgesModified()
        @draw())
    # Global click handler to deselect everything.
    @svg.on("click", =>
      @select(null)
      @drawEdgeMode = false
      @draw())
    @svg.on("contextmenu", =>
    # Global click handler to create new vertices on right click.
      d3.event.stopPropagation()
      d3.event.preventDefault()
      v = new @g.VertexType x: @mouse.x, y: @mouse.y
      @g.addVertex(v)
      if @drawEdgeMode
        e = new @g.EdgeType tail: @selection.id, head: v.id
        @g.addEdge e
        @drawEdgeMode = false
      @draw())
    # Global mousemove handler to keep track of the mouse.
    editor = this
    @svg.on("mousemove", ->
      [editor.mouse.x, editor.mouse.y] = d3.mouse(this)
      if editor.drawEdgeMode
        editor.drawPointer())
    @setGraph g

  # Sets the underlying graph of this editor instance.
  setGraph: (g) ->
    if @g == g
      return
    @g = g
    # This is true when the user is drawing a new edge.
    @drawEdgeMode = false
    @select(null)
    if @g.VertexType::onRedrawNeeded?
      throw TypeError("VertexType already has onRedrawNeeded. Cowardly refusing to override it.")
    if @g.EdgeType::onRedrawNeeded?
      throw TypeError("EdgeType already has onRedrawNeeded. Cowardly refusing to override it.")
    @g.VertexType::onRedrawNeeded = @draw.bind(this)
    @g.EdgeType::onRedrawNeeded = @draw.bind(this)

    # Rid the svg of previous clutter (keep the <defs>).
    @svg.selectAll("#vertices > *").remove()
    @svg.selectAll("#edges > *").remove()

  select: (vertexOrEdge) ->
    # Mark the previous selection as modified so that we redraw it
    # without the selection marker.
    @selection?.modified = true
    @selection = vertexOrEdge
    @selection?.modified = true

  totalSteps: -> @g.totalSteps
  currentStep: (step) ->
    if arguments.length == 0
      return @g.currentStep
    # If the current step changes, every vertex and edge could change
    # their highlight.
    if step != @g.currentStep
      for v in @g.getVertices()
        v.modified = true
      for e in @g.getEdges()
        e.modified = true
    @g.currentStep = step

  onClickVertex = (d) ->
    d3.event.stopPropagation()
    @select(d)
    @draw()
  onDoubleClickVertex = (d) ->
    d3.event.stopPropagation()
    @select(d)
    @drawEdgeMode = true
    @draw()
  onRightClickVertex = (d) ->
    d3.event.stopPropagation()
    d3.event.preventDefault()
    @drawEdgeMode = false
    @g.removeVertex(d)
    @g.compressIds()
    @draw()
  onMouseOverVertex = (d) ->
    if @drawEdgeMode and @selection != d
      e = new @g.EdgeType tail: @selection.id, head: d.id
      if @g.hasEdge e
        @g.removeEdge e
        @g.compressIds()
      else
        @g.addEdge e
      @drawEdgeMode = false
      @draw()
  drawVertices: ->
    vertices = @svg.select("#vertices").selectAll(".vertex").data(@g.getVertices())
    editor = this
    # For each new vertex, add a <g> element to the svg, call
    # drawEnter() and install the handlers.
    vertices.enter().append("g")
      .each((v) -> v.drawEnter(editor, d3.select(this)))
      .call(@drag)
      .on("click", onClickVertex.bind(this))
      .on("dblclick", onDoubleClickVertex.bind(this))
      .on("contextmenu", onRightClickVertex.bind(this))
      .on("mouseover", onMouseOverVertex.bind(this))
    vertices.exit().remove()
    vertices.each((v) ->
      if v.modified
        v.drawUpdate(editor, d3.select(this))
        v.modified = false)

    @drawCursor()

    if @selection != null
      d3.select("#info2").text(JSON.stringify(G.vertexOrEdgeToJSON(@selection), undefined, 2))
      if @oldSelection != @selection
        d3.selectAll("#info *").remove()
        @selection?.appendPropertiesToDom(d3.select("#info"))
    else if @oldSelection != @selection
      d3.selectAll("#info *").remove()
      d3.select("#info2").text("")
    @oldSelection = @selection

  drawCursor: ->
    if @g.getCursor() == null
      @svg.selectAll("#cursor").data([]).exit().remove()
      return
    cursor = @svg.selectAll("#cursor").data([@g.getCursor()])
    cursor.enter().append("circle").attr("id", "cursor")
      .attr("r", "5")
      # Make the cursor transparent to mouse clicks.
      .style("pointer-events", "none")
    cursor
      .attr("cx", (d) -> d.x)
      .attr("cy", (d) -> d.y)

  onClickEdge = (d) ->
    d3.event.stopPropagation()
    @select(d)
    @draw()
  checkRedrawEdge = (e) ->
    if e.modified
      e.drawUpdate(editor, d3.select(this))
      e.modified = false
  drawEdges: ->
    edges = @svg.select("#edges").selectAll(".edge").data(@g.getEdges())
    editor = this
    edges.enter().append("g").each((e) -> e.drawEnter(editor, d3.select(this)))
      .on("click", onClickEdge.bind(this))
    edges.exit().remove()
    edges.each(checkRedrawEdge)
    @

  drawPointer: ->
    # Draw an edge from the selected node to the mouse cursor.
    if @drawEdgeMode
      pointer = @svg.selectAll(".edge.pointer").data([null])
      pointer.enter().append("line").attr("class", "edge pointer")
      edgeAnchorS = @selection.edgeAnchor @mouse
      edgeAnchorT = G.circleEdgeAnchor @mouse, @selection, 7
      pointer
          .attr("x1", edgeAnchorS.x)
          .attr("y1", edgeAnchorS.y)
          .attr("x2", edgeAnchorT.x)
          .attr("y2", edgeAnchorT.y)
    else
      @svg.selectAll(".edge.pointer").remove()
    @

  draw: ->
    @drawEdges()
    @drawPointer()
    @drawVertices()
    @

`})`
