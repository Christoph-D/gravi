import { Cursor, Highlight, History } from "./historygraph";
import Listenable from "./listenable";
import ManagedPropertiesListenable, { ManagedPropertyDescriptor }
  from "./managed-property";

export class VertexOrEdge extends ManagedPropertiesListenable {
  public id: number;
  public graph: Graph<any, any>;
  public selected: boolean;
  public highlight: Highlight;

  // Notify listeners on the graph that the structure changed.  Also
  // redraws the graph.
  public changeGraphStructure() {
    if(this.graph !== undefined)
      this.graph.dispatch("changeGraphStructure");
    return this;
  }
  // Notify the graph that a redraw is needed.
  public queueRedraw() {
    if(this.graph !== undefined)
      this.graph.dispatch("redrawNeeded");
    return this;
  }

  public toJSON() {
    const w = {};
    for(const p of this.propertyDescriptors != null ? this.propertyDescriptors(): []) {
      // Save only properties different from the default value.
      if(p.shouldBeSaved !== false && this[p.name] !== p.defaultValue)
        w[p.name] = this[p.name];
    }
    return w;
  }

  public toString(): string {
    return `${this.constructor.name}(${JSON.stringify(this)})`;
  }
}

type VertexFilter = (v: Vertex) => boolean;
type EdgeFilter = (e: Edge) => boolean;
type EdgeIdFilter = (e: number) => boolean;

export class Vertex extends VertexOrEdge {
  public outE: number[];
  public inE: number[];
  public label: string;
  public x: number;
  public y: number;

  public outEdgeIds(edgeIdFilter?: EdgeIdFilter): number[] {
    if(edgeIdFilter != null)
      return this.outE.filter(edgeIdFilter);
    return this.outE;
  }

  public inEdgeIds(edgeIdFilter?: EdgeIdFilter): number[] {
    if(edgeIdFilter != null)
      return this.inE.filter(edgeIdFilter);
    return this.inE;
  }

  // Marks all incident edges as modified.  Useful if the vertex shape
  // changes and the edges need to be redrawn.
  public markIncidentEdgesModified() {
    if(this.graph !== undefined) {
      this.graph.outEdges(this).map(e => e.modified = true);
      this.graph.inEdges(this).map(e => e.modified = true);
    }
    return this;
  }
}
Vertex.manageProperties(
  { name: "graph", type: "object", editable: false, shouldBeSaved: false, notify: false },
  { name: "id", type: "number", editable: false, shouldBeSaved: false, defaultValue: undefined },
  { name: "outE", type: "array", editable: false, shouldBeSaved: false },
  { name: "inE", type: "array", editable: false, shouldBeSaved: false },
  { name: "label", type: "string" },
  { name: "x", type: "number", editable: false },
  { name: "y", type: "number", editable: false });
Vertex.onStatic("changeLabel", VertexOrEdge.prototype.changeGraphStructure);
// If we move a vertex, then we need to tell the adjacent edges that
// something happened.
Vertex.onStatic("changeX", function() {
  this.markIncidentEdgesModified();
  this.queueRedraw();
});
Vertex.onStatic("changeY", function() {
  this.markIncidentEdgesModified();
  this.queueRedraw();
});

// Some internal helper functions for vertices, not exported.
function vertexAddOutEdgeId(v: Vertex, edgeId: number) {
  v.outE.push(edgeId);
}
function vertexAddInEdgeId(v: Vertex, edgeId: number) {
  v.inE.push(edgeId);
}

function vertexRemoveEdgeId(v: Vertex, edgeId: number) {
  v.outE = v.outE.filter(e => e !== edgeId);
  v.inE = v.inE.filter(e => e !== edgeId);
}

export class Edge extends VertexOrEdge {
  public head: number;
  public tail: number;
}
Edge.manageProperties(
  { name: "graph", type: "object", editable: false, shouldBeSaved: false, notify: false },
  { name: "id", type: "number", editable: false, shouldBeSaved: false, defaultValue: undefined },
  { name: "head", type: "number", editable: false, defaultValue: undefined },
  { name: "tail", type: "number", editable: false, defaultValue: undefined });

// Helper function for Graph.compressIds()
function idTranslationTable(what: (VertexOrEdge | null)[]) {
  const ids: { [id: number]: number; } = {};
  let j = 0;
  what.map((x, i) => { if(x !== null) ids[i] = j++; });
  return ids;
}

// Types that are sufficient to uniquely identify vertices/edges in
// simple directed graphs.
type VertexDescriptor = { id: number };
type EdgeDescriptor = { tail: number, head: number };

