#= require SimpleGraph

class VertexDrawableParity
  edgeAnchor: (otherNode, distanceOffset = 0) ->
    VertexDrawableDefault.edgeAnchor.call this, otherNode, distanceOffset + 10
  drawEnter: (editor, svgGroup) ->
    svgGroup.append("path").attr("class", "main")
  drawUpdate: (editor, svgGroup) ->
    svgGroup.attr("class", "vertex " + @getHighlightClass())
    svgGroup.selectAll("path.main")
      .classed("selected", editor.selection == this)
      .attr("d", "")

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
    super options
