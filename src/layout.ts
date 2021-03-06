import Graph, { Edge, Vertex } from "./graph";

const SPEED = 0.005;
const IDEAL_EDGE_LENGTH = 100;
const EDGE_STIFFNESS = 1;
const CENTER_PULL = 1;
const VERTEX_REPULSION = 100000;
// If all forces are smaller than this number, consider the layout to
// be finished.
const MIN_FORCE_SQUARED = 1;
// Clamp the minimum distance in the computation to avoid degenerative
// cases.
const MIN_REPULSIVE_DISTANCE_SQUARED = 5;
// Clamp the maximum force to a reasonable value.
const MAX_FORCE_SQUARED = 10000;
// The maximum time delta.
const MAX_STEP_SIZE_MS = 200;

import { ImprovingAlgorithm } from "./algorithm";
export default class GraphLayouter implements ImprovingAlgorithm {

  private graph: Graph<Vertex, Edge>;
  private animationRequestHandle: number | null;

  // Ignores the callback function that is part of the signature of
  // ImprovingAlgorithm.initialize. We do this because the layout
  // algorithm directly changes the graph (more specifically, it
  // changes the x and y attributes of the vertices and nothing more),
  // so there is no need to call back.
  public initialize(g: Graph<Vertex, Edge>) {
    this.graph = g;
  }

  public run() {
    let lastTime: number | null = null;
    const step = (timestamp: number) => {
      if(lastTime !== null)
        this.step(timestamp - lastTime);
      lastTime = timestamp;
      this.animationRequestHandle = window.requestAnimationFrame(step);
    };
    this.animationRequestHandle = window.requestAnimationFrame(step);
  }

  public cancel() {
    if(this.animationRequestHandle !== null && window.cancelAnimationFrame)
      window.cancelAnimationFrame(this.animationRequestHandle);
    this.animationRequestHandle = null;
  }

  private step(delta: number) {
    if(delta > MAX_STEP_SIZE_MS)
      delta = MAX_STEP_SIZE_MS;
    const vertexForces = {};
    for(const v of this.graph.getVertices()) {
      const p = {
        x: -CENTER_PULL * Math.sign(v.x) * Math.sqrt(Math.abs(v.x)),
        y: -CENTER_PULL * Math.sign(v.y) * Math.sqrt(Math.abs(v.y)),
      };
      vertexForces[v.id] = p;
      // Add repulsive force.
      for(const w of this.graph.getVertices()) {
        const d = { x: v.x - w.x, y: v.y - w.y };
        let distance2 = d.x * d.x + d.y * d.y;
        if(distance2 < MIN_REPULSIVE_DISTANCE_SQUARED)
          distance2 = MIN_REPULSIVE_DISTANCE_SQUARED;
        const distance = Math.sqrt(distance2);
        vertexForces[v.id].x += VERTEX_REPULSION * (d.x / distance) / distance2;
        vertexForces[v.id].y += VERTEX_REPULSION * (d.y / distance) / distance2;
      }
    }
    // Add spring force.
    for(const e of this.graph.getEdges()) {
      const v = this.graph.findVertex({ id: e.tail });
      const w = this.graph.findVertex({ id: e.head });
      const d = { x: v.x - w.x, y: v.y - w.y };
      const edgeLength = Math.sqrt(d.x * d.x + d.y * d.y);
      const springForce = EDGE_STIFFNESS * (IDEAL_EDGE_LENGTH - edgeLength);
      vertexForces[v.id].x += springForce * (d.x / edgeLength);
      vertexForces[v.id].y += springForce * (d.y / edgeLength);
      vertexForces[w.id].x -= springForce * (d.x / edgeLength);
      vertexForces[w.id].y -= springForce * (d.y / edgeLength);
    }
    // Compute the maximum force over all vertices and bound the force
    // on each vertex.
    let maxForce2 = 0;
    // We do not apply force to the selected vertex.
    for(const v of this.graph.getVertices((w) => !w.selected)) {
      const f = vertexForces[v.id];
      const f2 = f.x * f.x + f.y * f.y;
      if(f2 > maxForce2)
        maxForce2 = f2;
      if(f2 > MAX_FORCE_SQUARED) {
        const correctionFactor = Math.sqrt(MAX_FORCE_SQUARED / f2);
        f.x *= correctionFactor;
        f.y *= correctionFactor;
      }
    }
    // If all forces are tiny, we do nothing.
    if(maxForce2 < MIN_FORCE_SQUARED)
      return;
    // If we have a sufficiently large force, apply all of them.
    for(const v of this.graph.getVertices((w) => !w.selected)) {
      v.x += SPEED * delta * vertexForces[v.id].x;
      v.y += SPEED * delta * vertexForces[v.id].y;
    }
  }
}
