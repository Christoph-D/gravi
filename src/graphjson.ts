// Function to create a graph from its JSON representation.

import FiniteAutomaton from "./finiteautomaton";
import Graph, { Edge, Vertex } from "./graph";
import ParityGame from "./paritygame";
import SimpleGraph from "./simplegraph";

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
        g.addNullVertex();
      else {
        try {
          g.addVertex(v);
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
        g.addNullEdge();
      else {
        try {
          g.addEdge(e);
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
