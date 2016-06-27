import Graph, { VertexI, EdgeI } from "./graph";

export function circleEdgeAnchor(s, t, distance: number): { x: number, y: number } {
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

// A vertex with basic draw functionality.
export class VertexDrawableDefaultI<V extends VertexI<V,E>, E extends EdgeI<V,E>>
  extends VertexI<V,E> {
  get defaultCSSClass() { return "vertex"; }
  drawEnter(editor?, svgGroup?) {}
  drawUpdate(editor?, svgGroup?) {};
  edgeAnchor(otherNode, distanceOffset = 0) { return { x: 0, y: 0 }; }
}
VertexDrawableDefaultI.prototype.drawUpdate = setCSSClass;
export type VertexDrawableDefault = VertexDrawableDefaultI<any, any>;

// A vertex with a circular shape.
export class VertexDrawableCircularI<V extends VertexI<V,E>, E extends EdgeI<V,E>>
  extends VertexDrawableDefaultI<V,E> {
  get radius() { return 10; }
  edgeAnchor(otherNode, distanceOffset = 0) {
    return circleEdgeAnchor(this, otherNode, distanceOffset + this.radius);
  }
  drawEnter(editor, svgGroup) {
    super.drawEnter(editor, svgGroup);
    svgGroup.append("circle").attr("class", "main").attr("r", this.radius);
  }
  drawUpdate(editor, svgGroup) {
    super.drawUpdate(editor, svgGroup);
    svgGroup.selectAll("circle.main")
      .attr("cx", this.x)
      .attr("cy", this.y);
  }
}
export type VertexDrawableCircular = VertexDrawableCircularI<any, any>;

export class EdgeDrawableDefaultI<V extends VertexI<V,E>, E extends EdgeI<V,E>>
  extends EdgeI<V,E> {
  get defaultCSSClass() { return "edge"; }
  drawEnter(editor?, svgGroup?) {}
  drawUpdate(editor?, svgGroup?) {};
}
EdgeDrawableDefaultI.prototype.drawUpdate = setCSSClass;
export type EdgeDrawableDefault = EdgeDrawableDefaultI<any, any>;
// Same behavior as default vertices.
//EdgeDrawableDefault.prototype.drawEnter = VertexDrawableDefault.prototype.drawEnter;
//EdgeDrawableDefault.prototype.drawUpdate = VertexDrawableDefault.prototype.drawUpdate;
//EdgeDrawableDefault.prototype.setCSSClass = setCSSClass;

// An edge with an arrow at its head.
export class EdgeDrawableI<V extends VertexI<V,E>, E extends EdgeI<V,E>>
  extends EdgeDrawableDefaultI<V,E> {
  drawEnter(editor, svgGroup) {
    super.drawEnter(editor, svgGroup);
    svgGroup.append("line").attr("class", "main");
    svgGroup.append("line").attr("class", "click-target");
  }
  drawUpdate(editor, svgGroup) {
    super.drawUpdate(editor, svgGroup);
    const s = this.graph.vertices[this.tail];
    const t = this.graph.vertices[this.head];
    const anchorS = (<any>s).edgeAnchor(t);
    const anchorT = (<any>t).edgeAnchor(s, 10);
    // Don't draw edges pointing in the inverse direction.
    const xSign = s.x > t.x ? -1 : 1;
    const ySign = s.y > t.y ? -1 : 1;
    const xSign2 = anchorS.x >= anchorT.x ? -1 : 1;
    const ySign2 = anchorS.y >= anchorT.y ? -1 : 1;
    if(xSign !== xSign2 && ySign !== ySign2) {
      svgGroup.selectAll("line.main, line.click-target")
        .attr("visibility", "hidden");
    } else {
      svgGroup.selectAll("line.main, line.click-target")
        .attr("visibility", "visible")
        .attr("x1", anchorS.x)
        .attr("y1", anchorS.y)
        .attr("x2", anchorT.x)
        .attr("y2", anchorT.y);
    }
  }
}
export type EdgeDrawable = EdgeDrawableI<any, any>;

export default class SimpleGraph
  <V extends VertexDrawableCircularI<V,E>, E extends EdgeDrawableI<V,E>>
  extends Graph<V,E> {
  get name() { return "SimpleGraph"; }
  get version() { return "0.1"; }

  constructor(options: any = {}) {
    options.VertexType = VertexDrawableCircularI;
    options.EdgeType = EdgeDrawableI;
    super(options);
  }
}
