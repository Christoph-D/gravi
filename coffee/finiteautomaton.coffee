define [ "./graph", "./simplegraph" ], (G) ->
  class G.FiniteAutomaton extends G.SimpleGraph
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
        svgGroup.append("text").attr("class", "letter")
          .attr("font-family", "sans-serif")
          .attr("font-size", "20")
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .style("stroke", "none")
      drawUpdate: (editor, svgGroup) ->
        s = @graph.vertices[@tail]
        t = @graph.vertices[@head]
        dx = t.x - s.x
        dy = t.y - s.y
        D = Math.sqrt (dx * dx + dy * dy)
        dx /= D
        dy /= D
        svgGroup.selectAll("text.letter")
          .text(@letter)
          .attr("x", (s.x + t.x) / 2 + dy * 10)
          .attr("y", (s.y + t.y) / 2 - dx * 10)
    constructor: (options = {}) ->
      options.VertexType = addCustomProperty(options.VertexType ? Vertex, accepting)
      options.EdgeType = addCustomProperty(options.EdgeType ? Edge, letter)
      options.EdgeType::onChangeLetter = -> @onRedrawNeeded?()
      options.VertexType::onChangeAccepting = -> @onRedrawNeeded?()
      super options
