// Function to create a graph from its JSON representation.

import Graph, { Vertex, Edge } from "./graph";
import SimpleGraph from "./simplegraph";
import FiniteAutomaton from "./finiteautomaton";
import ParityGame from "./paritygame";

export default function graphFromJSON(json, validTypes = [SimpleGraph, FiniteAutomaton, ParityGame]) {
  const raw = JSON.parse(json);
  if(raw.type == null)
    throw TypeError("Missing property: \"type\"");
  const typeNames = validTypes.map(t => t.name);
  const typeIndex = typeNames.indexOf(raw.type);
  if(typeIndex === -1)
    throw TypeError(`Don't know how to make a graph of type "${raw.type}". Known types: ${typeNames}`);

  const g = <Graph<Vertex, Edge>>new validTypes[typeIndex]();

  if(raw.vertices != null) {
    for(const [i, v] of raw.vertices.entries()) {
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
    for(const [i, e] of raw.edges.entries()) {
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
