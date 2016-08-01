import ParityGame from "gravi/paritygame";

describe("A parity game", function() {
  let g = {};
  beforeEach(function() {
    g = new ParityGame({ numVertices: 3, edgeList: [[0,1], [0,2]] });
    g.vertices[0].player = ParityGame.Even;
    g.vertices[1].player = ParityGame.Odd;
    g.vertices[2].player = ParityGame.Odd;
    g.vertices[0].priority = 1;
    g.vertices[1].priority = 2;
    g.vertices[2].priority = 3;
  });

  it("marks incident edges as modified when changing a player", function() {
    g.findEdge({ head: 1, tail: 0 }).modified = false;
    g.findEdge({ head: 2, tail: 0 }).modified = false;
    g.vertices[1].player = ParityGame.Even;
    expect(g.findEdge({ head: 1, tail: 0 }).modified).toBe(true);
    expect(g.findEdge({ head: 2, tail: 0 }).modified).toBe(false);
  });

  it("queues a redraw when changing a player", function() {
    let seen = false;
    g.on("redrawNeeded", () => { seen = true; });
    g.vertices[1].player = ParityGame.Even;
    expect(seen).toBe(true);
  });

  it("queues a redraw when changing a priority", function() {
    let seen = false;
    g.on("redrawNeeded", () => { seen = true; });
    g.vertices[1].priority = 5;
    expect(seen).toBe(true);
  });

  it("notifies the graph when changing a player", function() {
    let v0 = null;
    g.on("changePlayer", (v) => { v0 = v; });
    g.vertices[1].player = ParityGame.Even;
    expect(v0).toBe(g.vertices[1]);
  });

  it("notifies the graph when changing a priority", function() {
    let v0 = null;
    g.on("changePriority", (v) => { v0 = v; });
    g.vertices[1].priority = 5;
    expect(v0).toBe(g.vertices[1]);
  });
});
