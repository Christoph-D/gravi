import Graph from "./graph";
import { ManagedPropertyDescriptor } from "./managed-property";
import { EdgeDrawable, VertexDrawableDefault, circleEdgeAnchor } from "./simplegraph";

export enum Player { Even, Odd }

// The radius for circles is a little larger than for rectangles so
// that the area of the shape is the same.
const radiusR = 11;
const radiusC = Math.round(radiusR * 100 * Math.sqrt(4 / Math.PI)) / 100;
// SVG paths.
const rectangle = `M -${radiusR},-${radiusR} v ${radiusR*2} h ${radiusR*2} v -${radiusR*2} z`;
const circle = `M ${radiusC},0 A ${radiusC},${radiusC} 0 1,0 ${radiusC},0.00001 z`;

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
export class VertexDrawableParity extends VertexDrawableDefault {
  public player: Player;
  public priority: number;

  public edgeAnchor(otherNode, distanceOffset = 0) {
    if(this.x === otherNode.x && this.y === otherNode.y)
      return { x: this.x, y: this.y };
    if(this.player === Player.Even)
      return circleEdgeAnchor(this, otherNode, distanceOffset + radiusC);
    // Calculate the intersection between the line this -> otherNode
    // and a square of width 2*radiusR centered at otherNode.
    const dx = otherNode.x - this.x;
    const dy = otherNode.y - this.y;
    const s = dy / dx;
    const result = { x: 0, y: 0 };
    if(s <= -1 || s >= 1) {
      if(otherNode.y < this.y) { // top edge
        result.x = this.x - radiusR / s;
        result.y = this.y - radiusR;
      }
      else { // bottom edge
        result.x = this.x + radiusR / s;
        result.y = this.y + radiusR;
      }
    }
    else {
      if(otherNode.x < this.x) { // left edge
        result.x = this.x - radiusR;
        result.y = this.y - radiusR * s;
      }
      else { // right edge
        result.x = this.x + radiusR;
        result.y = this.y + radiusR * s;
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
  public drawEnter(editor, svgGroup) {
    super.drawEnter(editor, svgGroup);
    svgGroup.append("path").attr("class", "main");
    svgGroup.append("text").attr("class", "priority")
      .attr("font-family", "sans-serif")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("cursor", "default")
      .style("fill", "#FFFFFF")
      .style("stroke", "none");
  }
  public drawUpdate(editor, svgGroup) {
    super.drawUpdate(editor, svgGroup);
    svgGroup.attr("transform", `translate(${this.x},${this.y})`);
    svgGroup.select("path.main").attr("d", this.player === Player.Even ? circle : rectangle);
    const p = svgGroup.select("text.priority").text(this.priority);
    if(this.priority >= 10 || this.priority < 0)
      p.attr("font-size", "15");
    else
      p.attr("font-size", "20");
  }
}
VertexDrawableParity.manageProperties(player, priority);
VertexDrawableParity.onStatic("changePlayer", function() {
  // Changing the player changes the vertex shape, so we also need to
  // redraw adjacent edges.
  this.markIncidentEdgesModified();
  this.queueRedraw();
  if(this.graph !== undefined)
    this.graph.dispatch("changePlayer", this);
});
VertexDrawableParity.onStatic("changePriority", function() {
  this.queueRedraw();
  if(this.graph !== undefined)
    this.graph.dispatch("changePriority", this);
});

export default class ParityGame
  <V extends VertexDrawableParity, E extends EdgeDrawable>
  extends Graph<V,E> {
  public get name() { return "ParityGame"; }

  // The Player enum is exported.  Nonetheless, we add its values as
  // static properties so that they are always available as
  // ParityGame.Even and ParityGame.Odd without explicitly importing
  // the enum.
  public static get Even() { return Player.Even; }
  public static get Odd() { return Player.Odd; }

  constructor(options: any = {}) {
    options.VertexType = VertexDrawableParity;
    options.EdgeType = EdgeDrawable;
    super(options);
  }
}
