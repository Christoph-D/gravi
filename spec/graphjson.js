import Graph, { Vertex } from "gravi/graph";
import graphFromJSON from "gravi/graphjson";
import graphMatcher from "./graphmatcher";

describe("The graph JSON converter", function() {
  let g = {};
  beforeEach(function() {
    jasmine.addMatchers(graphMatcher);
    g = new Graph({ numVertices: 4, edgeList: [[0,1], [0,2], [3,2], [3,0]] });
    g.vertices[0].label = "first label";
    g.vertices[1].label = "second label";
  });

  it("successfully loads the empty graph", function() {
    expect(graphFromJSON('{"type":"Graph"}', [Graph])).toBeGraphEquivalent(new Graph);
  });

  it("successfully loads a trivial graph", function() {
    expect(graphFromJSON('{"type":"Graph","vertices":[{}],"edges":[{"head":0,"tail":0}]}', [Graph]))
      .toBeGraphEquivalent(new Graph({ numVertices: 1, edgeList: [[0,0]] }));
  });

  it("leaves the graph intact", function() {
    expect(graphFromJSON(JSON.stringify(g), [Graph])).toBeGraphEquivalent(g);
  });

  it("leaves the graph intact after removing a vertex", function() {
    g.removeVertex(g.vertices[1]);
    expect(graphFromJSON(JSON.stringify(g), [Graph])).toBeGraphEquivalent(g);
  });

  it("leaves the graph intact after adding a vertex", function() {
    g.addVertex(new Vertex);
    expect(graphFromJSON(JSON.stringify(g), [Graph])).toBeGraphEquivalent(g);
  });

  it("leaves the graph intact after removing an edge", function() {
    g.removeEdge(0, 2);
    expect(graphFromJSON(JSON.stringify(g), [Graph])).toBeGraphEquivalent(g);
  });

  it("leaves the graph intact after adding an edge", function() {
    g.addEdge(2,1);
    expect(graphFromJSON(JSON.stringify(g), [Graph])).toBeGraphEquivalent(g);
  });

  it("refuses to load a graph with unknown type", function() {
    const j = JSON.parse(JSON.stringify(g));
    j.type = "InvalidType";
    expect(() => graphFromJSON(JSON.stringify(j), [Graph]))
      .toThrow(TypeError("Don't know how to make a graph of type \"InvalidType\". Known types: Graph"));
  });

  it("refuses to load a graph with no type", function() {
    const j = JSON.parse(JSON.stringify(g));
    Reflect.deleteProperty(j, "type");
    expect(() => graphFromJSON(JSON.stringify(j)))
      .toThrow(TypeError("Missing property: \"type\""));
  });

  it("refuses to load graphs with an empty edge", function() {
    expect(() => graphFromJSON('{"type":"Graph","edges":[{}]}', [Graph]))
      .toThrow(Error('Missing property "tail" on edge #0: {}'));
  });

  it("refuses to load graphs with an edge missing a head", function() {
    expect(() => graphFromJSON('{"type":"Graph","vertices":[{}],"edges":[{"tail":0}]}', [Graph]))
      .toThrow(Error('Missing property "head" on edge #0: {"tail":0}'));
  });

  it("refuses to load graphs with an edge missing a tail", function() {
    expect(() => graphFromJSON('{"type":"Graph","vertices":[{}],"edges":[{"head":0}]}', [Graph]))
      .toThrow(Error('Missing property "tail" on edge #0: {"head":0}'));
  });
});
