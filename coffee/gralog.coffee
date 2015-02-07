#= require Graph

width = 1000
height = 500
svg = d3.select("body").append("svg").attr("width", width).attr("height", height)
  .style("outline", "thin solid black")

g = new Graph
g.add_vertex(new Node label: 1, x: 50, y: 50)
g.add_vertex(new Node label: 2, x: 100, y: 50)
g.add_vertex(new Node label: 3, x: 30, y: 70)
g.add_edge(0, 1)

g.draw(svg)
