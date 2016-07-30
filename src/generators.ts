import Graph from "./graph";
import ParityGame from "./paritygame";

export function generateRandomGraph(n: number, p: number) {
  const g = new ParityGame();
  for(let i = 0; i < n; ++i) {
    g.addVertex({
      x: -150 * Math.cos(2 * Math.PI / n * i),
      y: 150 * Math.sin(2 * Math.PI / n * i),
      player: Math.random() < 0.5 ? ParityGame.Even : ParityGame.Odd,
      priority: Math.round(Math.random() * 6),
    });
  }
  for(let i = 0; i < n; ++i) {
    for(let j = 0; j <= n - 1; ++j) {
      if(i === j ||
         g.hasEdge({ tail: i, head: j }) ||
         g.hasEdge({ tail: j, head: i }))
        continue;
      if(Math.random() < p) {
        g.addEdge({ head: i, tail: j });
        //const a = "a".charCodeAt(0);
        //const b = "b".charCodeAt(0);
        //g.edges[g.edges.length - 1].letter = String.fromCharCode(Math.round(Math.random() * (b - a)) + a);
      }
    }
  }
  return g;
}

export function generatePath(n: number) {
  const g = new Graph();
  for(let i = 0; i < n; ++i) {
    g.addVertex({
      x: -200 * Math.cos(Math.PI / (n - 1) * i) + 350,
      y: 200 * Math.sin(Math.PI / (n - 1) * i) + 100,
    });
  }
  for(let i = 0; i < n - 1; ++i)
    g.addEdge({ head: i + 1, tail: i });
  return g;
}

export function generateGrid() {
  const n = Math.floor(Math.random() * 4) + 2;
  const g = new ParityGame();
  for(let i = 0; i < n; ++i) {
    for(let j = 0; j < n; ++j) {
      g.addVertex({
        x: (i / (n - 1) - 0.5) * 200,
        y: (j / (n - 1) - 0.5) * 200,
        player: Math.random() < 0.5 ? ParityGame.Even : ParityGame.Odd,
        priority: Math.floor(Math.random() * 6),
      });
    }
  }
  for(let i = 0; i < n - 1; ++i) {
    for(let j = 0; j < n; ++j) {
      g.addEdge({ head: (i + 1) + j * n, tail: i + j * n });
      g.addEdge({ head: j + (i + 1) * n, tail: j + i * n });
    }
  }
  return g;
}
