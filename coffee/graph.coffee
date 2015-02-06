drag = d3.behavior.drag().on("drag", (d) -> d3.select(this).attr("cx", d3.event.x).attr("cy", d3.event.y))

class Node
  constructor: (options) ->
    {@label, @x, @y} = options
    @out_neighbors = @in_neighbors = []
  add_out_edge: (node) -> @out_neighbors.push(node)
  add_in_edge: (node) -> @in_neighbors.push(node)

class Graph
  constructor: ->
    @nodes = []
  add_vertex: (node) ->
    node.graph = this
    @nodes.push(node)
  add_edge: (s, t) ->
    @nodes[s].add_out_edge(t)
    @nodes[t].add_in_edge(s)
  draw_nodes: (svg) ->
    svg.selectAll("circle.node")
      .data(@nodes)
      .enter().append("circle")
      .attr("class", "node")
      .attr("cx", (d) -> d.x)
      .attr("cy", (d) -> d.y)
      .style("fill", "#8888FF")
      .style("stroke", " black")
      .attr("r", 10)
      .call(drag)
  draw_edges: (svg) ->
  draw: (svg) ->
    this.draw_nodes(svg)
    this.draw_edges(svg)

class FiniteAutomaton extends Graph
