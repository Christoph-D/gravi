describe "A graph", ->
  beforeEach ->
    jasmine.addMatchers
      toBeGraphEquivalent: (util, customEqualityTesters) ->
        compare: (actual, expected) ->
          result = pass: false
          if actual.vertices.length != expected.vertices.length
            result.message = "Different number of vertices.  Expected #{expected.vertices.length} but received #{actual.vertices.length}."
            return result
          if actual.edges.length != expected.edges.length
            result.message = "Different number of edges.  Expected #{expected.edges.length} but received #{actual.edges.length}."
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
            if not util.equals(v.propertyDescriptors(), w.propertyDescriptors(), customEqualityTesters)
                result.message = """
                  List of custom properties of vertex ##{i} differs.
                  Expected #{JSON.stringify(v.propertyDescriptors())} but received #{JSON.stringify(w.propertyDescriptors())}.
                  """
                return result
            for p in v.propertyDescriptors()
              if not util.equals(v[p.name], w[p.name], customEqualityTesters)
                result.message = """
                  Custom property "#{p.name}" of vertex ##{i} differs.
                  Expected #{JSON.stringify(v[p.name])} but received #{JSON.stringify(w[p.name])}.
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

  describe "with the JSON converter", ->
    g = {}
    beforeEach ->
      g = new Graph numVertices: 4, edgeList: [[0,1], [0,2], [3,2], [3,0]]
      g.vertices[0].label = "first label"
      g.vertices[1].label = "second label"

    it "leaves the graph intact", ->
      expect(graphFromJSON(graphToJSON(g))).toBeGraphEquivalent(g)

    it "leaves the graph intact after removing an edge", ->
      g.removeEdge(0, 2)
      expect(graphFromJSON(graphToJSON(g))).toBeGraphEquivalent(g)

    it "leaves the graph intact after adding an edge", ->
      g.addEdge(2,1)
      expect(graphFromJSON(graphToJSON(g))).toBeGraphEquivalent(g)

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
      expect(-> new Graph numVertices: 1, edgeList: [[0,1]]).toThrow(new Error('Invalid property "head". Not a vertex id: 1'))
      expect(-> new Graph numVertices: 2, edgeList: [[0,-1]]).toThrow(new Error('Invalid property "head". Not a vertex id: -1'))
      expect(-> new Graph numVertices: 3, edgeList: [[0]]).toThrow(new Error('Missing property "tail"'))

    it "checks head/tail ids of added edges", ->
      g = new Graph numVertices: 2
      expect(-> g.addEdge(tail: 0, head: 2)).toThrow(new Error('Invalid property "head". Not a vertex id: 2'))
      expect(-> g.addEdge(new Edge tail: 0, head: 2)).toThrow(new Error('Invalid property "head". Not a vertex id: 2'))
      expect(-> g.addEdge(new Edge tail: 0, head: 1)).not.toThrow()
      h = new Graph numVertices: 2, edgeList: [[0,1]]
      expect(g).toBeGraphEquivalent(h)
