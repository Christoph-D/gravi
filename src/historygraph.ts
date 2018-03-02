// This module does not export anything.  Importing it has the side
// effect that Graph, Vertex and Edge become highlightable.

import injectDelayedProperty from "./delayedproperty";
import Graph, { Edge, Vertex, VertexOrEdge } from "./graph";
import TimedProperty from "./timed";

// Adds a global timeline to the graph.  Useful in combination with
// TimedProperty on the vertices/edges.
export class History {
  public graph: Graph<any, any>;
  public totalSteps: number;
  public currentStep: number;

  constructor(graph) {
    this.graph = graph;
    this.totalSteps = 0;
    this.currentStep = 0;
  }

  public saveStep() {
    ++this.totalSteps;
    ++this.currentStep;
    return this;
  }

  public reset() {
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
  public graph: Graph<any, any>;
  public cursor: TimedProperty;

  constructor(graph) {
    this.graph = graph;
    this.cursor = new TimedProperty(null, ["x", "y"]);
  }
  public set(cursor) {
    this.cursor.valueAtTime(this.graph.history.currentStep, cursor);
  }
  public get(): { x: number, y: number } {
    return this.cursor.valueAtTime(this.graph.history.currentStep);
  }
}

injectDelayedProperty(Graph, "cursor", Cursor);

// Translate highlight ids from readable names to the internal names
// used in the css file.
function translateHighlightIds(id: string) {
  if(id === "active" || id === "player0")
    return 1;
  if(id === "done" || id === "player1")
    return 2;
  throw TypeError(`Not a valid highlight id: ${id}`);
}

// Makes a vertex or an edge highlightable.
export class Highlight {
  private parent: VertexOrEdge;
  private highlightClass: TimedProperty;

  constructor(parent: VertexOrEdge) {
    this.parent = parent;
    this.highlightClass = new TimedProperty("");
  }

  public set(highlightId?: string) {
    const c = highlightId != null ? `highlight${translateHighlightIds(highlightId)}` : "";
    this.highlightClass.valueAtTime(this.parent.graph.history.currentStep, c);
    return this;
  }

  public getCSSClass(): string {
    return this.highlightClass.valueAtTime(this.parent.graph.history.currentStep);
  }

  public reset() { this.highlightClass.reset(); }
}

injectDelayedProperty(Vertex, "highlight", Highlight);
injectDelayedProperty(Edge, "highlight", Highlight);
