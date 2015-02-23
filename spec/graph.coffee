describe "A graph", ->
  beforeEach ->
    jasmine.addMatchers
      # To graphs are considered equivalent if they have equivalent
      # vertex and edge lists, including ids.  This is a stronger
      # condition than just being isomorphic.
      toBeGraphEquivalent: (util, customEqualityTesters) ->
        compare: (actual, expected) ->
          result = pass: false
          if actual.vertices.length != expected.vertices.length
            result.message = "Different number of vertices.  Expected #{expected.vertices.length} but received #{actual.vertices.length}."
            return result
          if actual.edges.length != expected.edges.length
            result.message = "Different number of edges.  Expected #{expected.edges.length} but received #{actual.edges.length}."
            return result

          compareCustomProperties = (a, b, i, what) ->
            if a == null and b == null
              return true
            if not util.equals(a.propertyDescriptors(), b.propertyDescriptors(), customEqualityTesters)
                result.message = """
                  List of custom properties of #{what} ##{i} differs.
                  Expected #{JSON.stringify(a.propertyDescriptors())} but received #{JSON.stringify(b.propertyDescriptors())}.
                  """
                return false
            # Don't compare the "graph" property because it simply
            # points to the graph.
            for p in a.propertyDescriptors() when p.name != "graph"
              if not util.equals(a[p.name], b[p.name], customEqualityTesters)
                result.message = """
                  Custom property "#{p.name}" of #{what} ##{i} differs.
                  Expected #{JSON.stringify(a[p.name])} but received #{JSON.stringify(b[p.name])}.
                  """
                return false
            return true

          for v, i in actual.vertices
            if not compareCustomProperties v, expected.vertices[i], i, "vertex"
              return result
          for e, i in actual.edges
            if not compareCustomProperties e, expected.edges[i], i, "edge"
              return result
          result.pass = true
          return result

  describe "with the JSON converter", ->
    g = {}
    beforeEach ->
      g = new Graph numVertices: 4, edgeList: [[0,1], [0,2], [3,2], [3,0]]
      g.vertices[0].label = "first label"
      g.vertices[1].label = "second label"

    it "leaves the graph intact", ->
      expect(graphFromJSON(JSON.stringify(g), ["Graph"])).toBeGraphEquivalent(g)

    it "leaves the graph intact after removing an edge", ->
      g.removeEdge(0, 2)
      expect(graphFromJSON(JSON.stringify(g), ["Graph"])).toBeGraphEquivalent(g)

    it "leaves the graph intact after adding an edge", ->
      g.addEdge(2,1)
      expect(graphFromJSON(JSON.stringify(g), ["Graph"])).toBeGraphEquivalent(g)

    it "refuses to load a graph with unknown type", ->
      j = JSON.parse(JSON.stringify(g))
      j.type = "InvalidType"
      expect(-> graphFromJSON(JSON.stringify(j), ["Dummy"]))
        .toThrow(TypeError("Don't know how to make a graph of type \"InvalidType\". Known types: Dummy"))

  describe "with ordinary vertices/edges", ->
    it "allows removing edges", ->
      g = new Graph numVertices: 4, edgeList: [[0,1], [1,2]]
      h = new Graph numVertices: 4, edgeList: [[1,2]]
      g.removeEdge(0, 1)
      g.compressIds()
      expect(g).toBeGraphEquivalent(h)

    it "allows adding edges", ->
      g = new Graph numVertices: 4, edgeList: [[0,1], [1,2]]
      h = new Graph numVertices: 4, edgeList: [[0,1], [1,2], [0,3]]
      g.addEdge(0, 3)
      expect(g).toBeGraphEquivalent(h)

    it "allows removing vertices", ->
      g = new Graph numVertices: 4, edgeList: [[0,1], [3,2], [1,2]]
      h = new Graph numVertices: 3, edgeList: [[2,1]]
      g.removeVertex(g.vertices[1])
      g.compressIds()
      expect(g).toBeGraphEquivalent(h)

    it "allows adding vertices", ->
      g = new Graph numVertices: 4, edgeList: [[0,1], [1,2]]
      h = new Graph numVertices: 5, edgeList: [[0,1], [1,2]]
      g.addVertex(new Vertex)
      expect(g).toBeGraphEquivalent(h)

    it "checks head/tail ids of edges in the constructor", ->
      expect(-> new Graph numVertices: 1, edgeList: [[0,1]])
        .toThrow(new Error('Invalid property "head". Not a vertex id: 1'))
      expect(-> new Graph numVertices: 2, edgeList: [[0,-1]])
        .toThrow(new Error('Invalid property "head". Not a vertex id: -1'))
      expect(-> new Graph numVertices: 3, edgeList: [[0]])
        .toThrow(new Error('Missing property "tail"'))

    it "checks head/tail ids of added edges", ->
      g = new Graph numVertices: 2
      expect(-> g.addEdge(tail: 0, head: 2))
        .toThrow(new Error('Invalid property "head". Not a vertex id: 2'))
      expect(-> g.addEdge(new Edge tail: 0, head: 2))
        .toThrow(new Error('Invalid property "head". Not a vertex id: 2'))
      expect(-> g.addEdge(new Edge tail: 0, head: 1))
        .not.toThrow()
      h = new Graph numVertices: 2, edgeList: [[0,1]]
      expect(g).toBeGraphEquivalent(h)
