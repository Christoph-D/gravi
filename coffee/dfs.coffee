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
    v.highlight(1)
    graph.history.saveStep()
    v.highlight(2)
    for e in v.outEdges(graph)
      w = graph.vertices[e.head]
      e.highlight(1)
      dfsStep(w)
      graph.cursor.set(v)
      e.highlight(2)
      graph.history.saveStep()

  initialVertex = graph.vertices[0]
  initialVertex.highlight(1)
  graph.cursor.set(initialVertex)
  dfsStep(initialVertex)
}
