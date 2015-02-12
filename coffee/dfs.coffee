dfs = (graph) ->
  visited = []
  dfsStep = (v) ->
    graph.setCursor(v)
    if visited[v.id]
      graph.saveStep()
      return
    visited[v.id] = true
    v.highlight(graph, 1)
    graph.saveStep()
    v.highlight(graph, 2)
    for e in v.outEdges(graph)
      w = graph.vertices[e.head]
      e.highlight(graph, 1)
      dfsStep(w)
      graph.setCursor(v)
      e.highlight(graph, 2)
      graph.saveStep()

  initialVertex = graph.vertices[0]
  initialVertex.highlight(graph, 1)
  graph.setCursor(initialVertex)
  dfsStep(initialVertex)
