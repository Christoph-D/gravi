import Graph, { VertexOrEdge } from "./graph";
import { ManagedPropertyDescriptor } from "./managed-property";
import { EdgeDrawable, VertexDrawableCircular } from "./simplegraph";

const accepting: ManagedPropertyDescriptor = {
  defaultValue: false,
  name: "accepting",
  type: "boolean",
};

class VertexDrawableFiniteAutomaton extends VertexDrawableCircular {
  public accepting: boolean;

  public drawEnter(editor, svgGroup) {
    super.drawEnter(editor, svgGroup);
    svgGroup.append("circle").attr("class", "accepting accepting1").attr("r", this.radius - 1);
    svgGroup.append("circle").attr("class", "accepting accepting2").attr("r", this.radius - 4);
  }
  public drawUpdate(editor, svgGroup) {
    super.drawUpdate(editor, svgGroup);
    const opacity = this.accepting ? 1 : 0;
    svgGroup.selectAll("circle.accepting")
      .attr("cx", this.x)
      .attr("cy", this.y)
      .style("stroke-opacity", opacity);
  }
}
VertexDrawableFiniteAutomaton.manageProperties(accepting);
VertexDrawableFiniteAutomaton.onStatic(
  "changeAccepting",
  VertexOrEdge.prototype.changeGraphStructure);

const letter: ManagedPropertyDescriptor = {
  defaultValue: "",
  name: "letter",
  type: "string",
};

class EdgeDrawableFiniteAutomaton extends EdgeDrawable {
  public letter: string;

  public drawEnter(editor, svgGroup) {
    super.drawEnter(editor, svgGroup);
    svgGroup.append("rect").attr("class", "letter")
      .attr("fill", "#FFFFFF")
      .attr("stroke", "none");
    svgGroup.append("text").attr("class", "letter")
      .attr("font-family", "sans-serif")
      .attr("font-size", "20")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central");
  }
  public drawUpdate(editor, svgGroup) {
    super.drawUpdate(editor, svgGroup);
    if(this.letter === "") {
      svgGroup.selectAll(".letter").attr("visibility", "hidden");
      return;
    }
    svgGroup.selectAll(".letter").attr("visibility", "visible");
    const s = this.graph.vertices[this.tail];
    const t = this.graph.vertices[this.head];
    svgGroup.selectAll("text.letter")
      .text(this.letter)
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
EdgeDrawableFiniteAutomaton.manageProperties(letter);
EdgeDrawableFiniteAutomaton.onStatic(
  "changeLetter",
  VertexOrEdge.prototype.changeGraphStructure);

export default class FiniteAutomaton
  <V extends VertexDrawableFiniteAutomaton, E extends EdgeDrawableFiniteAutomaton>
  extends Graph<VertexDrawableFiniteAutomaton, EdgeDrawableFiniteAutomaton> {
  get name() { return "FiniteAutomaton"; }

  constructor(options: any = {}) {
    options.VertexType = VertexDrawableFiniteAutomaton;
    options.EdgeType = EdgeDrawableFiniteAutomaton;
    super(options);
  }
}
