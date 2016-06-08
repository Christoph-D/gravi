// Two graphs are considered equivalent if they have equivalent vertex
// and edge lists, including ids.  This is a stronger condition than
// just being isomorphic.
export default {
  toBeGraphEquivalent(util) {
    return {
      compare(actual, expected) {
        const result = { pass: false };
        if(actual.vertices.length !== expected.vertices.length) {
          result.message = () => "Different number of vertices.  Expected #{expected.vertices.length} but received #{actual.vertices.length}.";
          return result;
        }
        if(actual.edges.length !== expected.edges.length) {
          result.message = () => "Different number of edges.  Expected #{expected.edges.length} but received #{actual.edges.length}.";
          return result;
        }

        function compareManagedProperties(a, b, i, what) {
          if(a === null && b === null)
            return true;
          if(!util.equals(a.propertyDescriptors(), b.propertyDescriptors())) {
            result.message = () => `
            List of managed properties of ${what} #${i} differs.
            Expected ${JSON.stringify(a.propertyDescriptors())} but received ${JSON.stringify(b.propertyDescriptors())}.
            `;
            return false;
          }
          // Don't compare the "graph" property because it simply
          // points to the graph.
          for(const p of a.propertyDescriptors().filter(p => p.name !== "graph")) {
            if(!util.equals(a[p.name], b[p.name])) {
              result.message = () => `
              Managed property "${p.name}" of ${what} #${i} differs.
              Expected ${JSON.stringify(a[p.name])} but received ${JSON.stringify(b[p.name])}.
            `;
              return false;
            }
          }
          return true;
        }

        for(const [i, v] of actual.vertices.entries())
          if(!compareManagedProperties(v, expected.vertices[i], i, "vertex"))
            return result;
        for(const [i, e] of actual.edges.entries())
          if(!compareManagedProperties(e, expected.edges[i], i, "edge"))
            return result;
        return { pass: true };
      }
    };
  }
};
