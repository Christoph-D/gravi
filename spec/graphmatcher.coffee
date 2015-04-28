define ->
  # Two graphs are considered equivalent if they have equivalent vertex
  # and edge lists, including ids.  This is a stronger condition than
  # just being isomorphic.
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
