generateRandomGraph = (n, p) ->
  g = new Graph
  for i in [0..n - 1]
    v = new Vertex
    v.x = -150 * Math.cos(2 * Math.PI / n * i) + 350
    v.y = 150 * Math.sin(2 * Math.PI / n * i) + 200
    g.addVertex(v)
  for i in [0..n - 1]
    for j in [0..n - 1]
      continue if i == j
      if Math.random() < p
        g.addEdge(new Edge head: i, tail: j)
  return g

generatePath = (n) ->
  g = new Graph
  for i in [0..n - 1]
    v = new Vertex
    v.x = -200 * Math.cos(Math.PI / (n - 1) * i) + 350
    v.y = 200 * Math.sin(Math.PI / (n - 1) * i) + 100
    g.addVertex(v)
  for i in [0..n - 2]
    g.addEdge(new Edge tail: i, head: i + 1)
  return g
