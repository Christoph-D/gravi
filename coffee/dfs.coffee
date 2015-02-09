dfs = (graph) ->
  visited = []
  dfsStep = (v) ->
    if visited[v.id]
      return
    visited[v.id] = true
    v.highlight(graph, 1)
    graph.saveStep()
    v.highlight(graph, 2)
    for e in v.outEdges(graph)
      e.highlight(graph, 1)
      dfsStep(graph.vertices[e.head])
      e.highlight(graph, 2)
  dfsStep(graph.vertices[0])
