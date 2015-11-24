import * as G from "paritygame";

// Based on Jurdziński, 2006:
// "A deterministic subexponential algorithm for solving parity games"
//
// This is an implementation of the naive recursive algorithm described
// in this paper, not an implementation of the subexponential
// algorithm.

const notRemoved = (v) => v.removed != true;

const even = (priority) => priority % 2 == 0;

const minPriority = (graph) => {
  return Math.min(...graph.getVertices(notRemoved).map(v => v.priority));
};

const verticesOfPriority = (graph, priority) => {
  return graph.getVertices(notRemoved).filter(v => v.priority == priority);
};

const allNeighborsVisited = (graph, v, visited) => {
  return v.outNeighbors(notRemoved).every(w => visited[w.id]);
};

const attractor = (graph, player, subset) => {
  let visited = {};
  subset.map(u => visited[u.id] = true);
  while(true) {
    let addition = [];
    for(let u of subset) {
      for(let v of u.inNeighbors(notRemoved)) {
        if(visited[v.id])
          continue;
        if(v.player == player || allNeighborsVisited(graph, v, visited)) {
          visited[v.id] = true;
          addition.push(v);
        }
      }
    }
    if(addition.length == 0)
      break;
    subset = subset.concat(addition);
  }
  return subset;
};

let totalRemoved = 0;

const markRemoved = (graph, vertices) => {
  vertices.map(v => v.removed = true);
  totalRemoved += vertices.length;
};

const unmarkRemoved = (graph, vertices) => {
  vertices.map(v => delete v.removed);
  totalRemoved -= vertices.length;
};

// Assumes no dead-ends.
const parityWinRecursive = (graph) => {
  if(totalRemoved == graph.vertices.length)
    return [[],[]];
  const d = minPriority(graph);
  const A = verticesOfPriority(graph, d);
  const i = even(d) ? 0 : 1;
  const j = even(d) ? 1 : 0;

  let B = attractor(graph, (i == 0 ? G.PLAYER0 : G.PLAYER1), A);
  markRemoved(graph, B);
  let winningRegions = parityWinRecursive(graph);
  unmarkRemoved(graph, B);

  if(winningRegions[j].length == 0) {
    winningRegions[i] = graph.getVertices(notRemoved);
  }
  else {
    B = attractor(graph, (j == 0 ? G.PLAYER0 : G.PLAYER1), winningRegions[j]);
    markRemoved(graph, B);
    winningRegions = parityWinRecursive(graph);
    unmarkRemoved(graph, B);

    winningRegions[j] = [];
    for(let v of graph.getVertices(notRemoved))
      if(winningRegions[i].indexOf(v) == -1)
        winningRegions[j].push(v);
  }
  return winningRegions;
};

const findDeadEnds = (graph, player) => {
  return graph.getVertices()
    .filter(v => v.player == player && v.outNeighbors().length == 0);
};

// Removes dead-ends and their attractors.
const simplifyDeadEnds = (graph) => {
  const player0DeadEnds = findDeadEnds(graph, G.PLAYER0);
  const W1 = attractor(graph, G.PLAYER1, player0DeadEnds);
  const player1DeadEnds = findDeadEnds(graph, G.PLAYER1);
  const W0 = attractor(graph, G.PLAYER0, player1DeadEnds);
  markRemoved(graph, W0);
  markRemoved(graph, W1);
  return [W0, W1];
};

export const parityWin = (graph) => {
  // We want totalRemoved == graph.vertices.length to mean "all
  // vertices are removed".  For this, we cannot have null entries in
  // the vertex list.
  graph.compressIds();
  // Make sure no vertices are marked "removed" yet.
  graph.getVertices().map(v => delete v.removed);
  totalRemoved = 0;

  // Compute and remove the obvious winning regions caused by
  // dead-ends.
  const simpleW = simplifyDeadEnds(graph);
  // Compute the winning regions of the remaining graph.
  let W = parityWinRecursive(graph);
  W[0] = W[0].concat(simpleW[0]);
  W[1] = W[1].concat(simpleW[1]);

  // Highlight the winning regions.
  W[0].map(v => v.highlight.set("player0"));
  W[1].map(v => v.highlight.set("player1"));
  graph.history.saveStep();

  return W;
};