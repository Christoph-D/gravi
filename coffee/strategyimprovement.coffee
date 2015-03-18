`define(function(require){`

G = require './graph'

# A play profile contains l, B, k.
class G.PlayProfile
  constructor: ({@l, @B, @k}) ->
  lessThanOrEqual: (other) ->
    if @l != other.l
      return SI.rewardLess @l, other.l
    else
      a = SI.maxDiffLessOrEqualL @B, other.B, @l
      b = SI.maxDiffLessOrEqualL other.B, @B, @l
      if !(a && b)
        # @B and other.B are not @l-equivalent
        a && !b
      else
        # @B and other.B are @l-equivalent
        if @l % 2 == 1
          @k <= other.k
        else
          other.k <= @k

G.SI = SI =
  reward: (v) ->
    if v.priority?
      v = v.priority
    if v < 0
      throw Error("Priority canot be negative")
    if v % 2 == 0 then v else -v
  rewardLessOrEqual: (v, w) -> SI.reward(v) <= SI.reward(w)
  rewardLess: (v, w) -> SI.reward(v) < SI.reward(w)
  maxDiffLessOrEqual: (B, C) ->
    B = (v.priority for v in B)
    C = (v.priority for v in C)
    if B.length == C.length
      equal = true
      for i in [0..B.length - 1]
        if B[i] != C[i]
          equal = false
      return true if equal
    B2 = B.filter((v) -> v not in C)
    C2 = C.filter((v) -> v not in B)
    d = Math.max.apply(null, B2.concat(C2))
    return (d in B2 and d % 2 == 1) or (d in C2 and d % 2 == 0)
  maxDiffLessOrEqualL: (B, C, l) ->
    B = B.filter((v) -> v.priority > l)
    C = C.filter((v) -> v.priority > l)
    SI.maxDiffLessOrEqual B, C
  # maxDiffEqualL: (B, C, l) ->
  #   maxDiffLessOrEqualL B, C, l and maxDiffLessOrEqualL C, B, l
  # maxDiffLessL: (B, C, l) ->
  #   maxDiffLessOrEqualL B, C, l and not maxDiffLessOrEqualL C, B, l

  run: (graph) ->
    visited = []
    initialVertex = graph.vertices[0]
    initialVertex.highlight(1)
    graph.setCursor(initialVertex)

G.strategyImprovement = G.SI.run

`})`
