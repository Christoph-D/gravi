SI =
  reward: (v) ->
    if not v.priority?
      throw Error("Property \"priority\" missing")
    if v.priority < 0
      throw Error("Priority canot be negative")
    if v.priority % 2 == 0
      v.priority
    else
      -v.priority
  rewardSmaller: (v, w) -> SI.reward(v) <= SI.reward(w)
  rewardStrictlySmaller: (v, w) -> SI.reward(v) < SI.reward(w)
  maxDiff: (B, C) ->
    B = (v.priority for v in B)
    C = (v.priority for v in C)
    R = B.filter((v) -> v not in C)
    for v in C when v not in B
      if v not in R
        R.push(v)
    if R.length > 0
      Math.max.apply(null, R)
    else
      false

  run: (graph) ->
    visited = []
    initialVertex = graph.vertices[0]
    initialVertex.highlight(1)
    graph.setCursor(initialVertex)

strategyImprovement = SI.run
