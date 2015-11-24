// Functions to convert between a graph and its JSON representation.

import * as G from "graph";

export function vertexOrEdgeToJSON(v) {
  if(v === null)
    return null;
  const w = {};
  for(let p of v.propertyDescriptors != null ? v.propertyDescriptors() : []) {
    // Save only properties different from the default value.
    if(p.shouldBeSaved !== false && v[p.name] !== p.defaultValue)
      w[p.name] = v[p.name];
  }
  return w;
}

G.Graph.prototype.toJSON = function() {
  const g = { type: this.name, version: this.version, vertices: [], edges: [] };
  for(let v of this.vertices)
    g.vertices.push(G.vertexOrEdgeToJSON(v));
  for(let e of this.edges)
    g.edges.push(G.vertexOrEdgeToJSON(e));
  return g;
};

export function graphFromJSON(json, validTypes = ["SimpleGraph", "FiniteAutomaton", "ParityGame"]) {
  const raw = JSON.parse(json);
  if(raw.type == null)
    throw TypeError("Missing property: \"type\"");
  if(!(raw.type in validTypes))
    throw TypeError(`Don't know how to make a graph of type "${raw.type}". Known types: ${validTypes}`);

  let g = new (raw.type in G ? G[raw.type] : window[raw.type]);

  if(raw.vertices != null) {
    for(let [i, v] of raw.vertices.entries()) {
      // Also insert null vertices to preserve the vertex ids.
      if(v === null)
        g.vertices.push(null);
      else {
        try {
          g.addVertex(new g.VertexType(v));
        }
        catch(error) {
          error.message += ` on vertex #${i}: ${JSON.stringify(v)}`;
          throw error;
        }
      }
    }
  }

  if(raw.edges != null) {
    for(let [i, e] of raw.edges.entries()) {
      if(e === null)
        g.edges.push(null);
      else {
        try {
          g.addEdge(new g.EdgeType(e));
        }
        catch(error) {
          error.message += ` on edge #${i}: ${JSON.stringify(e)}`;
          throw error;
        }
      }
    }
  }

  return g;
}
