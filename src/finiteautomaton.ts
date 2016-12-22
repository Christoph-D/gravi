import Graph, { Vertex, Edge, VertexOrEdge } from "./graph";
import { ManagedPropertyDescriptor } from "./managed-property";
import { ArrowEdgeView, circleEdgeAnchor, CircleVertexView, GraphView, registerView } from "./graphview";

const accepting: ManagedPropertyDescriptor = {
  defaultValue: false,
  name: "accepting",
  type: "boolean",
};

export class AutomatonVertex extends Vertex {
  public accepting: boolean;
}
AutomatonVertex.manageProperties(accepting);
AutomatonVertex.onStatic(
  "changeAccepting",
  VertexOrEdge.prototype.changeGraphStructure);

const letter: ManagedPropertyDescriptor = {
  defaultValue: "",
  name: "letter",
  type: "string",
};

export class AutomatonEdge extends Edge {
  public letter: string;
}
AutomatonEdge.manageProperties(letter);
AutomatonEdge.onStatic(
  "changeLetter",
  VertexOrEdge.prototype.changeGraphStructure);

class AutomatonVertexView
  <V extends AutomatonVertex, E extends Edge> extends CircleVertexView<V, E> {
  public drawEnter(v: V, svgGroup) {
    super.drawEnter(v, svgGroup);
    svgGroup.append("circle").attr("class", "accepting accepting1").attr("r", this.radius - 1);
    svgGroup.append("circle").attr("class", "accepting accepting2").attr("r", this.radius - 4);
  }
  public drawUpdate(v: V, svgGroup) {
    super.drawUpdate(v, svgGroup);
    const opacity = v.accepting ? 1 : 0;
    svgGroup.selectAll("circle.accepting")
      .attr("cx", v.x)
      .attr("cy", v.y)
      .style("stroke-opacity", opacity);
  }
}

class AutomatonEdgeView
  <V extends AutomatonVertex, E extends AutomatonEdge> extends ArrowEdgeView<V, E> {

  public drawEnter(e: E, svgGroup) {
    super.drawEnter(e, svgGroup);
    svgGroup.append("rect").attr("class", "letter")
      .attr("fill", "#FFFFFF")
      .attr("stroke", "none");
    svgGroup.append("text").attr("class", "letter")
      .attr("font-family", "sans-serif")
      .attr("font-size", "20")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central");
  }

  public drawUpdate(e: E, svgGroup) {
    super.drawUpdate(e, svgGroup);
    if(e.letter === "") {
      svgGroup.selectAll(".letter").attr("visibility", "hidden");
      return;
    }
    svgGroup.selectAll(".letter").attr("visibility", "visible");
    const s = this.graphView.g.getTail(e);
    const t = this.graphView.g.getHead(e);
    svgGroup.selectAll("text.letter")
      .text(e.letter)
      .attr("x", (s.x + t.x) / 2)
      .attr("y", (s.y + t.y) / 2);
    const rectSize = 20;
    svgGroup.selectAll("rect.letter")
      .attr("x", (s.x + t.x - rectSize) / 2)
      .attr("y", (s.y + t.y - rectSize) / 2)
      .attr("width", rectSize)
      .attr("height", rectSize);
  }
}

export default class FiniteAutomaton
  <V extends AutomatonVertex, E extends AutomatonEdge> extends Graph<V, E> {
  get name() { return "FiniteAutomaton"; }

  constructor(options: any = {}) {
    options.VertexType = AutomatonVertex;
    options.EdgeType = AutomatonEdge;
    super(options);
  }
}

registerView("FiniteAutomaton", class extends GraphView<AutomatonVertex, AutomatonEdge> {
  constructor(g, svg) {
    super(g, svg, AutomatonVertexView, AutomatonEdgeView);
  }
});
