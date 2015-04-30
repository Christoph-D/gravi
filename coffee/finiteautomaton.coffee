G = require "./graph"
# For G.VertexDrawableCircular and G.EdgeDrawable
require "./simplegraph"

CustomProperty = require "./customproperty"

class VertexDrawableFiniteAutomaton extends G.VertexDrawableCircular
  drawEnter: (editor, svgGroup) ->
    super
    svgGroup.append("circle").attr("class", "accepting accepting1").attr("r", @radius - 1)
    svgGroup.append("circle").attr("class", "accepting accepting2").attr("r", @radius - 4)
  drawUpdate: (editor, svgGroup) ->
    super
    if @accepting
      opacity = 1
    else
      opacity = 0
    svgGroup.selectAll("circle.accepting")
      .attr("cx", @x)
      .attr("cy", @y)
      .style("stroke-opacity", opacity)

class EdgeDrawableFiniteAutomaton extends G.EdgeDrawable
  drawEnter: (editor, svgGroup) ->
    super
    svgGroup.append("rect").attr("class", "letter")
      .attr("fill", "#FFFFFF")
      .attr("stroke", "none")
    svgGroup.append("text").attr("class", "letter")
      .attr("font-family", "sans-serif")
      .attr("font-size", "20")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
  drawUpdate: (editor, svgGroup) ->
    super
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

class G.FiniteAutomaton extends G.Graph
  name: "FiniteAutomaton"

  accepting =
    name: "accepting"
    type: "boolean"
    defaultValue: false

  letter =
    name: "letter"
    type: "string"
    defaultValue: ""

  init: ->
    @VertexType = CustomProperty.add(@VertexType, accepting)
    @VertexType = @VertexType.newTypeWithMixin(VertexDrawableFiniteAutomaton)
    @VertexType.onStatic("changeAccepting", -> @dispatch("redrawNeeded"))

    @EdgeType = CustomProperty.add(@EdgeType, letter)
    @EdgeType = @EdgeType.newTypeWithMixin(EdgeDrawableFiniteAutomaton)
    @EdgeType.onStatic("changeLetter", -> @dispatch("redrawNeeded"))
