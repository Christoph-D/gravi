G = require "./graph"
require "./paritygame"

minPriority = (graph) ->
  min = null
  for v in graph.getVertices() when v.removed != true
    min ?= Math.min(min, v.priority)
  min

verticesOfPriority = (graph, priority) ->
  v for v in graph.getVertices() when v.priority == priority and v.removed != true

allNeighborsVisited = (graph, v, visited) ->
  for w in v.outNeighbors() when w.removed != true
    if not visited[w.id]
      return false
  return true

module.exports.attractor = (graph, player0, subset) ->
  visited = {}
  for u in subset
    visited[u.id] = true
  for u in subset
    addition = []
    for v in u.inNeighbors() when v.removed != true
      if visited[v.id]
        continue
      visited[v.id] = true
      if v.player0 == player0 or allNeighborsVisited graph, v, visited
        addition.push(v)
    subset = subset.concat(addition)
  return subset

totalRemoved = 0

markRemoved = (graph, vertices) ->
  for v in vertices
    v.removed = true
  totalRemoved += vertices.length

unmarkRemoved = (graph, vertices) ->
  for v in vertices
    delete v.removed
  totalRemoved -= vertices.length

# TODO: test this, fix this
parityWinRecursive = (graph) ->
  if totalRemoved == graph.vertices.length
    return [[],[]]
  d = minPriority graph
  A = verticesOfPriority(graph, d)
  i = d % 2
  j = (d + 1) % 2

  B = attractor(i == 0, A)
  markRemoved graph, B
  winningRegions = parityWin graph
  unmarkRemoved graph, B

  if winningRegions[j].length == 0
    winningRegions[i] = (v for v in graph.vertices when v.removed != true)
  else
    B = attractor(i == 1, winningRegions[j])
    markRemoved graph, B
    winningRegions = parityWin graph
    unmarkRemoved graph, B

    winningRegions[j] = []
    for v in graph.vertices when v.removed != true
      if winningRegions[i].indexOf(v) == -1
        winningRegions[j].push(v)
  return winningRegions

module.exports.parityWin = parityWin = (graph) ->
  totalRemoved = 0
  parityWinRecursive graph
