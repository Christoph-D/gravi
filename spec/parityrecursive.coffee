define [ "gralog/gralog", "gralog/parityrecursive"
], (G, solver) -> describe "The recursive parity game solver", ->
  g = {}
  beforeEach ->
    g = new G.ParityGame numVertices: 4, edgeList: [[0,1], [0,2], [3,2], [3,0]]
    g.vertices[0].player0 = true
  # Convert from a vertex ids to vertex objects.
  V = (vertices) -> g.vertices[i] for i in vertices
  # Convert from a vertex objects to vertex ids.
  ids = (vertices) -> v.id for v in vertices

  it "computes min priority", ->
    v.priority = v.id for v in g.vertices
    expect(solver.minPriority(g)).toEqual(0)
    v.priority = v.id + 1 for v in g.vertices
    expect(solver.minPriority(g)).toEqual(1)

  it "computes attractors", ->
    expect(ids solver.attractor(g, false, (V [0]))).toEqual([0,3])
  it "computes attractors", ->
    g.vertices[3].player0 = true
    expect(ids solver.attractor(g, false, (V [0]))).toEqual([0])

  it "solves parity games", ->
    g = new G.ParityGame numVertices: 4, edgeList: [[0,1], [1,0], [0,2], [2,3], [3,2]]
    g.vertices[0].player0 = true
    g.vertices[0].priority = 0
    g.vertices[1].priority = 1
    g.vertices[2].priority = 1
    g.vertices[3].priority = 1

    W = solver.parityWin(g)
    expect(ids(W[0])).toEqual([0, 1])
    expect(ids(W[1])).toEqual([2, 3])

    g.vertices[0].player0 = false
    W = solver.parityWin(g)
    expect(ids(W[0])).toEqual([])
    expect(ids(W[1])).toEqual([0, 1, 2, 3])
