#= require Graph

width = 700
height = 300
svg = d3.select("body").append("svg").attr("width", width).attr("height", height)
  .style("outline", "thin solid black")
d3.select("body").append("pre").attr("id", "dump")

s = '{"vertices":[{"outE":[0],"inE":[],"id":0,"x":405,"y":182},{"outE":[],"inE":[0],"id":1,"x":110,"y":27},{"outE":[],"inE":[],"id":2,"x":344,"y":102}],"edges":[{"tail":0,"head":1,"id":0}]}'

g = graphFromJSON(s)
g.draw(svg)
