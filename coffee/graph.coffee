class Node
  constructor: (options) ->
    {@label, @x, @y} = options
    @out_neighbors_ids = []
    @in_neighbors_ids = []
  add_out_edge: (node) -> @out_neighbors_ids.push(node)
  add_in_edge: (node) -> @in_neighbors_ids.push(node)
  out_neighbors: -> @g.nodes[id] for id in @out_neighbors_ids
  in_neighbors: -> @g.nodes[id] for id in @in_neighbors_ids

class Edge

class Graph
  constructor: ->
    @nodes = []
  add_vertex: (node) ->
    node.graph = this
    node.id = @nodes.length
    @nodes.push(node)
  add_edge: (s, t) ->
    @nodes[s].add_out_edge(t)
    @nodes[t].add_in_edge(s)
  edges: ->
    [].concat (([id, t] for t in out_neighbors_ids) for { id, out_neighbors_ids } in @nodes)...
  draw_nodes: (svg) ->
    drag = d3.behavior.drag()
      .on("drag", (d) =>
        d.x = d3.event.x
        d.y = d3.event.y
        @draw(svg)
      )
    nodes = svg.selectAll(".node").data(@nodes)
    nodes.enter().append("circle").attr("class", "node")
      .style("fill", "#8888FF")
      .style("stroke", "black")
      .attr("r", 10)
      .call(drag)
    nodes
      .attr("cx", (d) -> d.x)
      .attr("cy", (d) -> d.y)
  draw_edges: (svg) ->
    edges = svg.selectAll(".edge").data(@edges())
    edges.enter().append("line").attr("class", "edge")
      .style("stroke", "black")
      .style("stroke-width", "1.5px")
    edges
      .attr("x1", (d) => @nodes[d[0]].x)
      .attr("y1", (d) => @nodes[d[0]].y)
      .attr("x2", (d) => @nodes[d[1]].x)
      .attr("y2", (d) => @nodes[d[1]].y)
  draw: (svg) ->
    d3.select("#dump").text(@to_string())
    @draw_edges(svg)
    @draw_nodes(svg)
  to_string: ->
    n.graph = undefined for n in @nodes
    result = JSON.stringify(this)
    n.graph = this for n in @nodes
    return result
  clone: ->
    g = new Graph
    # ...
    return g

class FiniteAutomaton extends Graph
