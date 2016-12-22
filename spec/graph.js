import Graph from "gravi/graph";
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
      expect(g.numberOfVertices()).toBe(4);
      expect(g.getVertices().length).toBe(4);
    });
    it("can access edges", function() {
      expect(g.edges.length).toBe(2);
      expect(g.numberOfEdges()).toBe(2);
      expect(g.getEdges().length).toBe(2);
    });
    it("can check individual edges", function() {
      expect(g.hasEdge({ head: 1, tail: 0 })).toBe(true);
      expect(g.hasEdge({ head: 0, tail: 1 })).toBe(false);
    });
    it("can find individual edges", function() {
      expect(g.findEdge({ head: 1, tail: 0 })).toBe(g.edges[0]);
    });
    it("cannot find non-existent edges", function() {
      expect(() => g.findEdge({ head: 0, tail: 1 }))
        .toThrow(new Error("Not an edge: 1 -> 0"));
    });
    it("can get individual vertices", function() {
      expect(g.findVertex({ id: 1 })).toBe(g.vertices[1]);
    });
    it("cannot get non-existent vertices", function() {
      expect(() => g.findVertex({ id: 4 }))
        .toThrow(new Error("Invalid vertex id: 4"));
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
      expect(g.outEdges(g.vertices[1])).toEqual([g.edges[1]]);
    });
    it("can access in-edges", function() {
      expect(g.inEdges(g.vertices[1])).toEqual([g.edges[0]]);
    });
    it("can filter out-edges", function() {
      expect(g.outEdges(g.vertices[1], edgeFilter)).toEqual([]);
      g.edges[1].activeE = true;
      expect(g.outEdges(g.vertices[1], edgeFilter)).toEqual([g.edges[1]]);
    });
    it("can filter in-edges", function() {
      expect(g.inEdges(g.vertices[1], edgeFilter)).toEqual([]);
      g.edges[0].activeE = true;
      expect(g.inEdges(g.vertices[1], edgeFilter)).toEqual([g.edges[0]]);
    });
    it("can access out-neighbors", function() {
      expect(g.outNeighbors(g.vertices[1])).toEqual([g.vertices[2]]);
    });
    it("can access in-neighbors", function() {
      expect(g.inNeighbors(g.vertices[1])).toEqual([g.vertices[0]]);
    });
    it("can filter out-neighbors", function() {
      expect(g.outNeighbors(g.vertices[1], vertexFilter, edgeFilter)).toEqual([]);
      g.edges[1].activeE = true;
      expect(g.outNeighbors(g.vertices[1], vertexFilter, edgeFilter)).toEqual([]);
      g.vertices[2].activeV = true;
      expect(g.outNeighbors(g.vertices[1], vertexFilter, edgeFilter)).toEqual([g.vertices[2]]);
    });
    it("can filter in-neighbors", function() {
      expect(g.inNeighbors(g.vertices[1], vertexFilter, edgeFilter)).toEqual([]);
      g.edges[0].activeE = true;
      expect(g.inNeighbors(g.vertices[1], vertexFilter, edgeFilter)).toEqual([]);
      g.vertices[0].activeV = true;
      expect(g.inNeighbors(g.vertices[1], vertexFilter, edgeFilter)).toEqual([g.vertices[0]]);
    });

    it("updates outgoing edges when moving a vertex", function() {
      g.edges[0].modified = false;
      g.vertices[0].x = 1;
      expect(g.edges[0].modified).toBe(true);
    });
    it("updates incoming edges when moving a vertex", function() {
      g.edges[0].modified = false;
      g.vertices[1].x = 1;
      expect(g.edges[0].modified).toBe(true);
    });

    describe("with ordinary vertices/edges", function() {
      it("allows removing edges", function() {
        const g = new Graph({ numVertices: 4, edgeList: [[0,1], [1,2]] });
        const h = new Graph({ numVertices: 4, edgeList: [[1,2]] });
        g.removeEdge({ head: 1, tail: 0 });
        g.compressIds();
        expect(g).toBeGraphEquivalent(h);
      });
      it("allows adding edges", function() {
        const g = new Graph({ numVertices: 4, edgeList: [[0,1], [1,2]] });
        const h = new Graph({ numVertices: 4, edgeList: [[0,1], [1,2], [0,3]] });
        g.addEdge({ head: 3, tail: 0 });
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
        g.addVertex();
        expect(g).toBeGraphEquivalent(h);
      });
      it("checks head/tail ids of edges in the constructor", function() {
        expect(() => new Graph({ numVertices: 1, edgeList: [[0,1]] }))
          .toThrow(new Error('Invalid property "head". Not a vertex id: 1'));
        expect(() => new Graph({ numVertices: 2, edgeList: [[0,-1]] }))
          .toThrow(new Error('Invalid property "head". Not a vertex id: -1'));
        expect(() => new Graph({ numVertices: 3, edgeList: [[0]] }))
          .toThrow(new Error('Missing property "head"'));
      });
      it("checks head/tail ids of added edges", function() {
        const g = new Graph({ numVertices: 2 });
        expect(() => g.addEdge({ head: 2, tail: 0 }))
          .toThrow(new Error('Invalid property "head". Not a vertex id: 2'));
        expect(() => g.addEdge({ head: 2, tail: 0 }))
          .toThrow(new Error('Invalid property "head". Not a vertex id: 2'));
        expect(() => g.addEdge({ head: 1, tail: 0 }))
          .not.toThrow();
        const h = new Graph({ numVertices: 2, edgeList: [[0,1]] });
        expect(g).toBeGraphEquivalent(h);
      });
    });
  });
});
