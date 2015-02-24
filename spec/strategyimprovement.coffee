describe "The strategy improvement algorithm", ->
  p = (priority) ->
    if Array.isArray(priority)
      p(v) for v in priority
    else
      { priority }

  it "has correct rewards", ->
    expect(SI.reward(p 4)).toEqual(4)
    expect(SI.reward(p 3)).toEqual(-3)
    expect(-> SI.reward(p -2)).toThrow()
  it "has correct reward ordering", ->
    tests = [ [3, 4], [5, 4], [0, 2], [3, 1], [1, 1] ]
    for [v, w] in tests
      expect(SI.rewardLessOrEqual(p(v), p(w))).toBe(true, "Priorities: #{v}, #{w}")
      if v != w
        expect(SI.rewardLess(p(v), p(w))).toBe(true, "Priorities: #{v}, #{w}")
        expect(SI.rewardLessOrEqual(p(w), p(v))).toBe(false, "Priorities: #{v}, #{w}")
  it "has correct maxDiff computations", ->
    expect(SI.maxDiffLessOrEqual(p([2, 1, 3, 4]), p([2, 3, 4]))).toBe(true)
    expect(SI.maxDiffLessOrEqual(p([2, 3]), p([2, 3, 4]))).toBe(true)
    expect(SI.maxDiffLessOrEqual(p([4, 1]), p([1, 2, 4]))).toBe(true)
    expect(SI.maxDiffLessOrEqual(p([2, 5]), p([3, 5]))).toBe(false)
    expect(SI.maxDiffLessOrEqual(p([4, 5]), p([2, 5]))).toBe(false)
    expect(SI.maxDiffLessOrEqual(p([2, 5]), p([2, 5]))).toBe(true)

  describe "has correct play profile comparisons", ->
    it "with identical profiles", ->
      a = new PlayProfile l: 1, B: [1], k: 1
      expect(a.lessThanOrEqual(a)).toBe(true)
    it "with l", ->
      a = new PlayProfile l: 2, B: [2], k: 2
      b = new PlayProfile l: 3, B: [2], k: 2
      expect(a.lessThanOrEqual(b)).toBe(false)
      expect(b.lessThanOrEqual(a)).toBe(true)
    it "with B", ->
      a = new PlayProfile l: 3, B: [1], k: 2
      b = new PlayProfile l: 3, B: [2], k: 2
      expect(a.lessThanOrEqual(b)).toBe(true)
      expect(b.lessThanOrEqual(a)).toBe(true)
    it "with k", ->
      a = new PlayProfile l: 3, B: [2], k: 2
      b = new PlayProfile l: 3, B: [2], k: 3
      expect(a.lessThanOrEqual(b)).toBe(true)
      expect(b.lessThanOrEqual(a)).toBe(false)
      a.l = b.l = 2
      expect(a.lessThanOrEqual(b)).toBe(false)
      expect(b.lessThanOrEqual(a)).toBe(true)
