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
}

export class Vertex extends VertexOrEdge {
  public outE: number[];
  public inE: number[];
  public label: string;
  public x: number;
  public y: number;

  public addOutEdge(edgeId: number) {
    this.outE.push(edgeId);
    return this;
  }
  public addInEdge(edgeId: number) {
    this.inE.push(edgeId);
    return this;
  }

  public removeEdgeId(edgeId) {
    this.outE = this.outE.filter(e => e !== edgeId);
    this.inE = this.inE.filter(e => e !== edgeId);
    return this;
  }

  // this.outE contains only the ids of outgoing edges.  this.outEdges()
  // returns the corresponding list of Edge objects.
  public outEdges(edgeFilter?): Edge[] {
    let edges = this.outE.map(edgeId => this.graph.edges[edgeId]);
    if(edgeFilter != null)
      edges = edges.filter(edgeFilter);
    return edges;
  }
  public inEdges(edgeFilter?): Edge[] {
    let edges = this.inE.map(edgeId => this.graph.edges[edgeId]);
    if(edgeFilter != null)
      edges = edges.filter(edgeFilter);
    return edges;
  }

  // Returns a list of Vertex objects.
  public outNeighbors(vertexFilter?, edgeFilter?): this[] {
    let vertices = this.outEdges(edgeFilter).map(e => this.graph.vertices[e.head]);
    if(vertexFilter != null)
      vertices = vertices.filter(vertexFilter);
    return vertices;
  }
  public inNeighbors(vertexFilter?, edgeFilter?): this[] {
    let vertices = this.inEdges(edgeFilter).map(e => this.graph.vertices[e.tail]);
    if(vertexFilter != null)
      vertices = vertices.filter(vertexFilter);
    return vertices;
  }

  // Marks all incident edges as modified.  Useful if the vertex shape
  // changes and the edges need to be redrawn.
  public markIncidentEdgesModified() {
    this.outEdges().map(e => e.modified = true);
    this.inEdges().map(e => e.modified = true);
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

// Helper function for Graph.toJSON()
function vertexOrEdgeToJSON(v: VertexOrEdge | null) {
  if(v === null)
    return null;
  const w = {};
  for(const p of v.propertyDescriptors != null ? v.propertyDescriptors(): []) {
    // Save only properties different from the default value.
    if(p.shouldBeSaved !== false && v[p.name] !== p.defaultValue)
      w[p.name] = v[p.name];
  }
  return w;
}

// Types that are sufficient to uniquely identify vertices/edges in
// simple directed graphs.
type VertexDescriptor = { id: number };
type EdgeDescriptor = { tail: number, head: number };

export default class Graph<V extends Vertex, E extends Edge> extends Listenable {
  public get name() { return "Graph"; }
  public get version() { return "1.0"; }

  public vertices: (V | null)[];
  public edges: (E | null)[];
  public readonly history: History;
  public readonly cursor: Cursor;

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
    if(numVertices > 0)
      for(let i = 0; i < numVertices; ++i)
        this.addVertex();

    this.edges = [];
    edgeList.map(e => this.addEdge({ head: e[1], tail: e[0] }));
  }

  public vertexPropertyDescriptors(): ManagedPropertyDescriptor[] {
    return this.VertexType.propertyDescriptors;
  }
  public EdgePropertyDescriptors(): ManagedPropertyDescriptor[] {
    return this.EdgeType.propertyDescriptors;
  }

  // Throws an Error if the edge does not exist.
  public findEdge(e: EdgeDescriptor): E {
    for(const f of this.getEdges())
      if(e.head === f.head && e.tail === f.tail)
        return f;
    throw Error(`Not an edge: ${e.tail} -> ${e.head}`);
  }
  public hasEdge(e: EdgeDescriptor): boolean {
    for(const f of this.getEdges())
      if(e.head === f.head && e.tail === f.tail)
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

  public getVertices(vertexFilter?: (v: Vertex) => boolean): V[] {
    if(vertexFilter != null)
      return <V[]>this.vertices.filter(v => v != null && vertexFilter!(v));
    else
      return <V[]>this.vertices.filter(v => v != null);
  }

  public getEdges(edgeFilter?: (e: Edge) => boolean): E[] {
    if(edgeFilter != null)
      return <E[]>this.edges.filter(e => e != null && edgeFilter!(e));
    else
      return <E[]>this.edges.filter(e => e != null);
  }

  public addVertex(vertexArguments?: any): V {
    const v = new this.VertexType(vertexArguments);
    v.id = this.vertices.length;
    v.graph = this;
    this.vertices.push(v);
    this.dispatch("postAddVertex", v);
    return v;
  }

  public removeVertex(v: VertexDescriptor) {
    const v2 = this.findVertex(v);
    v2.inEdges().map(e => this.removeEdge(e));
    v2.outEdges().map(e => this.removeEdge(e));
    this.vertices[v2.id] = null;
    this.dispatch("postRemoveVertex", v2);
    return this;
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
    this.vertices[e2.tail]!.addOutEdge(e2.id);
    this.vertices[e2.head]!.addInEdge(e2.id);
    this.edges.push(e2);
    this.dispatch("postAddEdge", e2);
    return this;
  }

  public removeEdge(e: EdgeDescriptor) {
    const e2 = this.findEdge(e);
    this.vertices[e2.tail]!.removeEdgeId(e2.id);
    this.vertices[e2.head]!.removeEdgeId(e2.id);
    // We set the entry to null in order to preserve the indices in
    // this.edges.  Removing/adding lots of edges will thus clutter
    // this.edges with null entries.  See this.compressIds().
    this.edges[e2.id] = null;
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
    this.vertices.map(v => g.vertices.push(vertexOrEdgeToJSON(v)));
    this.edges.map(e => g.edges.push(vertexOrEdgeToJSON(e)));
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
