import { EdgeDrawable } from "./simplegraph";
import ParityGame, { VertexDrawableParity } from "./paritygame";

// Based on Jurdziński, 2006:
// "A deterministic subexponential algorithm for solving parity games"
//
// This is an implementation of the naive recursive algorithm described
// in this paper, not an implementation of the subexponential
// algorithm.

interface RemovableVertex extends VertexDrawableParity {
  removed: boolean;
}
type PG = ParityGame<RemovableVertex, EdgeDrawable>;

function notRemoved(v: RemovableVertex) { return v.removed !== true; }

export function even(priority: number) { return priority % 2 === 0; }

export function minPriority(graph: PG) {
  return Math.min(...graph.getVertices(notRemoved).map(v => v.priority));
}

function verticesOfPriority(graph: PG, priority: number) {
  return graph.getVertices(notRemoved).filter(v => v.priority === priority);
}

function allNeighborsVisited(graph: PG, v: RemovableVertex, visited) {
  return v.outNeighbors(notRemoved).every(w => visited[w.id]);
}

export function attractor(graph: PG, player, subset) {
  const visited = {};
  subset.map(u => visited[u.id] = true);
  for(;;) {
    const addition = [];
    for(const u of subset) {
      for(const v of u.inNeighbors(notRemoved)) {
        if(visited[v.id])
          continue;
        if(v.player === player || allNeighborsVisited(graph, v, visited)) {
          visited[v.id] = true;
          addition.push(v);
        }
      }
    }
    if(addition.length === 0)
      break;
    subset = subset.concat(addition);
  }
  return subset;
}

let totalRemoved = 0;

function markRemoved(graph: PG, vertices: RemovableVertex[]) {
  vertices.map(v => v.removed = true);
  totalRemoved += vertices.length;
}

function unmarkRemoved(graph: PG, vertices: RemovableVertex[]) {
  vertices.map(v => delete v.removed);
  totalRemoved -= vertices.length;
}

// Assumes no dead-ends.
function parityWinRecursive(graph: PG) {
  if(totalRemoved === graph.vertices.length)
    return [[],[]];
  const d = minPriority(graph);
  const A = verticesOfPriority(graph, d);
  const i = even(d) ? 0 : 1;
  const j = even(d) ? 1 : 0;

  let B = attractor(graph, (i === 0 ? ParityGame.Even : ParityGame.Odd), A);
  markRemoved(graph, B);
  let winningRegions = parityWinRecursive(graph);
  unmarkRemoved(graph, B);

  if(winningRegions[j].length === 0) {
    winningRegions[i] = graph.getVertices(notRemoved);
  }
  else {
    B = attractor(graph, (j === 0 ? ParityGame.Even : ParityGame.Odd), winningRegions[j]);
    markRemoved(graph, B);
    winningRegions = parityWinRecursive(graph);
    unmarkRemoved(graph, B);

    winningRegions[j] = [];
    for(const v of graph.getVertices(notRemoved))
      if(winningRegions[i].indexOf(v) === -1)
        winningRegions[j].push(v);
  }
  return winningRegions;
}

function findDeadEnds(graph: PG, player) {
  return graph.getVertices()
    .filter(v => v.player === player && v.outNeighbors().length === 0);
}

// Removes dead-ends and their attractors.
function simplifyDeadEnds(graph: PG) {
  const player0DeadEnds = findDeadEnds(graph, ParityGame.Even);
  const W1 = attractor(graph, ParityGame.Odd, player0DeadEnds);
  const player1DeadEnds = findDeadEnds(graph, ParityGame.Odd);
  const W0 = attractor(graph, ParityGame.Even, player1DeadEnds);
  markRemoved(graph, W0);
  markRemoved(graph, W1);
  return [W0, W1];
}

export default function parityWin(graph: ParityGame<any,any>,
                                  options: { nohighlights?: boolean } = {}) {
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
  const W = parityWinRecursive(graph);
  W[0] = W[0].concat(simpleW[0]);
  W[1] = W[1].concat(simpleW[1]);

  // Highlight the winning regions.
  if(!options.nohighlights) {
    W[0].map(v => v.highlight.set("player0"));
    W[1].map(v => v.highlight.set("player1"));
    graph.history.saveStep();
  }

  return W;
}

(<any>parityWin).requiredProperties = ["player", "priority"];
