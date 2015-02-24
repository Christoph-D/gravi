describe "The strategy improvement algorithm", ->
  p = (priority) ->
    if Array.isArray(priority)
      p(v) for v in priority
    else
      { priority }

  it "has correct rewards", ->
    expect(SI.reward(p 4)).toEqual(4)
    expect(SI.reward(p 3)).toEqual(-3)
    expect(-> SI.reward({})).toThrow()
    expect(-> SI.reward(p -2)).toThrow()
  it "has correct reward ordering", ->
    tests = [ [3, 4], [5, 4], [0, 2], [3, 1], [1, 1] ]
    for [v, w] in tests
      expect(SI.rewardSmaller(p(v), p(w))).toBe(true, "Priorities: #{v}, #{w}")
      if v != w
        expect(SI.rewardStrictlySmaller(p(v), p(w))).toBe(true, "Priorities: #{v}, #{w}")
        expect(SI.rewardSmaller(p(w), p(v))).toBe(false, "Priorities: #{v}, #{w}")
  it "has correct maxDiff computations", ->
    expect(SI.maxDiff(p([2, 1, 3, 4]), p([2, 3, 4]))).toEqual(1)
    expect(SI.maxDiff(p([2, 3]), p([2, 3, 4]))).toEqual(4)
    expect(SI.maxDiff(p([4, 1]), p([1, 2, 4]))).toEqual(2)
    expect(SI.maxDiff(p([2, 5]), p([3, 5]))).toEqual(3)
