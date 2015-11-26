import Graph from "./graph";
// For H.VertexDrawableCircular and H.EdgeDrawable
import { VertexDrawableCircular, EdgeDrawable } from "./simplegraph";
import addListenableProperty from "./listenable-property";

const accepting = {
  name: "accepting",
  type: "boolean",
  defaultValue: false
};

class VertexDrawableFiniteAutomaton
extends addListenableProperty(VertexDrawableCircular, accepting) {
  drawEnter(editor, svgGroup) {
    super.drawEnter(editor, svgGroup);
    svgGroup.append("circle").attr("class", "accepting accepting1").attr("r", this.radius - 1);
    svgGroup.append("circle").attr("class", "accepting accepting2").attr("r", this.radius - 4);
  }
  drawUpdate(editor, svgGroup) {
    super.drawUpdate(editor, svgGroup);
    const opacity = this.accepting ? 1 : 0;
    svgGroup.selectAll("circle.accepting")
      .attr("cx", this.x)
      .attr("cy", this.y)
      .style("stroke-opacity", opacity);
  }
}

const letter = {
  name: "letter",
  type: "string",
  defaultValue: ""
};

class EdgeDrawableFiniteAutomaton
extends addListenableProperty(EdgeDrawable, letter) {
  drawEnter(editor, svgGroup) {
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
  drawUpdate(editor, svgGroup) {
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

export default class FiniteAutomaton extends Graph {
  get name() { return "FiniteAutomaton"; }

  init() {
    this.VertexType = class extends VertexDrawableFiniteAutomaton {};
    this.VertexType.onStatic("changeAccepting", function() { this.dispatch("redrawNeeded"); });

    this.EdgeType = class extends EdgeDrawableFiniteAutomaton {};
    this.EdgeType.onStatic("changeLetter", function() { this.dispatch("redrawNeeded"); });
  }
}
