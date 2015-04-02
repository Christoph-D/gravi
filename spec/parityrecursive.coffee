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

  it "computes attractors", ->
    expect(ids solver.attractor(g, false, (V [0]))).toEqual([0,3])
  it "computes attractors", ->
    g.vertices[3].player0 = true
    expect(ids solver.attractor(g, false, (V [0]))).toEqual([0])
