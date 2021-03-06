// Function to create a graph from its JSON representation.

import FiniteAutomaton from "./finiteautomaton";
import Graph, { Edge, Vertex } from "./graph";
import ParityGame from "./paritygame";

interface GraphFactory {
  graphName: string;
  new(): any;
}

export default function graphFromJSON(
  json: string,
  validTypes: GraphFactory[] = [Graph, FiniteAutomaton, ParityGame],
) {
  const raw = JSON.parse(json);
  if(raw.type == null)
    throw TypeError("Missing property: \"type\"");
  const typeNames = validTypes.map(t => t.graphName);
  const typeIndex = typeNames.indexOf(raw.type);
  if(typeIndex === -1)
    throw TypeError(`Don't know how to make a graph of type "${raw.type}". Known types: ${typeNames}`);

  const g = new validTypes[typeIndex]() as Graph<Vertex, Edge>;

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
