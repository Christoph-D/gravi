G = require "./graph"
require "./paritygame"

# Based on Jurdziński, 2006:
# "A deterministic subexponential algorithm for solving parity games"
#
# This is an implementation of the naive recursive algorithm described
# in this paper, not an implementation of the subexponential
# algorithm.

notRemoved = (v) -> v.removed != true

module.exports.even = even = (priority) -> priority % 2 == 0

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
  i = if even(d) then 0 else 1
  j = if even(d) then 1 else 0

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


findDeadEnds = (graph, player0) ->
  v for v in graph.getVertices() when v.player0 == true and v.outNeighbors().length == 0
# Removes dead-ends and their attractors.
simplifyDeadEnds = (graph) ->
  player0DeadEnds = findDeadEnds(graph, true)
  W1 = attractor(graph, false, player0DeadEnds)
  player1DeadEnds = findDeadEnds(graph, true)
  W0 = attractor(graph, true, player1DeadEnds)
  markRemoved(graph, W0)
  markRemoved(graph, W1)
  return [W0, W1]

module.exports.parityWin = parityWin = (graph) ->
  # We want totalRemoved == graph.vertices.length to mean "all
  # vertices are removed".  For this, we cannot have null entries in
  # the vertex list.
  graph.compressIds()
  # Make sure no vertices are marked "removed" yet.
  delete v.removed for v in graph.getVertices()
  totalRemoved = 0

  # Compute and remove the obvious winning regions caused by
  # dead-ends.
  simpleW = simplifyDeadEnds(graph)
  # Compute the winning regions of the remaining graph.
  W = parityWinRecursive(graph)
  W[0] = W[0].concat(simpleW[0])
  W[1] = W[1].concat(simpleW[1])

  # Highlight the winning regions.
  v.highlight.set(2) for v in W[0]
  v.highlight.set(1) for v in W[1]
  graph.history.saveStep()

  W
