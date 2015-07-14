G = require "gravi/graph"
graphMatcher = require "./graphmatcher"

describe "The graph JSON converter", ->
  g = {}
  beforeEach ->
    jasmine.addMatchers graphMatcher
    g = new G.Graph numVertices: 4, edgeList: [[0,1], [0,2], [3,2], [3,0]]
    g.vertices[0].label = "first label"
    g.vertices[1].label = "second label"

  it "sucessfully loads the empty graph", ->
    expect(G.graphFromJSON('{"type":"Graph"}', ["Graph"])).toBeGraphEquivalent(new G.Graph)

  it "sucessfully loads a trivial graph", ->
    expect(G.graphFromJSON('{"type":"Graph","vertices":[{}],"edges":[{"head":0,"tail":0}]}', ["Graph"]))
      .toBeGraphEquivalent(new G.Graph numVertices: 1, edgeList: [[0,0]])

  it "leaves the graph intact", ->
    expect(G.graphFromJSON(JSON.stringify(g), ["Graph"])).toBeGraphEquivalent(g)

  it "leaves the graph intact after removing a vertex", ->
    g.removeVertex(g.vertices[1])
    expect(G.graphFromJSON(JSON.stringify(g), ["Graph"])).toBeGraphEquivalent(g)

  it "leaves the graph intact after adding a vertex", ->
    g.addVertex(new G.Vertex)
    expect(G.graphFromJSON(JSON.stringify(g), ["Graph"])).toBeGraphEquivalent(g)

  it "leaves the graph intact after removing an edge", ->
    g.removeEdge(0, 2)
    expect(G.graphFromJSON(JSON.stringify(g), ["Graph"])).toBeGraphEquivalent(g)

  it "leaves the graph intact after adding an edge", ->
    g.addEdge(2,1)
    expect(G.graphFromJSON(JSON.stringify(g), ["Graph"])).toBeGraphEquivalent(g)

  it "refuses to load a graph with unknown type", ->
    j = JSON.parse(JSON.stringify(g))
    j.type = "InvalidType"
    expect(-> G.graphFromJSON(JSON.stringify(j), ["Dummy"]))
      .toThrow(TypeError("Don't know how to make a graph of type \"InvalidType\". Known types: Dummy"))

  it "refuses to load a graph with no type", ->
    j = JSON.parse(JSON.stringify(g))
    delete j.type
    expect(-> G.graphFromJSON(JSON.stringify(j)))
      .toThrow(TypeError("Missing property: \"type\""))

  it "refuses to load graphs with an empty edge", ->
    expect(-> G.graphFromJSON('{"type":"Graph","edges":[{}]}', ["Graph"]))
      .toThrow(Error('Missing property "tail" on edge #0: {}'))

  it "refuses to load graphs with an edge missing a head", ->
    expect(-> G.graphFromJSON('{"type":"Graph","vertices":[{}],"edges":[{"tail":0}]}', ["Graph"]))
      .toThrow(Error('Missing property "head" on edge #0: {"tail":0}'))

  it "refuses to load graphs with an edge missing a tail", ->
    expect(-> G.graphFromJSON('{"type":"Graph","vertices":[{}],"edges":[{"head":0}]}', ["Graph"]))
      .toThrow(Error('Missing property "tail" on edge #0: {"head":0}'))
