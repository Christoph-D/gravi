describe "The graph JSON converter", ->
  g = {}
  beforeEach ->
    g = new Graph
    g.addVertex(new Vertex) for i in [0..3]
    g.addEdge(0, 1)
    g.addEdge(0, 2)
    g.addEdge(3, 2)
    g.addEdge(3, 0)

    jasmine.addMatchers
      toBeGraphEquivalent: (util, customEqualityTesters) ->
        compare: (actual, expected) ->
          result = pass: false
          if actual.vertices.length != expected.vertices.length
            result.message = "Different number of vertices."
            return result
          if actual.edges.length != expected.edges.length
            result.message = "Different number of edges."
            return result
          for v, i in actual.vertices
            w = expected.vertices[i]
            if v == null and w == null
              continue
            for key in ["id", "outE", "inE", "x", "y"]
              if not util.equals(v[key], w[key], customEqualityTesters)
                result.message = """
                  Property "#{key}" of vertex ##{i} differs.
                  Expected #{JSON.stringify(w[key])} but received #{JSON.stringify(v[key])}.
                  """
                return result
          for e, i in actual.edges
            f = expected.edges[i]
            if e == null and f == null
              continue
            for key in ["id", "head", "tail"]
              if not util.equals(e[key], f[key], customEqualityTesters)
                result.message = """
                  Property "#{key}" of edge ##{i} differs.
                  Expected #{JSON.stringify(f[key])} but received #{JSON.stringify(e[key])}.
                  """
                return result
          result.pass = true
          return result

  it "leaves the graph intact", ->
    expect(graphFromJSON(graphToJSON(g))).toBeGraphEquivalent(g)

  it "leaves the graph intact after removing an edge", ->
    g.removeEdge(0, 2)
    expect(graphFromJSON(graphToJSON(g))).toBeGraphEquivalent(g)
