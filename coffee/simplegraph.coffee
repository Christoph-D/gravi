`define(function(require){`

G = require './graph'

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
  c = @getHighlightClass()
  if editor.selection == this
    c += " selected"
  if c != @_lastCSSClass # .attr() is expensive
    svgGroup.attr("class", c)
  @_lastCSSClass = c

class G.VertexDrawableDefault
  # Delegate everything to the custom properties.
  drawEnter: (editor, svgGroup) ->
    @eachProperty (p) => p.drawEnter?.call this, editor, svgGroup
  drawUpdate: (editor, svgGroup) ->
    @setCSSClass(editor, svgGroup)
    @eachProperty (p) => p.drawUpdate?.call this, editor, svgGroup
  @::setCSSClass = setCSSClass

# Mixin to draw a vertex with a circular shape.
class G.VertexDrawableCircular extends G.VertexDrawableDefault
  radius: 10
  edgeAnchor: (otherNode, distanceOffset = 0) ->
    G.circleEdgeAnchor this, otherNode, distanceOffset + @radius
  drawEnter: (editor, svgGroup) ->
    svgGroup.append("circle").attr("class", "main").attr("r", @radius)
    super
  drawUpdate: (editor, svgGroup) ->
    @setCSSClass(editor, svgGroup)
    svgGroup.selectAll("circle.main")
      .attr("cx", @x)
      .attr("cy", @y)
    super

G.EdgeDrawableDefault = G.VertexDrawableDefault

# Mixin to draw an edge with an arrow at its head.
class G.EdgeDrawable extends G.EdgeDrawableDefault
  drawEnter: (editor, svgGroup) ->
    svgGroup.append("line").attr("class", "main")
    svgGroup.append("line").attr("class", "click-target")
    super
  drawUpdate: (editor, svgGroup) ->
    @setCSSClass(editor, svgGroup)
    s = @graph.vertices[@tail]
    t = @graph.vertices[@head]
    anchorS = s.edgeAnchor(t)
    anchorT = t.edgeAnchor(s, 10)
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

`})`
