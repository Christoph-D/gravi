G = require "./graph"
require "./paritygame"

# Based on Jurdziński, 2006:
# "A deterministic subexponential algorithm for solving parity games"
#
# This is an implementation of the naive recursive algorithm described
# in this paper.
#
# It only works if there is no node with out-degree 0.

notRemoved = (v) -> v.removed != true

module.exports.minPriority = minPriority = (graph) ->
  min = null
  for v in graph.getVertices(notRemoved)
    if min?
      min = Math.min(min, v.priority)
    else
      min = v.priority
  min

verticesOfPriority = (graph, priority) ->
  v for v in graph.getVertices(notRemoved) when v.priority == priority

allNeighborsVisited = (graph, v, visited) ->
  for w in v.outNeighbors(notRemoved)
    if not visited[w.id]
      return false
  return true

module.exports.attractor = attractor = (graph, player0, subset) ->
  visited = {}
  for u in subset
    visited[u.id] = true
  loop
    addition = []
    for u in subset
      for v in u.inNeighbors(notRemoved)
        if visited[v.id]
          continue
        if v.player0 == player0 or allNeighborsVisited(graph, v, visited)
          visited[v.id] = true
          addition.push(v)
    if addition.length == 0
      break
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

# Assumes no dead-ends.
parityWinRecursive = (graph) ->
  if totalRemoved == graph.vertices.length
    return [[],[]]
  d = minPriority(graph)
  A = verticesOfPriority(graph, d)
  i = d % 2
  j = (d + 1) % 2

  B = attractor(graph, (i == 0), A)
  markRemoved(graph, B)
  winningRegions = parityWinRecursive(graph)
  unmarkRemoved(graph, B)

  if winningRegions[j].length == 0
    winningRegions[i] = (v for v in graph.getVertices(notRemoved))
  else
    B = attractor(graph, (i == 1), winningRegions[j])
    markRemoved(graph, B)
    winningRegions = parityWinRecursive(graph)
    unmarkRemoved(graph, B)

    winningRegions[j] = []
    for v in graph.getVertices(notRemoved)
      if winningRegions[i].indexOf(v) == -1
        winningRegions[j].push(v)
  return winningRegions

module.exports.parityWin = parityWin = (graph) ->
  graph.compressIds() # needed for totalRemoved to make sense
  totalRemoved = 0
  parityWinRecursive(graph)
