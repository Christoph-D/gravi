// This module does not export anything.  Importing it has the side
// effect that Graph, Vertex and Edge become highlightable.

import Graph, { Vertex, Edge } from "./graph";
import TimedProperty from "./timed";
import injectDelayedProperty from "./extensible";

// Adds a global timeline to the graph.  Useful in combination with
// TimedProperty on the vertices/edges.
injectDelayedProperty(Graph, "history", class {
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
    for(let v of this.graph.getVertices()) {
      for(let key in v) {
        try {
          v[key].reset();
        }
        catch (_) { /* ignore */ }
      }
      v.modified = true;
    }
    for(let e of this.graph.getEdges()) {
      for(let key in e) {
        try {
          e[key].reset();
        }
        catch (_) { /* ignore */ }
      }
      e.modified = true;
    }
    this.totalSteps = 0;
    this.currentStep = 0;
    return this;
  }
});

// Marks a vertex in the graph.  Useful to show the state of
// depth-first search and related algorithms.
injectDelayedProperty(Graph, "cursor", class {
  constructor(graph) {
    this.graph = graph;
    this.cursor = new TimedProperty(null, ["x", "y"]);
  }
  set(cursor) {
    this.cursor.valueAtTime(this.graph.history.currentStep, cursor);
  }
  get() {
    return this.cursor.valueAtTime(this.graph.history.currentStep);
  }
});

// Translate highlight ids from readable names to the internal names
// used in the css file.
function translateHighlightIds(id) {
  if(id === "active" || id === "player0")
    return 1;
  if(id == "done" || id == "player1")
    return 2;
  throw TypeError(`Not a valid highlight id: ${id}`);
}

// Makes a vertex or an edge highlightable.
class Highlight {
  constructor(parent) {
    this.parent = parent;
    this.highlightClass = new TimedProperty("");
  }

  set(highlightId) {
    let c = highlightId != null ? c = `highlight${translateHighlightIds(highlightId)}` : "";
    this.highlightClass.valueAtTime(this.parent.graph.history.currentStep, c);
    return this;
  }

  getCSSClass() {
    return this.highlightClass.valueAtTime(this.parent.graph.history.currentStep);
  }

  reset() { this.highlightClass.reset(); }
}

injectDelayedProperty(Vertex, "highlight", Highlight);
injectDelayedProperty(Edge, "highlight", Highlight);