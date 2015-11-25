import Graph from "./graph";
import ParityGame from "./paritygame";

export function generateRandomGraph(n, p) {
  const g = new ParityGame;
  for(let i = 0; i < n; ++i) {
    let v = new g.VertexType({
      x: -150 * Math.cos(2 * Math.PI / n * i) + 350,
      y: 150 * Math.sin(2 * Math.PI / n * i) + 200
    });
    v.player = Math.random() < 0.5 ? ParityGame.PLAYER0 : ParityGame.PLAYER1;
    v.priority = Math.round(Math.random() * 6);
    g.addVertex(v);
  }
  for(let i = 0; i < n; ++i) {
    for(let j = 0; j <= n - 1; ++j) {
      if(i == j || g.hasEdge(i, j) || g.hasEdge(j, i))
        continue;
      if(Math.random() < p) {
        g.addEdge(new g.EdgeType({head: i, tail: j}));
        //const a = "a".charCodeAt(0);
        //const b = "b".charCodeAt(0);
        //g.edges[g.edges.length - 1].letter = String.fromCharCode(Math.round(Math.random() * (b - a)) + a);
      }
    }
  }
  return g;
};

export function generatePath(n) {
  const g = new Graph;
  for(let i = 0; i < n; ++i) {
    const v = new g.VertexType({
      x: -200 * Math.cos(Math.PI / (n - 1) * i) + 350,
      y: 200 * Math.sin(Math.PI / (n - 1) * i) + 100
    });
    g.addVertex(v);
  }
  for(let i = 0; i < n - 1; ++i)
    g.addEdge(new g.EdgeType({tail: i, head: i + 1}));
  return g;
}
