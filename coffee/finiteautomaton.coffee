G = require "./graph"
CustomProperty = require "./customproperty"
require "./simplegraph"

class G.FiniteAutomaton extends G.SimpleGraph
  name: "FiniteAutomaton"

  accepting =
    name: "accepting"
    type: "boolean"
    defaultValue: false
    drawEnter: (editor, svgGroup) ->
      svgGroup.append("circle").attr("class", "accepting accepting1").attr("r", @radius - 1)
      svgGroup.append("circle").attr("class", "accepting accepting2").attr("r", @radius - 4)
    drawUpdate: (editor, svgGroup) ->
      if @accepting
        opacity = 1
      else
        opacity = 0
      svgGroup.selectAll("circle.accepting")
        .attr("cx", @x)
        .attr("cy", @y)
        .style("stroke-opacity", opacity)
  letter =
    name: "letter"
    type: "string"
    defaultValue: ""
    drawEnter: (editor, svgGroup) ->
      svgGroup.append("rect").attr("class", "letter")
        .attr("fill", "#FFFFFF")
        .attr("stroke", "none")
      svgGroup.append("text").attr("class", "letter")
        .attr("font-family", "sans-serif")
        .attr("font-size", "20")
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
    drawUpdate: (editor, svgGroup) ->
      if @letter == ""
        svgGroup.selectAll(".letter").attr("visibility", "hidden")
        return
      svgGroup.selectAll(".letter").attr("visibility", "visible")
      s = @graph.vertices[@tail]
      t = @graph.vertices[@head]
      svgGroup.selectAll("text.letter")
        .text(@letter)
        .attr("x", (s.x + t.x) / 2)
        .attr("y", (s.y + t.y) / 2)
      rectSize = 20
      svgGroup.selectAll("rect.letter")
        .attr("x", (s.x + t.x - rectSize) / 2)
        .attr("y", (s.y + t.y - rectSize) / 2)
        .attr("width", rectSize)
        .attr("height", rectSize)
  constructor: (options = {}) ->
    options.VertexType = CustomProperty.add(options.VertexType ? G.Vertex, accepting)
    options.EdgeType = CustomProperty.add(options.EdgeType ? G.Edge, letter)
    options.EdgeType::onChangeLetter = -> @onRedrawNeeded?()
    options.VertexType::onChangeAccepting = -> @onRedrawNeeded?()
    super options
