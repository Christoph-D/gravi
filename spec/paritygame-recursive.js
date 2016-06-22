import ParityGame from "gravi/paritygame";
import parityWin, * as solver from "gravi/paritygame-recursive";

describe("The recursive parity game solver", function() {
  let g = {};
  beforeEach(function() {
    g = new ParityGame({ numVertices: 4, edgeList: [[0,1], [0,2], [3,2], [3,0]] });
    g.vertices[0].player = ParityGame.Even;
    g.vertices[1].player = ParityGame.Odd;
    g.vertices[2].player = ParityGame.Odd;
    g.vertices[3].player = ParityGame.Odd;
  });
  // Convert from a vertex ids to vertex objects.
  function V(vertices) { return vertices.map(i => g.vertices[i]); }
  // Convert from a vertex objects to vertex ids.
  function ids(vertices) { return vertices.map(v => v.id); }

  it("computes even", function() {
    expect(solver.even(0)).toBe(true);
    expect(solver.even(1)).toBe(false);
    expect(solver.even(2)).toBe(true);
    expect(solver.even(-1)).toBe(false);
    expect(solver.even(-2)).toBe(true);
  });

  it("computes the minimum priority", function() {
    g.vertices.forEach(v => v.priority = v.id);
    expect(solver.minPriority(g)).toEqual(0);
    g.vertices.forEach(v => v.priority = v.id + 1);
    expect(solver.minPriority(g)).toEqual(1);
  });

  it("computes attractors", function() {
    expect(ids(solver.attractor(g, ParityGame.Odd, (V([0]))))).toEqual([0,3]);
  });
  it("computes attractors", function() {
    g.vertices[3].player = ParityGame.Even;
    expect(ids(solver.attractor(g, ParityGame.Odd, (V([0]))))).toEqual([0]);
  });
  it("computes longer attractors", function() {
    g = new ParityGame({ numVertices: 5, edgeList: [[0,1], [1,2], [2,3], [3,4]] });
    expect(ids(solver.attractor(g, ParityGame.Odd, (V([4]))))).toEqual([4,3,2,1,0]);
  });

  it("solves parity games", function() {
    g = new ParityGame({ numVertices: 4, edgeList: [[0,1], [1,0], [0,2], [2,3], [3,2]] });
    g.vertices[0].player = ParityGame.Even;
    g.vertices[1].player = ParityGame.Odd;
    g.vertices[2].player = ParityGame.Odd;
    g.vertices[3].player = ParityGame.Odd;
    g.vertices[0].priority = 0;
    g.vertices[1].priority = 1;
    g.vertices[2].priority = 1;
    g.vertices[3].priority = 1;

    let W = parityWin(g, { nohighlights: true });
    expect(ids(W[0])).toEqual([0, 1]);
    expect(ids(W[1])).toEqual([2, 3]);

    g.vertices[0].player = ParityGame.Odd;
    W = parityWin(g, { nohighlights: true });
    expect(ids(W[0])).toEqual([]);
    expect(ids(W[1])).toEqual([0, 1, 2, 3]);
  });
});