export default class Graph<V extends Vertex, E extends Edge> extends Listenable {
  public get name() { return "Graph"; }
  public get version() { return "1.0"; }

  public readonly history: History;
  public readonly cursor: Cursor;

  private vertices: (V | null)[];
  private edges: (E | null)[];

  // Cache the number of vertices and edges because this.vertices and this.edges
  // might contain null values.
  private numVertices: number;
  private numEdges: number;

  private readonly VertexType: { new(v?: any): V; } & typeof Vertex;
  private readonly EdgeType: { new(e?: any): E; } & typeof Edge;

  constructor({
    VertexType = Vertex,
    EdgeType = Edge,
    numVertices = 0,
    edgeList = [],
  } = {}) {
    super();

    this.VertexType = <any>VertexType;
    this.EdgeType = <any>EdgeType;

    this.vertices = [];
    this.numVertices = 0;
    for(let i = 0; i < numVertices; ++i)
      this.addVertex();

    this.edges = [];
    this.numEdges = 0;
    edgeList.map(e => this.addEdge({ head: e[1], tail: e[0] }));
  }

  public vertexPropertyDescriptors(): ManagedPropertyDescriptor[] {
    return this.VertexType.propertyDescriptors;
  }

  public EdgePropertyDescriptors(): ManagedPropertyDescriptor[] {
    return this.EdgeType.propertyDescriptors;
  }

  public getHead(e: E): V {
    return this.vertices[e.head]!;
  }

  public getTail(e: E): V{
    return this.vertices[e.tail]!;
  }

  public getEdgeById(edgeId: number): E {
    return this.edges[edgeId]!;
  }

  public getVertexById(vertexId: number): V {
    return this.vertices[vertexId]!;
  }

  public outEdges(v: V, edgeFilter?: EdgeFilter): E[] {
    let edges = v.outE.map(edgeId => this.edges[edgeId]!);
    if(edgeFilter != null)
      edges = edges.filter(edgeFilter);
    return edges;
  }

  public outNeighbors(v: V, vertexFilter?: VertexFilter, edgeFilter?: EdgeFilter): V[] {
    let vertices = this.outEdges(v, edgeFilter).map(e => this.vertices[e.head]!);
    if(vertexFilter != null)
      vertices = vertices.filter(vertexFilter);
    return vertices;
  }

  public inEdges(v: V, edgeFilter?: EdgeFilter): E[] {
    let edges = v.inE.map(edgeId => this.edges[edgeId]!);
    if(edgeFilter != null)
      edges = edges.filter(edgeFilter);
    return edges;
  }

  public inNeighbors(v: V, vertexFilter?: VertexFilter, edgeFilter?: EdgeFilter): V[] {
    let vertices = this.inEdges(v, edgeFilter).map(e => this.vertices[e.tail]!);
    if(vertexFilter != null)
      vertices = vertices.filter(vertexFilter);
    return vertices;
  }

  // Throws an Error if the edge does not exist.
  public findEdge(e: EdgeDescriptor): E {
    for(const f of this.edges)
      if(f !== null && e.head === f.head && e.tail === f.tail)
        return f;
    throw Error(`Not an edge: ${e.tail} -> ${e.head}`);
  }

  public hasEdge(e: EdgeDescriptor): boolean {
    for(const f of this.edges)
      if(f !== null && e.head === f.head && e.tail === f.tail)
        return true;
    return false;
  }

  // Throws an Error if the vertex does not exist.
  public findVertex(v: VertexDescriptor): V {
    if(this.vertices[v.id] != null)
      return this.vertices[v.id]!;
    else
      throw Error(`Invalid vertex id: ${v.id}`);
  }

  public hasVertex(v: VertexDescriptor): boolean {
    return this.vertices[v.id] != null;
  }

  // Runtime: O(n).
  public getVertices(vertexFilter?: VertexFilter): V[] {
    if(vertexFilter != null)
      return <V[]>this.vertices.filter(v => v != null && vertexFilter!(v));
    else
      return <V[]>this.vertices.filter(v => v != null);
  }

  // Runtime: O(m).
  public getEdges(edgeFilter?: EdgeFilter): E[] {
    if(edgeFilter != null)
      return <E[]>this.edges.filter(e => e !== null && edgeFilter!(e));
    else
      return <E[]>this.edges.filter(e => e !== null);
  }

  // Equivalent to this.getVertices().length, but in time O(1).
  public numberOfVertices(): number {
    return this.numVertices;
  }

