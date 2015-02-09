#= require Graph

s = '{"vertices":[{"outE":[0],"inE":[],"id":0,"x":405,"y":182},{"outE":[],"inE":[0],"id":1,"x":110,"y":27},{"outE":[],"inE":[],"id":2,"x":344,"y":102}],"edges":[{"tail":0,"head":1,"id":0}]}'

g = graphFromJSON(s)
g.draw(d3.select("#graph"))
