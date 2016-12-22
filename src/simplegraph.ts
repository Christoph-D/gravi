import Graph, { Edge, Vertex } from "./graph";

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
export class VertexDrawableDefault extends Vertex {
  get defaultCSSClass() { return "vertex"; }
  public drawEnter(editor?, svgGroup?) {}
  public drawUpdate(editor?, svgGroup?) {};
  public edgeAnchor(otherNode, distanceOffset = 0) { return { x: 0, y: 0 }; }
}
VertexDrawableDefault.prototype.drawUpdate = setCSSClass;

// A vertex with a circular shape.
export class VertexDrawableCircular extends VertexDrawableDefault {
  get radius() { return 10; }
  public edgeAnchor(otherNode, distanceOffset = 0) {
    return circleEdgeAnchor(this, otherNode, distanceOffset + this.radius);
  }
  public drawEnter(editor, svgGroup) {
    super.drawEnter(editor, svgGroup);
    svgGroup.append("circle").attr("class", "main").attr("r", this.radius);
  }
  public drawUpdate(editor, svgGroup) {
    super.drawUpdate(editor, svgGroup);
    svgGroup.selectAll("circle.main")
      .attr("cx", this.x)
      .attr("cy", this.y);
  }
}

export class EdgeDrawableDefault extends Edge {
  get defaultCSSClass() { return "edge"; }
  public drawEnter(editor?, svgGroup?) {}
  public drawUpdate(editor?, svgGroup?) {};
}
EdgeDrawableDefault.prototype.drawUpdate = setCSSClass;
// Same behavior as default vertices.
//EdgeDrawableDefault.prototype.drawEnter = VertexDrawableDefault.prototype.drawEnter;
//EdgeDrawableDefault.prototype.drawUpdate = VertexDrawableDefault.prototype.drawUpdate;
//EdgeDrawableDefault.prototype.setCSSClass = setCSSClass;

// An edge with an arrow at its head.
export class EdgeDrawable extends EdgeDrawableDefault {
  public drawEnter(editor, svgGroup) {
    super.drawEnter(editor, svgGroup);
    svgGroup.append("line").attr("class", "main");
    svgGroup.append("line").attr("class", "click-target");
  }
  public drawUpdate(editor, svgGroup) {
    super.drawUpdate(editor, svgGroup);
    const s = this.graph.getTail(this);
    const t = this.graph.getHead(this);
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

export default class SimpleGraph
  <V extends VertexDrawableCircular, E extends EdgeDrawable>
  extends Graph<V,E> {
  public get name() { return "SimpleGraph"; }
  public get version() { return "0.1"; }

  constructor(options: any = {}) {
    options.VertexType = VertexDrawableCircular;
    options.EdgeType = EdgeDrawable;
    super(options);
  }
}
