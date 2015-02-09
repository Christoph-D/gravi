generateRandomGraph = (n, p) ->
  g = new Graph
  for i in [0..n - 1]
    g.addVertex(new Vertex)
    g.vertices[i].x = Math.random() * 500
    g.vertices[i].y = Math.random() * 300
  for i in [0..n - 1]
    for j in [0..n - 1]
      continue if i == j
      if Math.random() < p
        g.addEdge(new Edge head: i, tail: j)
  return g

generatePath = (n) ->
  g = new Graph
  for i in [0..n - 1]
    g.addVertex(new Vertex)
    g.vertices[i].x = 500 / n * i + 50
    g.vertices[i].y = 100
  for i in [0..n - 2]
    g.addEdge(new Edge tail: i, head: i + 1)
  return g
