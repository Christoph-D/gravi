#= require SimpleGraph

class VertexDrawableParity
  # The radius for circles is a little larger than for rectangles so
  # that the area of the shape is the same.
  radiusC = 11.28
  radiusR = 10
  circle = "M #{radiusC},0 A #{radiusC},#{radiusC} 0 1,0 #{radiusC},0.00001 z"
  rectangle = "M -#{radiusR},-#{radiusR} v #{radiusR*2} h #{radiusR*2} v -#{radiusR*2} z"

  edgeAnchor: (otherNode, distanceOffset = 0) ->
    if @x == otherNode.x and @y == otherNode.y
      return x: @x, y: @y
    if @player0
      circleEdgeAnchor this, otherNode, distanceOffset + radiusC
    else
      # Calculate the intersection between the line this -> otherNode
      # and a square of width 2*radius centered at otherNode.
      dx = otherNode.x - @x
      dy = otherNode.y - @y
      s = dy / dx
      result =
        if s <= -1 or s >= 1
          if otherNode.y < @y # top edge
            x: @x - radiusR / s
            y: @y - radiusR
          else # bottom edge
            x: @x + radiusR / s
            y: @y + radiusR
        else
          if otherNode.x < @x # left edge
            x: @x - radiusR
            y: @y - radiusR * s
          else # right edge
            x: @x + radiusR
            y: @y + radiusR * s
      # If requested, set back the endpoint a little.
      if distanceOffset != 0
        D = Math.sqrt(dx * dx + dy * dy)
        result.x += dx / D * distanceOffset
        result.y += dy / D * distanceOffset
      result
  drawEnter: (editor, svgGroup) ->
    svgGroup.append("path").attr("class", "main")
  drawUpdate: (editor, svgGroup) ->
    svgGroup.attr("class", "vertex " + @getHighlightClass())
    svgGroup.selectAll("path.main")
      .classed("selected", editor.selection == this)
      .attr("d", if @player0 then circle else rectangle)
      .attr("transform", "translate(#{@x},#{@y})")

class ParityGame extends Graph
  player0 =
    name: "player0"
    type: "boolean"
    value: false
    drawEnter: (editor, svgGroup) ->
      svgGroup.append("path").attr("class", "vertex")
    drawUpdate: (editor, svgGroup) ->
      if @player0
        opacity = 1
      else
        opacity = 0
      svgGroup.selectAll("circle.accepting")
        .attr("cx", @x)
        .attr("cy", @y)
        .style("stroke-opacity", opacity)
  priority =
    name: "priority"
    type: "number"
    value: 0
    drawEnter: (editor, svgGroup) ->
      svgGroup.append("text").attr("class", "priority")
    drawUpdate: (editor, svgGroup) ->
  constructor: (options = {}) ->
    options.VertexType ?= Vertex
    options.VertexType = addCustomProperty(options.VertexType, player0)
    options.VertexType = addCustomProperty(options.VertexType, priority)
    options.VertexType = options.VertexType.newTypeWithMixin(VertexDrawableParity)
    options.VertexType::onChangePlayer0 = ->
      @edgesModified()
      @onRedrawNeeded?()
    options.VertexType::onChangePriority = -> @onRedrawNeeded?()
    options.EdgeType ?= Edge
    options.EdgeType = options.EdgeType.newTypeWithMixin(EdgeDrawable)
    super options
