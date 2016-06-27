// This module does not export anything.  Importing it has the side
// effect that Graph, Vertex and Edge become highlightable.

import Graph, { VertexOrEdge, Vertex, Edge } from "./graph";
import TimedProperty from "./timed";
import injectDelayedProperty from "./delayedproperty";

// Adds a global timeline to the graph.  Useful in combination with
// TimedProperty on the vertices/edges.
export class History {
  graph: Graph<any, any>;
  totalSteps: number;
  currentStep: number;

  constructor(graph) {
    this.graph = graph;
    this.totalSteps = 0;
    this.currentStep = 0;
  }

  saveStep() {
    ++this.totalSteps;
    ++this.currentStep;
    return this;
  }

  reset() {
    // Blindly reset all properties.
    for(const v of this.graph.getVertices()) {
      for(const key in v) {
        try {
          v[key].reset();
        }
        catch(_) { /* ignore */ }
      }
      v.modified = true;
    }
    for(const e of this.graph.getEdges()) {
      for(const key in e) {
        try {
          e[key].reset();
        }
        catch(_) { /* ignore */ }
      }
      e.modified = true;
    }
    this.totalSteps = 0;
    this.currentStep = 0;
    return this;
  }
}

injectDelayedProperty(Graph, "history", History);

// Marks a vertex in the graph.  Useful to show the state of
// depth-first search and related algorithms.
export class Cursor {
  graph: Graph<any, any>;
  cursor: TimedProperty;

  constructor(graph) {
    this.graph = graph;
    this.cursor = new TimedProperty(null, ["x", "y"]);
  }
  set(cursor) {
    this.cursor.valueAtTime(this.graph.history.currentStep, cursor);
  }
  get() : { x: number, y: number } {
    return this.cursor.valueAtTime(this.graph.history.currentStep);
  }
}

injectDelayedProperty(Graph, "cursor", Cursor);

// Translate highlight ids from readable names to the internal names
// used in the css file.
function translateHighlightIds(id : string) {
  if(id === "active" || id === "player0")
    return 1;
  if(id === "done" || id === "player1")
    return 2;
  throw TypeError(`Not a valid highlight id: ${id}`);
}

// Makes a vertex or an edge highlightable.
export class Highlight {
  parent: VertexOrEdge;
  highlightClass: TimedProperty;

  constructor(parent : VertexOrEdge) {
    this.parent = parent;
    this.highlightClass = new TimedProperty("");
  }

  set(highlightId? : string) {
    let c = highlightId != null ? `highlight${translateHighlightIds(highlightId)}` : "";
    this.highlightClass.valueAtTime(this.parent.graph.history.currentStep, c);
    return this;
  }

  getCSSClass() : string {
    return this.highlightClass.valueAtTime(this.parent.graph.history.currentStep);
  }

  reset() { this.highlightClass.reset(); }
}

injectDelayedProperty(Vertex, "highlight", Highlight);
injectDelayedProperty(Edge, "highlight", Highlight);
