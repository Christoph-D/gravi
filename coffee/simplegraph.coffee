G = require "./graph"

G.circleEdgeAnchor = (s, t, distance) ->
  result = x: s.x, y: s.y
  if distance != 0 and (s.x != t.x or s.y != t.y)
    dx = s.x - t.x
    dy = s.y - t.y
    D = Math.sqrt(dx * dx + dy * dy)
    result.x -= dx / D * distance
    result.y -= dy / D * distance
  return result

# Computes and sets the CSS class of a vertex or an edge.
setCSSClass = (editor, svgGroup) ->
  c = [ @defaultCSSClass, @highlight.getCSSClass() ]
  if editor.selection == this
    c.push("selected")
  # We cannot cache the CSS class because d3 reuses <g> elements.
  svgGroup.attr("class", c.join(" "))

class G.VertexDrawableDefault
  drawEnter: (editor, svgGroup) ->
  drawUpdate: (editor, svgGroup) -> @setCSSClass(editor, svgGroup)
  @::setCSSClass = setCSSClass
  @::defaultCSSClass = "vertex"

# Mixin to draw a vertex with a circular shape.
class G.VertexDrawableCircular extends G.VertexDrawableDefault
  radius: 10
  edgeAnchor: (otherNode, distanceOffset = 0) ->
    G.circleEdgeAnchor this, otherNode, distanceOffset + @radius
  drawEnter: (editor, svgGroup) ->
    svgGroup.append("circle").attr("class", "main").attr("r", @radius)
    super
  drawUpdate: (editor, svgGroup) ->
    svgGroup.selectAll("circle.main")
      .attr("cx", @x)
      .attr("cy", @y)
    super

class G.EdgeDrawableDefault
  # Same behavior as default vertices.
  @::drawEnter = G.VertexDrawableDefault::drawEnter
  @::drawUpdate = G.VertexDrawableDefault::drawUpdate
  @::setCSSClass = setCSSClass
  @::defaultCSSClass = "edge"

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
    # Don't draw edges pointing in the inverse direction.
    xSign = if s.x > t.x then -1 else 1
    ySign = if s.y > t.y then -1 else 1
    xSign2 = if anchorS.x >= anchorT.x then -1 else 1
    ySign2 = if anchorS.y >= anchorT.y then -1 else 1
    if xSign != xSign2 and ySign != ySign2
      svgGroup.selectAll("line.main, line.click-target")
        .attr("visibility", "hidden")
    else
      svgGroup.selectAll("line.main, line.click-target")
        .attr("visibility", "visible")
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
    options.VertexType.onStatic("changeLabel", -> @dispatch("redrawNeeded"))
    options.EdgeType ?= G.Edge
    options.EdgeType = options.EdgeType.newTypeWithMixin(G.EdgeDrawable)
    super options

return G
