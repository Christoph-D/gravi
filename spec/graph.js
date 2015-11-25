import Graph, { Vertex, Edge } from "gravi/graph";
import graphMatcher from "./graphmatcher";

describe("A graph", function() {
  beforeEach(() => jasmine.addMatchers(graphMatcher));

  describe("basic functions", function() {
    let g = {};
    beforeEach(function() {
      g = new Graph({ numVertices: 4, edgeList: [[0,1], [1,2]] });
    });

    function vertexFilter(v) { return v.activeV; }
    function edgeFilter(e) { return e.activeE; }

    it("can access vertices", function() {
      expect(g.vertices.length).toBe(4);
      expect(g.getVertices().length).toBe(4);
    });
    it("can access edges", function() {
      expect(g.edges.length).toBe(2);
      expect(g.getEdges().length).toBe(2);
    });
    it("can filter vertices", function() {
      expect(g.getVertices(vertexFilter).length).toBe(0);
      g.vertices[1].activeV = true;
      expect(g.getVertices(vertexFilter).length).toBe(1);
    });
    it("can filter edges", function() {
      expect(g.getEdges(edgeFilter).length).toBe(0);
      g.edges[1].activeE = true;
      expect(g.getEdges(edgeFilter).length).toBe(1);
    });
    it("can access out-edges", function() {
      expect(g.vertices[1].outEdges()).toEqual([g.edges[1]]);
    });
    it("can access in-edges", function() {
      expect(g.vertices[1].inEdges()).toEqual([g.edges[0]]);
    });
    it("can filter out-edges", function() {
      expect(g.vertices[1].outEdges(edgeFilter)).toEqual([]);
      g.edges[1].activeE = true;
      expect(g.vertices[1].outEdges(edgeFilter)).toEqual([g.edges[1]]);
    });
    it("can filter in-edges", function() {
      expect(g.vertices[1].inEdges(edgeFilter)).toEqual([]);
      g.edges[0].activeE = true;
      expect(g.vertices[1].inEdges(edgeFilter)).toEqual([g.edges[0]]);
    });
    it("can access out-neighbors", function() {
      expect(g.vertices[1].outNeighbors()).toEqual([g.vertices[2]]);
    });
    it("can access in-neighbors", function() {
      expect(g.vertices[1].inNeighbors()).toEqual([g.vertices[0]]);
    });
    it("can filter out-neighbors", function() {
      expect(g.vertices[1].outNeighbors(vertexFilter, edgeFilter)).toEqual([]);
      g.edges[1].activeE = true;
      expect(g.vertices[1].outNeighbors(vertexFilter, edgeFilter)).toEqual([]);
      g.vertices[2].activeV = true;
      expect(g.vertices[1].outNeighbors(vertexFilter, edgeFilter)).toEqual([g.vertices[2]]);
    });
    it("can filter in-neighbors", function() {
      expect(g.vertices[1].inNeighbors(vertexFilter, edgeFilter)).toEqual([]);
      g.edges[0].activeE = true;
      expect(g.vertices[1].inNeighbors(vertexFilter, edgeFilter)).toEqual([]);
      g.vertices[0].activeV = true;
      expect(g.vertices[1].inNeighbors(vertexFilter, edgeFilter)).toEqual([g.vertices[0]]);
    });

    describe("with ordinary vertices/edges", function() {
      it("allows removing edges", function() {
        const g = new Graph({ numVertices: 4, edgeList: [[0,1], [1,2]] });
        const h = new Graph({ numVertices: 4, edgeList: [[1,2]] });
        g.removeEdge(0, 1);
        g.compressIds();
        expect(g).toBeGraphEquivalent(h);
      });
      it("allows adding edges", function() {
        const g = new Graph({ numVertices: 4, edgeList: [[0,1], [1,2]] });
        const h = new Graph({ numVertices: 4, edgeList: [[0,1], [1,2], [0,3]] });
        g.addEdge(0, 3);
        expect(g).toBeGraphEquivalent(h);
      });
      it("allows removing vertices", function() {
        g = new Graph({ numVertices: 4, edgeList: [[0,1], [3,2], [1,2]] });
        const h = new Graph({ numVertices: 3, edgeList: [[2,1]] });
        g.removeVertex(g.vertices[1]);
        g.compressIds();
        expect(g).toBeGraphEquivalent(h);
      });
      it("allows adding vertices", function() {
        const g = new Graph({ numVertices: 4, edgeList: [[0,1], [1,2]] });
        const h = new Graph({ numVertices: 5, edgeList: [[0,1], [1,2]] });
        g.addVertex(new Vertex);
        expect(g).toBeGraphEquivalent(h);
      });
      it("checks head/tail ids of edges in the constructor", function() {
        expect(() => new Graph({ numVertices: 1, edgeList: [[0,1]] }))
          .toThrow(new Error('Invalid property "head". Not a vertex id: 1'));
        expect(() => new Graph({ numVertices: 2, edgeList: [[0,-1]] }))
          .toThrow(new Error('Invalid property "head". Not a vertex id: -1'));
        expect(() => new Graph({ numVertices: 3, edgeList: [[0]] }))
          .toThrow(new Error('Missing property "tail"'));
      });
      it("checks head/tail ids of added edges", function() {
        const g = new Graph({ numVertices: 2 });
        expect(() => g.addEdge({ tail: 0, head: 2 }))
          .toThrow(new Error('Invalid property "head". Not a vertex id: 2'));
        expect(() => g.addEdge(new Edge({ tail: 0, head: 2 })))
          .toThrow(new Error('Invalid property "head". Not a vertex id: 2'));
        expect(() => g.addEdge(new Edge({ tail: 0, head: 1 })))
          .not.toThrow();
        const h = new Graph({ numVertices: 2, edgeList: [[0,1]] });
        expect(g).toBeGraphEquivalent(h);
      });
    });
  });
});
