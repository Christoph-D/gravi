dfs = (graph) ->
  visited = []
  dfsStep = (v) ->
    if visited[v.id]
      return
    visited[v.id] = true
    v.class = "highlight1"
    graph.saveStep()
    v.class = "highlight2"
    for e in v.outEdges(graph)
      e.class = "highlight2"
      dfsStep(graph.vertices[e.head])
  dfsStep(graph.vertices[0])
