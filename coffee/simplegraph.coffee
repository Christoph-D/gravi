define [ "./graph" ], (G) ->
  G.circleEdgeAnchor = (s, t, distance) ->
    result = x: s.x, y: s.y
    if distance != 0 and (s.x != t.x or s.y != t.y)
      dx = s.x - t.x
      dy = s.y - t.y
      D = Math.sqrt(dx * dx + dy * dy)
      result.x -= dx / D * distance
      result.y -= dy / D * distance
    return result

  class G.VertexDrawableDefault
    drawEnter: (editor, svgGroup) ->
      @eachProperty (p) => p.drawEnter?.call this, editor, svgGroup
    drawUpdate: (editor, svgGroup) ->
      @eachProperty (p) => p.drawUpdate?.call this, editor, svgGroup

  # Mixin to draw a vertex with a circular shape.
  class G.VertexDrawableCircular extends G.VertexDrawableDefault
    radius: 10
    edgeAnchor: (otherNode, distanceOffset = 0) ->
      G.circleEdgeAnchor this, otherNode, distanceOffset + @radius
    drawEnter: (editor, svgGroup) ->
      svgGroup.append("circle").attr("class", "main").attr("r", @radius)
      super
    drawUpdate: (editor, svgGroup) ->
      svgGroup.attr("class", "vertex " + @getHighlightClass())
      svgGroup.selectAll("circle.main")
        .classed("selected", editor.selection == this)
        .attr("cx", @x)
        .attr("cy", @y)
      super

  class G.EdgeDrawableDefault
    drawEnter: (editor, svgGroup) ->
      @eachProperty (p) => p.drawEnter?.call this, editor, svgGroup
    drawUpdate: (editor, svgGroup) ->
      @eachProperty (p) => p.drawUpdate?.call this, editor, svgGroup

  # Mixin to draw an edge with an arrow at its head.
  class G.EdgeDrawable extends G.EdgeDrawableDefault
    drawEnter: (editor, svgGroup) ->
      svgGroup.append("line").attr("class", "main")
      svgGroup.append("line").attr("class", "click-target")
      super
    drawUpdate: (editor, svgGroup) ->
      s = @graph.vertices[@tail]
      t = @graph.vertices[@head]
      anchorS = s.edgeAnchor(t)
      anchorT = t.edgeAnchor(s, 10)
      svgGroup.attr("class", "edge " + @getHighlightClass())
      svgGroup.selectAll("line.main").classed("selected", editor.selection == this)
      svgGroup.selectAll("line.main, line.click-target")
        .attr("x1", anchorS.x)
        .attr("y1", anchorS.y)
        .attr("x2", anchorT.x)
        .attr("y2", anchorT.y)
      super

  class G.SimpleGraph extends G.Graph
    @version = "0.1"

    constructor: (options = {}) ->
      options.VertexType ?= G.Vertex
      options.VertexType = options.VertexType.newTypeWithMixin(G.VertexDrawableCircular)
      options.VertexType::onChangeLabel = -> @onRedrawNeeded?()
      options.EdgeType ?= G.Edge
      options.EdgeType = options.EdgeType.newTypeWithMixin(G.EdgeDrawable)
      super options

  return G
