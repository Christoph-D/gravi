import * as G from "graph";

export function circleEdgeAnchor(s, t, distance) {
  const result = { x: s.x, y: s.y };
  if(distance !== 0 && (s.x !== t.x || s.y !== t.y)) {
    const dx = s.x - t.x;
    const dy = s.y - t.y;
    const D = Math.sqrt(dx * dx + dy * dy);
    result.x -= dx / D * distance;
    result.y -= dy / D * distance;
  }
  return result;
}

// Computes and sets the CSS class of a vertex or an edge.
function setCSSClass(editor, svgGroup) {
  const c = [ this.defaultCSSClass, this.highlight.getCSSClass() ];
  if(editor.selection === this)
    c.push("selected");
  // We cannot cache the CSS class because d3 reuses <g> elements.
  return svgGroup.attr("class", c.join(" "));
}

export class VertexDrawableDefault {
  drawEnter(editor, svgGroup) {}
  drawUpdate(editor, svgGroup) { this.setCSSClass(editor, svgGroup); }
  static setCSSClass(editor, svgGroup) { setCSSClass(editor, svgGroup); }
  static get defaultCSSClass() { return "vertex"; }
}

// Mixin to draw a vertex with a circular shape.
export class VertexDrawableCircular extends VertexDrawableDefault {
  get radius() { return 10; }
  edgeAnchor(otherNode, distanceOffset = 0) {
    circleEdgeAnchor(this, otherNode, distanceOffset + this.radius);
  }
  drawEnter(editor, svgGroup) {
    svgGroup.append("circle").attr("class", "main").attr("r", this.radius);
    super.drawEnter(editor, svgGroup);
  }
  drawUpdate(editor, svgGroup) {
    svgGroup.selectAll("circle.main")
      .attr("cx", this.x)
      .attr("cy", this.y);
    super.drawUpdate(editor, svgGroup);
  }
}

export class EdgeDrawableDefault {
  get defaultCSSClass() { return "edge"; }
}
// Same behavior as default vertices.
EdgeDrawableDefault.prototype.drawEnter = VertexDrawableDefault.prototype.drawEnter;
EdgeDrawableDefault.prototype.drawUpdate = VertexDrawableDefault.prototype.drawUpdate;
EdgeDrawableDefault.prototype.setCSSClass = setCSSClass;

// Mixin to draw an edge with an arrow at its head.
export class EdgeDrawable extends EdgeDrawableDefault {
  drawEnter(editor, svgGroup) {
    svgGroup.append("line").attr("class", "main");
    svgGroup.append("line").attr("class", "click-target");
    super.drawEnter(editor, svgGroup);
  }
  drawUpdate(editor, svgGroup) {
    const s = this.graph.vertices[this.tail];
    const t = this.graph.vertices[this.head];
    const anchorS = s.edgeAnchor(t);
    const anchorT = t.edgeAnchor(s, 10);
    // Don't draw edges pointing in the inverse direction.
    const xSign = s.x > t.x ? -1 : 1;
    const ySign = s.y > t.y ? -1 : 1;
    const xSign2 = anchorS.x >= anchorT.x ? -1 : 1;
    const ySign2 = anchorS.y >= anchorT.y ? -1 : 1;
    if(xSign !== xSign2 && ySign !== ySign2) {
      svgGroup.selectAll("line.main, line.click-target")
        .attr("visibility", "hidden");
    }
    else {
      svgGroup.selectAll("line.main, line.click-target")
        .attr("visibility", "visible")
        .attr("x1", anchorS.x)
        .attr("y1", anchorS.y)
        .attr("x2", anchorT.x)
        .attr("y2", anchorT.y);
    }
    super.drawUpdate(editor, svgGroup);
  }
}

export class SimpleGraph extends G.Graph {
  get version() { return "0.1"; }

  init() {
    this.VertexType = this.VertexType.newTypeWithMixin(G.VertexDrawableCircular);
    this.VertexType.onStatic("changeLabel", () => this.dispatch("redrawNeeded"));

    this.EdgeType = this.EdgeType.newTypeWithMixin(G.EdgeDrawable);
  }
}
