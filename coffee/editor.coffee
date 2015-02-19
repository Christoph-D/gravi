#= require Graph

class GraphEditor
  # This class may modify the graph @g.
  constructor: (g, @svg) ->
    # The current mouse position.
    @mouse = x: 0, y: 0

    # The drag behavior for the vertices.
    @drag = d3.behavior.drag()
      .on("dragstart", (d) =>
        d3.event.sourceEvent.stopPropagation()
        @selection?.modified = true
        @selection = d
        @draw()
      )
      .on("drag", (d) =>
        d.x = d3.event.x
        d.y = d3.event.y
        for e in d.outEdges()
          e.modified = true
        for e in d.inEdges()
          e.modified = true
        @draw()
      )
    # Global click handler to deselect everything.
    @svg.on("click", =>
      @selection?.modified = true
      @selection = null
      @drawEdgeMode = false
      @draw())
    @svg.on("contextmenu", =>
      d3.event.stopPropagation()
      d3.event.preventDefault()
      v = new @g.VertexType x: @mouse.x, y: @mouse.y
      @g.addVertex(v)
      if @drawEdgeMode
        e = new @g.EdgeType tail: @selection.id, head: v.id
        @g.addEdge e
        @drawEdgeMode = false
      @draw())
    @setGraph g

  # Sets the underlying graph of this editor instance.
  setGraph: (g) ->
    if @g == g
      return
    @g = g
    # This is true when the user is drawing a new edge.
    @drawEdgeMode = false
    # The currently selected vertex or edge.
    @selection?.modified = true
    @selection = null
    if @g.VertexType::onRedrawNeeded?
      throw TypeError("VertexType already has onRedrawNeeded. Cowardly refusing to override it.")
    if @g.EdgeType::onRedrawNeeded?
      throw TypeError("EdgeType already has onRedrawNeeded. Cowardly refusing to override it.")
    @g.VertexType::onRedrawNeeded = @draw.bind(this)
    @g.EdgeType::onRedrawNeeded = @draw.bind(this)

  totalSteps: -> @g.totalSteps
  currentStep: (step) ->
    if arguments.length == 0
      return @g.currentStep
    # If the current step changes, every edge could change their
    # highlight.
    if step != @g.currentStep
      for e in @g.getEdges()
        e.modified = true
    @g.currentStep = step

  drawVertices: ->
    vertices = @svg.select("#vertices").selectAll(".vertex").data(@g.getVertices())
    editor = this
    vertices.enter().append("g")
      .each((v) -> v.drawEnter(editor, d3.select(this)))
      .call(@drag)
      .on("click", (d) =>
        d3.event.stopPropagation()
        @selection?.modified = true
        @selection = d
        @draw()
      )
      .on("dblclick", (d) =>
        d3.event.stopPropagation()
        @selection?.modified = true
        @selection = d
        @drawEdgeMode = true
        @draw()
      )
      .on("contextmenu", (d) =>
        d3.event.stopPropagation()
        d3.event.preventDefault()
        @drawEdgeMode = false
        @g.removeVertex(d)
        @g.compressIds()
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
    if @g.getCursor() == null
      @svg.selectAll("#cursor").data([]).exit().remove()
      return
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
        @selection?.modified = true
        @selection = d
        d.modified = true
        @draw()
      )
    edges.exit().remove()
    edges.each((e) ->
      if e.modified
        e.drawUpdate(editor, d3.select(this))
        e.modified = false)

    # Draw an edge from the selected node to the mouse cursor.
    if @drawEdgeMode
      pointer = @svg.selectAll(".edge.pointer").data([null])
      pointer.enter().append("line").attr("class", "edge pointer")
      pointer
          .attr("x1", @selection.edgeAnchor(@mouse).x)
          .attr("y1", @selection.edgeAnchor(@mouse).y)
          .attr("x2", @mouse.x)
          .attr("y2", @mouse.y)
    else
      @svg.selectAll(".edge.pointer").remove()

  draw: ->
    editor = this
    @svg.on("mousemove", ->
      [editor.mouse.x, editor.mouse.y] = d3.mouse(this)
      if editor.drawEdgeMode
        editor.draw()
    )
    @drawEdges()
    @drawVertices()
