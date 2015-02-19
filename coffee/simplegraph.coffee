#= require Graph
#= require <customproperty.coffee>

class VertexDrawableDefault
  # Returns the coordinates of the endpoint of an adjacent edge from
  # the given other node.
  edgeAnchor: (otherNode, distanceOffset = 0) ->
    a = Math.atan2(@y - otherNode.y, @x - otherNode.x)
    return { x: @x - Math.cos(a) * distanceOffset, y: @y - Math.sin(a) * distanceOffset}
  drawEnter: (editor, svgGroup) ->
    @eachProperty (p) => p.drawEnter?.call this, editor, svgGroup
  drawUpdate: (editor, svgGroup) ->
    @eachProperty (p) => p.drawUpdate?.call this, editor, svgGroup

# Mixin to draw a vertex with a circular shape.
class VertexDrawableCircular extends VertexDrawableDefault
  edgeAnchor: (otherNode, distanceOffset = 0) -> super(otherNode, distanceOffset + 10)
  drawEnter: (editor, svgGroup) ->
    svgGroup.append("circle").attr("class", "main").attr("r", 10)
    super
  drawUpdate: (editor, svgGroup) ->
    svgGroup.attr("class", "vertex " + @getHighlightClass())
    svgGroup.selectAll("circle.main")
      .classed("selected", editor.selection == this)
      .attr("cx", @x)
      .attr("cy", @y)
    super

class EdgeDrawableDefault
  drawEnter: (editor, svgGroup) ->
    @eachProperty (p) => p.drawEnter?.call this, editor, svgGroup
  drawUpdate: (editor, svgGroup) ->
    @eachProperty (p) => p.drawUpdate?.call this, editor, svgGroup

# Mixin to draw an edge with an arrow at its head.
class EdgeDrawable extends EdgeDrawableDefault
  drawEnter: (editor, svgGroup) ->
    svgGroup.append("line").attr("class", "main")
    svgGroup.append("line").attr("class", "click-target")
    super
  drawUpdate: (editor, svgGroup) ->
    s = @graph.vertices[@tail]
    t = @graph.vertices[@head]
    svgGroup.attr("class", "edge " + @getHighlightClass())
    svgGroup.selectAll("line.main").classed("selected", editor.selection == this)
    svgGroup.selectAll("line.main, line.click-target")
      .attr("x1", s.edgeAnchor(t).x)
      .attr("y1", s.edgeAnchor(t).y)
      .attr("x2", t.edgeAnchor(s, 11).x)
      .attr("y2", t.edgeAnchor(s, 11).y)
    super

class SimpleGraph extends Graph
  constructor: (options = {}) ->
    options.VertexType ?= Vertex
    options.VertexType = options.VertexType.newTypeWithMixin(VertexDrawableCircular)
    options.VertexType::onChangeLabel = -> @onRedrawNeeded?()
    options.EdgeType ?= Edge
    options.EdgeType = options.EdgeType.newTypeWithMixin(EdgeDrawable)
    super options
