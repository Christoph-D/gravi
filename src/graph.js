import Extensible from "./extensible";
import * as CustomProperty from "./customproperty";
import Listenable from "./event";

function vertexOrEdgeToJSON(v) {
  if(v === null)
    return null;
  const w = {};
  for(let p of v.propertyDescriptors != null ? v.propertyDescriptors() : []) {
    // Save only properties different from the default value.
    if(p.shouldBeSaved !== false && v[p.name] !== p.defaultValue)
      w[p.name] = v[p.name];
  }
  return w;
}

export class Vertex extends CustomProperty.addMany(Listenable, [
  { name: "graph", type: "object", editable: false, shouldBeSaved: false, notify: false },
  { name: "id", type: "number", editable: false, shouldBeSaved: false, defaultValue: undefined },
  { name: "outE", type: "array", editable: false, shouldBeSaved: false },
  { name: "inE", type: "array", editable: false, shouldBeSaved: false },
  { name: "label", type: "string" },
  { name: "x", type: "number", editable: false },
  { name: "y", type: "number", editable: false }])
{
  addOutEdge(edgeId) {
    this.outE.push(edgeId);
    return this;
  }
  addInEdge(edgeId) {
    this.inE.push(edgeId);
    return this;
  }

  removeEdgeId(edgeId) {
    this.outE = this.outE.filter(e => e != edgeId);
    this.inE = this.inE.filter(e => e != edgeId);
    return this;
  }

  // this.outE contains only the ids of outgoing edges.  this.outEdges()
  // returns the corresponding list of Edge objects.
  outEdges(edgeFilter) {
    let edges = this.outE.map(edgeId => this.graph.edges[edgeId]);
    if(edgeFilter != null)
      edges = edges.filter(edgeFilter);
    return edges;
  }
  inEdges(edgeFilter) {
    let edges = this.inE.map(edgeId => this.graph.edges[edgeId]);
    if(edgeFilter != null)
      edges = edges.filter(edgeFilter);
    return edges;
  }

  // Returns a list of Vertex objects.
  outNeighbors(vertexFilter, edgeFilter) {
    let vertices = this.outEdges(edgeFilter).map(e => this.graph.vertices[e.head]);
    if(vertexFilter != null)
      vertices = vertices.filter(vertexFilter);
    return vertices;
  }
  inNeighbors(vertexFilter, edgeFilter) {
    let vertices = this.inEdges(edgeFilter).map(e => this.graph.vertices[e.tail]);
    if(vertexFilter != null)
      vertices = vertices.filter(vertexFilter);
    return vertices;
  }

  // Marks all incident edges as modified.  Useful if the vertex shape
  // changes and the edges need to be redrawn.
  markIncidentEdgesModified() {
    this.outEdges().map(e => e.modified = true);
    this.inEdges().map(e => e.modified = true);
    return this;
  }
}

export class Edge extends CustomProperty.addMany(Listenable, [
  { name: "graph", type: "object", editable: false, shouldBeSaved: false, notify: false },
  { name: "id", type: "number", editable: false, shouldBeSaved: false, defaultValue: undefined },
  { name: "head", type: "number", editable: false, defaultValue: undefined },
  { name: "tail", type: "number", editable: false, defaultValue: undefined }])
{
  // No methods here.  Everything is in custom properties.
}

// Helper function for Graph.compressIds()
function idTranslationTable(what) {
  const ids = {};
  let j = 0;
  what.map((x, i) => { if(x != null) ids[i] = j++; });
  return ids;
}

export default class Graph extends Listenable {
  get name() { return "Graph"; }

  constructor(options = {}) {
    super();
    this.VertexType = options.VertexType != null ? options.VertexType : Vertex;
    this.EdgeType = options.EdgeType != null ? options.EdgeType : Edge;

    if(this.init != null)
      this.init(options);

    this.vertices = [];
    if(options.numVertices != null && options.numVertices > 0)
      for(let i = 0; i < options.numVertices; ++i)
        this.addVertex(new this.VertexType);
    this.edges = [];
    if(options.edgeList != null)
      options.edgeList.map(e => this.addEdge(e[0], e[1]));
  }

