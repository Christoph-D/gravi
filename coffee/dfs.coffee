G = require "./graph"

G.dfs = {
run: (graph) ->
  visited = []
  dfsStep = (v) ->
    graph.cursor.set(v)
    if visited[v.id]
      graph.history.saveStep()
      return
    visited[v.id] = true
    v.highlight.set(1)
    graph.history.saveStep()
    v.highlight.set(2)
    for e in v.outEdges(graph)
      w = graph.vertices[e.head]
      e.highlight.set(1)
      dfsStep(w)
      graph.cursor.set(v)
      e.highlight.set(2)
      graph.history.saveStep()

  initialVertex = graph.vertices[0]
  initialVertex.highlight.set(1)
  graph.cursor.set(initialVertex)
  dfsStep(initialVertex)
}
