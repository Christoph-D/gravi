G = require "./graph"
require "./paritygame"

lowestPriority = (graph) ->
  min = null
  for v in graph.getVertices()
    min ?= Math.min(min, v.priority)
  min

verticesOfPriority = (graph, priority) ->
  v for v in graph.getVertices() when v.priority == priority

allNeighborsVisited = (graph, v, visited) ->
  for w in v.outNeighbors()
    if not visited[w.id]
      return false
  return true

module.exports.attractor = (graph, player0, subset) ->
  visited = {}
  for u in subset
    visited[u.id] = true
  for u in subset
    addition = []
    for v in u.inNeighbors()
      if visited[v.id]
        continue
      visited[v.id] = true
      if v.player0 == player0 or allNeighborsVisited graph, v, visited
        addition.push(v)
    subset = subset.concat(addition)
  return subset