  addVertex(v) {
    v.id = this.vertices.length;
    v.graph = this;
    this.vertices.push(v);
    this.dispatch('postAddVertex', v);
    return this;
  }

  removeVertex(v) {
    for(let [i, w] of this.vertices.entries()) {
      if(w === null)
        continue;
      if(v === w) {
        v.inEdges().map(e => this.removeEdge(e));
        v.outEdges().map(e => this.removeEdge(e));
        this.vertices[i] = null;
        this.dispatch('postRemoveVertex');
        return this;
      }
    }
    return this;
  }

  parseEdge(tail, head) {
    let e;
    if(head == null)
      e = tail; // assume that tail is already an Edge object
    else
      e = new this.EdgeType({ tail: tail, head: head });
    if(e.tail == null)
      throw new Error("Missing property \"tail\"");
    if(this.vertices[e.tail] == null)
      throw new Error(`Invalid property \"tail\". Not a vertex id: ${e.tail}`);
    if(e.head == null)
      throw new Error("Missing property \"head\"");
    if(this.vertices[e.head] == null)
      throw new Error(`Invalid property \"head\". Not a vertex id: ${e.head}`);
    return e;
  }

  addEdge(tail, head) {
    const e = this.parseEdge(tail, head);
    if(this.hasEdge(e))
      return this; // no duplicate edges
    e.id = this.edges.length;
    e.graph = this;
    this.vertices[e.tail].addOutEdge(e.id);
    this.vertices[e.head].addInEdge(e.id);
    this.edges.push(e);
    this.dispatch('postAddEdge', e);
    return this;
  }

  // Accepts a single Edge object or tail, head.  Ignores the edge id.
  removeEdge(tail, head) {
    const e = this.parseEdge(tail, head);
    for(let [i, f] of this.edges.entries()) {
      if(f == null)
        continue;
      if(e.head === f.head && e.tail === f.tail) {
        this.vertices[e.tail].removeEdgeId(i);
        this.vertices[e.head].removeEdgeId(i);
        // We set the entry to null in order to preserve the indices in
        // this.edges.  Removing/adding lots of edges will thus clutter
        // this.edges with null entries.  See this.compressIds().
        this.edges[i] = null;
        this.dispatch('postRemoveEdge', f);
        return this;
      }
    }
    return this;
  }

  // Removes null vertices and edges by reassigning all ids.
  compressIds() {
    const idsV = idTranslationTable(this.vertices);
    const idsE = idTranslationTable(this.edges);

    // Remove all null entries and then fix all the ids.
    this.vertices = this.getVertices();
    for(let v of this.vertices) {
      v.id = idsV[v.id];
      v.outE = v.outE.map(i => idsE[i]);
      v.inE = v.inE.map(i => idsE[i]);
    }

    this.edges = this.getEdges();
    for(let e of this.edges) {
      e.id = idsE[e.id];
      e.tail = idsV[e.tail];
      e.head = idsV[e.head];
    }
    return this;
  }

  hasEdge(tail, head) {
    const e = this.parseEdge(tail, head);
    for(let f of this.getEdges())
      if(e.head === f.head && e.tail === f.tail)
        return true;
    return false;
  }

  getVertices(vertexFilter) {
    if(vertexFilter != null)
      return this.vertices.filter(v => v != null && vertexFilter(v));
    else
      return this.vertices.filter(v => v != null);
  }
  getEdges(edgeFilter) {
    if(edgeFilter != null)
      return this.edges.filter(e => e != null && edgeFilter(e));
    else
      return this.edges.filter(e => e != null);
  }

  toJSON() {
    const g = { type: this.name, version: this.version, vertices: [], edges: [] };
    this.vertices.map(v => g.vertices.push(vertexOrEdgeToJSON(v)));
    this.edges.map(e => g.edges.push(vertexOrEdgeToJSON(e)));
    return g;
  }
}