  // Equivalent to this.getEdges().length, but in time O(1).
  public numberOfEdges(): number {
    return this.numEdges;
  }

  // Adds a null vertex to the graph.  The observable effect is that the next
  // free vertex id (used for the next new vertex) will be one higher.
  public addNullVertex(): void {
    this.vertices.push(null);
  }

  public addVertex(vertexArguments?: {}): V {
    const v = new this.VertexType(vertexArguments);
    v.id = this.vertices.length;
    v.graph = this;
    this.vertices.push(v);
    ++this.numVertices;
    this.dispatch("postAddVertex", v);
    return v;
  }

  public removeVertex(v: VertexDescriptor) {
    const v2 = this.findVertex(v);
    this.inEdges(v2).map(e => this.removeEdge(e));
    this.outEdges(v2).map(e => this.removeEdge(e));
    this.vertices[v2.id] = null;
    --this.numVertices;
    this.dispatch("postRemoveVertex", v2);
    return this;
  }

  // Adds a null edge to the graph.  The observable effect is that the next free
  // edge id (used for the next new edge) will be one higher.
  public addNullEdge(): void {
    this.edges.push(null);
  }

  public addEdge(e: EdgeDescriptor) {
    // Check that we have a valid edge.  Throws for invalid edges.
    this.validateEdge(e);
    // Ignore duplicate edges.
    if(this.hasEdge(e))
      return this;
    const e2 = new this.EdgeType(e);
    e2.id = this.edges.length;
    e2.graph = this;
    vertexAddOutEdgeId(this.vertices[e2.tail]!, e2.id);
    vertexAddInEdgeId(this.vertices[e2.head]!, e2.id);
    this.edges.push(e2);
    ++this.numEdges;
    this.dispatch("postAddEdge", e2);
    return this;
  }

  public removeEdge(e: EdgeDescriptor) {
    const e2 = this.findEdge(e);
    vertexRemoveEdgeId(this.vertices[e2.tail]!, e2.id);
    vertexRemoveEdgeId(this.vertices[e2.head]!, e2.id);
    // We set the entry to null in order to preserve the indices in
    // this.edges.  Removing/adding lots of edges will thus clutter
    // this.edges with null entries.  See this.compressIds().
    this.edges[e2.id] = null;
    --this.numEdges;
    this.dispatch("postRemoveEdge", e2);
    return this;
  }

  // Remove null vertices and edges by reassigning all ids.
  // Postcondition: this.edges and this.vertices will not contain null
  // entries.
  public compressIds() {
    const idsV = idTranslationTable(this.vertices);
    const idsE = idTranslationTable(this.edges);

    // Remove all null entries and then fix all the ids.
    this.vertices = this.getVertices();
    for(const v of this.vertices) {
      v!.id = idsV[v!.id];
      v!.outE = v!.outE.map(i => idsE[i]);
      v!.inE = v!.inE.map(i => idsE[i]);
    }

    this.edges = this.getEdges();
    for(const e of this.edges) {
      e!.id = idsE[e!.id];
      e!.tail = idsV[e!.tail];
      e!.head = idsV[e!.head];
    }
    return this;
  }

  public toJSON() {
    const g: {
      type: string,
      version: string,
      vertices: any[],
      edges: any[],
    } = {
      type: this.name,
      version: this.version,
      vertices: [],
      edges: [],
    };
    this.vertices.map(v => g.vertices.push(v ? v.toJSON() : null));
    this.edges.map(e => g.edges.push(e ? e.toJSON() : null));
    return g;
  }

  // Throws an error if tail/head could not possibly describe a valid
  // edge.
  private validateEdge(e: { head?: number, tail?: number }): void {
    if(e.head === undefined || e.head === null)
      throw new Error("Missing property \"head\"");
    if(this.vertices[e.head!] == null)
      throw new Error(`Invalid property \"head\". Not a vertex id: ${e.head}`);
    if(e.tail === undefined || e.tail === null)
      throw new Error("Missing property \"tail\"");
    if(this.vertices[e.tail!] == null)
      throw new Error(`Invalid property \"tail\". Not a vertex id: ${e.tail}`);
  }
}
Graph.onStatic("postAddVertex", "changeGraphStructure");
Graph.onStatic("postRemoveVertex", "changeGraphStructure");
Graph.onStatic("postAddEdge", "changeGraphStructure");
Graph.onStatic("postRemoveEdge", "changeGraphStructure");
Graph.onStatic("changeGraphStructure", "redrawNeeded");
