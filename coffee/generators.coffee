`define(function(require){`

G = require './graph'

G.generateRandomGraph = (n, p) ->
  g = new G.ParityGame
  for i in [0..n - 1]
    v = new g.VertexType
      x: -150 * Math.cos(2 * Math.PI / n * i) + 350
      y: 150 * Math.sin(2 * Math.PI / n * i) + 200
    v.player0 = Math.random() < 0.5
    v.priority = Math.round(Math.random() * 6)
    g.addVertex(v)
  for i in [0..n - 1]
    for j in [0..n - 1]
      continue if i == j or g.hasEdge(i, j) or g.hasEdge(j, i)
      if Math.random() < p
        g.addEdge(new g.EdgeType head: i, tail: j)
        #a = "a".charCodeAt(0)
        #b = "b".charCodeAt(0)
        #g.edges[g.edges.length - 1].letter = String.fromCharCode(Math.round(Math.random() * (b - a)) + a)
  return g

G.generatePath = (n) ->
  g = new G.Graph
  for i in [0..n - 1]
    v = new g.VertexType
      x: -200 * Math.cos(Math.PI / (n - 1) * i) + 350
      y: 200 * Math.sin(Math.PI / (n - 1) * i) + 100
    g.addVertex(v)
  for i in [0..n - 2]
    g.addEdge(new g.EdgeType tail: i, head: i + 1)
  return g

`})`
