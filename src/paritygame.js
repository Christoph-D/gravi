import Graph from "./graph";
import { circleEdgeAnchor, VertexDrawableDefault, EdgeDrawable } from "./simplegraph";
import * as CustomProperty from "./customproperty";

// Enum values
const PLAYER0 = 0;
const PLAYER1 = 1;

// The radius for circles is a little larger than for rectangles so
// that the area of the shape is the same.
const radiusR = 11;
const radiusC = Math.round(radiusR * 100 * Math.sqrt(4 / Math.PI)) / 100;
// SVG paths.
const rectangle = `M -${radiusR},-${radiusR} v ${radiusR*2} h ${radiusR*2} v -${radiusR*2} z`;
const circle = `M ${radiusC},0 A ${radiusC},${radiusC} 0 1,0 ${radiusC},0.00001 z`;

// Vertex that is either a rectangle (player 1) or a circle (player
// 0).  Also the priority is drawn inside the vertex.
class VertexDrawableParity extends VertexDrawableDefault {
  edgeAnchor(otherNode, distanceOffset = 0) {
    if(this.x == otherNode.x && this.y == otherNode.y)
      return { x: this.x, y: this.y };
    if(this.player == PLAYER0)
      return circleEdgeAnchor(this, otherNode, distanceOffset + this._radiusC);
    else {
      // Calculate the intersection between the line this -> otherNode
      // and a square of width 2*this._radiusR centered at otherNode.
      const dx = otherNode.x - this.x;
      const dy = otherNode.y - this.y;
      const s = dy / dx;
      const result = {};
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
      if(distanceOffset != 0) {
        const D = Math.sqrt(dx * dx + dy * dy);
        result.x += dx / D * distanceOffset;
        result.y += dy / D * distanceOffset;
      }
      return result;
    }
  }
  drawEnter(editor, svgGroup) {
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
  drawUpdate(editor, svgGroup) {
    super.drawUpdate(editor, svgGroup);
    svgGroup.attr("transform", `translate(${this.x},${this.y})`);
    svgGroup.select("path.main").attr("d", this.player == PLAYER0 ? circle : rectangle);
    const priority = svgGroup.select("text.priority").text(this.priority);
    if(this.priority >= 10 || this.priority < 0)
      priority.attr("font-size", "15");
    else
      priority.attr("font-size", "20");
  }
}

export default class ParityGame extends Graph {
  get name() { return "ParityGame"; }

  static get PLAYER0() { return PLAYER0; }
  static get PLAYER1() { return PLAYER1; }

  get player() {
    return {
      name: "player",
      type: "enum",
      values: [PLAYER0, PLAYER1],
      defaultValue: PLAYER0
    };
  }

  get priority() {
    return {
      name: "priority",
      type: "number",
      defaultValue: 0
    };
  }

  init() {
    this.VertexType = CustomProperty.addMany(VertexDrawableParity, [this.player, this.priority]);

    this.VertexType.onStatic("changePlayer", function() {
      this.markIncidentEdgesModified();
      this.dispatch("redrawNeeded");
    });
    this.VertexType.onStatic("changePriority", () => this.dispatch("redrawNeeded"));

    this.EdgeType = EdgeDrawable;
  }
}
