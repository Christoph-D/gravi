import Graph, { Edge, Vertex, VertexOrEdge } from "./graph";
import "./historygraph";
import { GraphView, makeView } from "./graphview";

export default class GraphEditor {
  private g: Graph<Vertex, Edge>;
  private view: GraphView<Vertex, Edge>;
  private svg;

  constructor(g: Graph<Vertex, Edge>, svg, view = makeView(g, svg)) {
    this.g = g;
    this.svg = svg;
    this.view = view;
  }

  public setGraph(g: Graph<Vertex, Edge>, view = makeView(g, this.svg)) {
    this.g = g;
    this.view = view;
  }

  public queueRedraw() {
    this.view.queueRedraw();
  }

  public getSelection(): VertexOrEdge {
    return this.view.selection;
  }

  public totalSteps() {
    return this.g.history.totalSteps;
  }
  public currentStep(step?: number): number {
    if(step == null)
      return this.g.history.currentStep;
    // If the current step changes, every vertex and edge could change
    // their highlight.
    if(step !== this.g.history.currentStep) {
      this.g.getVertices().map(v => v.modified = true);
      this.g.getEdges().map(e => e.modified = true);
    }
    this.g.history.currentStep = step;
    return step;
  }
}
