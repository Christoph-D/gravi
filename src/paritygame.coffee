G = require "./graph"
require "./simplegraph"
CustomProperty = require "./customproperty"

# Vertex mixin.  Draws a vertex either as a rectangle (player 1) or as
# a circle (player 0).  Also draws the priority inside the vertex.
class VertexDrawableParity extends G.VertexDrawableDefault
  # The radius for circles is a little larger than for rectangles so
  # that the area of the shape is the same.
  _radiusR: 11
  _radiusC: Math.round(@::_radiusR * 100 * Math.sqrt(4 / Math.PI)) / 100
  # SVG paths.
  _rectangle: "M -#{@::_radiusR},-#{@::_radiusR} v #{@::_radiusR*2} h #{@::_radiusR*2} v -#{@::_radiusR*2} z"
  _circle: "M #{@::_radiusC},0 A #{@::_radiusC},#{@::_radiusC} 0 1,0 #{@::_radiusC},0.00001 z"

  edgeAnchor: (otherNode, distanceOffset = 0) ->
    if @x == otherNode.x and @y == otherNode.y
      return x: @x, y: @y
    if @player0
      G.circleEdgeAnchor this, otherNode, distanceOffset + @_radiusC
    else
      # Calculate the intersection between the line this -> otherNode
      # and a square of width 2*@_radiusR centered at otherNode.
      dx = otherNode.x - @x
      dy = otherNode.y - @y
      s = dy / dx
      result =
        if s <= -1 or s >= 1
          if otherNode.y < @y # top edge
            x: @x - @_radiusR / s
            y: @y - @_radiusR
          else # bottom edge
            x: @x + @_radiusR / s
            y: @y + @_radiusR
        else
          if otherNode.x < @x # left edge
            x: @x - @_radiusR
            y: @y - @_radiusR * s
          else # right edge
            x: @x + @_radiusR
            y: @y + @_radiusR * s
      # If requested, set back the endpoint a little.
      if distanceOffset != 0
        D = Math.sqrt(dx * dx + dy * dy)
        result.x += dx / D * distanceOffset
        result.y += dy / D * distanceOffset
      result
  drawEnter: (editor, svgGroup) ->
    svgGroup.append("path").attr("class", "main")
    svgGroup.append("text").attr("class", "priority")
      .attr("font-family", "sans-serif")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("cursor", "default")
      .style("fill", "#FFFFFF")
      .style("stroke", "none")
  drawUpdate: (editor, svgGroup) ->
    @setCSSClass(editor, svgGroup)
    svgGroup.attr("transform", "translate(#{@x},#{@y})")
    svgGroup.select("path.main").attr("d", if @player0 then @_circle else @_rectangle)
    priority = svgGroup.select("text.priority").text(@priority)
    if @priority >= 10 or @priority < 0
      priority.attr("font-size", "15")
    else
      priority.attr("font-size", "20")

class G.ParityGame extends G.Graph
  name: "ParityGame"

  player0 =
    name: "player0"
    type: "boolean"
    defaultValue: false

  priority =
    name: "priority"
    type: "number"
    defaultValue: 0

  init: ->
    @VertexType = CustomProperty.addMany(@VertexType, [player0, priority])
    @VertexType = @VertexType.newTypeWithMixin(VertexDrawableParity)

    @VertexType.onStatic "changePlayer0", ->
      @markIncidentEdgesModified()
      @dispatch("redrawNeeded")
    @VertexType.onStatic("changePriority", -> @dispatch("redrawNeeded"))

    @EdgeType = @EdgeType.newTypeWithMixin(G.EdgeDrawable)

return G
