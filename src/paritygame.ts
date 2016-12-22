import Graph, { Vertex, Edge } from "./graph";
import { ManagedPropertyDescriptor } from "./managed-property";
import { ArrowEdgeView, circleEdgeAnchor, GraphView, registerView, VertexView } from "./graphview";

export enum Player { Even, Odd }

const player: ManagedPropertyDescriptor = {
  defaultValue: Player.Even,
  name: "player",
  type: "enum",
  values: [Player.Even, Player.Odd],
};

const priority: ManagedPropertyDescriptor = {
  defaultValue: 0,
  name: "priority",
  type: "number",
};

// Vertex that is either a rectangle (player 1) or a circle (player
// 0).  Also the priority is drawn inside the vertex.
export class ParityGameVertex extends Vertex {
  public player: Player;
  public priority: number;
}
ParityGameVertex.manageProperties(player, priority);
ParityGameVertex.onStatic("changePlayer", function() {
  // Changing the player changes the vertex shape, so we also need to
  // redraw adjacent edges.
  this.markIncidentEdgesModified();
  this.queueRedraw();
  if(this.graph !== undefined)
    this.graph.dispatch("changePlayer", this);
});
ParityGameVertex.onStatic("changePriority", function() {
  this.queueRedraw();
  if(this.graph !== undefined)
    this.graph.dispatch("changePriority", this);
});

// The radius for circles is a little larger than for rectangles so
// that the area of the shape is the same.
const radiusR = 11;
const radiusC = Math.round(radiusR * 100 * Math.sqrt(4 / Math.PI)) / 100;
// SVG paths.
const rectangle = `M -${radiusR},-${radiusR} v ${radiusR*2} h ${radiusR*2} v -${radiusR*2} z`;
const circle = `M ${radiusC},0 A ${radiusC},${radiusC} 0 1,0 ${radiusC},0.00001 z`;

class ParityGameVertexView
  <V extends ParityGameVertex, E extends Edge> extends VertexView<V, E> {
  public edgeAnchor(thisNode, otherNode, distanceOffset = 0) {
    if(thisNode.x === otherNode.x && thisNode.y === otherNode.y)
      return { x: thisNode.x, y: thisNode.y };
    if(thisNode.player === Player.Even)
      return circleEdgeAnchor(thisNode, otherNode, distanceOffset + radiusC);
    // Calculate the intersection between the line this -> otherNode
    // and a square of width 2*radiusR centered at otherNode.
    const dx = otherNode.x - thisNode.x;
    const dy = otherNode.y - thisNode.y;
    const s = dy / dx;
    const result = { x: 0, y: 0 };
    if(s <= -1 || s >= 1) {
      if(otherNode.y < thisNode.y) { // top edge
        result.x = thisNode.x - radiusR / s;
        result.y = thisNode.y - radiusR;
      }
      else { // bottom edge
        result.x = thisNode.x + radiusR / s;
        result.y = thisNode.y + radiusR;
      }
    }
    else {
      if(otherNode.x < thisNode.x) { // left edge
        result.x = thisNode.x - radiusR;
        result.y = thisNode.y - radiusR * s;
      }
      else { // right edge
        result.x = thisNode.x + radiusR;
        result.y = thisNode.y + radiusR * s;
      }
    }
    // If requested, set back the endpoint a little.
    if(distanceOffset !== 0) {
      const D = Math.sqrt(dx * dx + dy * dy);
      result.x += dx / D * distanceOffset;
      result.y += dy / D * distanceOffset;
    }
    return result;
  }
  public drawEnter(v: V, svgGroup) {
    super.drawEnter(v, svgGroup);
    svgGroup.append("path").attr("class", "main");
    svgGroup.append("text").attr("class", "priority")
      .attr("font-family", "sans-serif")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("cursor", "default")
      .style("fill", "#FFFFFF")
      .style("stroke", "none");
  }
  public drawUpdate(v: V, svgGroup) {
    super.drawUpdate(v, svgGroup);
    svgGroup.attr("transform", `translate(${v.x},${v.y})`);
    svgGroup.select("path.main").attr("d", v.player === Player.Even ? circle : rectangle);
    const p = svgGroup.select("text.priority").text(v.priority);
    if(v.priority >= 10 || v.priority < 0)
      p.attr("font-size", "15");
    else
      p.attr("font-size", "20");
  }
}

export default class ParityGame
  <V extends ParityGameVertex, E extends Edge> extends Graph<V, E> {
  public get name() { return "ParityGame"; }

  // The Player enum is exported.  Nonetheless, we add its values as
  // static properties so that they are always available as
  // ParityGame.Even and ParityGame.Odd without explicitly importing
  // the enum.
  public static get Even() { return Player.Even; }
  public static get Odd() { return Player.Odd; }

  constructor(options: any = {}) {
    options.VertexType = ParityGameVertex;
    options.EdgeType = Edge;
    super(options);
  }
}

registerView("ParityGame", class extends GraphView<ParityGameVertex, Edge> {
  constructor(g, svg) {
    super(g, svg, ParityGameVertexView, ArrowEdgeView);
  }
});
