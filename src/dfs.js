const dfsStep = (graph, visited, v) => {
  graph.cursor.set(v);
  if(visited[v.id]) {
    graph.history.saveStep();
    return;
  }
  visited[v.id] = true;
  v.highlight.set("active");
  graph.history.saveStep();
  v.highlight.set("done");
  for(var e of v.outEdges()) {
    const w = graph.vertices[e.head];
    e.highlight.set("active");
    dfsStep(graph, visited, w);
    graph.cursor.set(v);
    e.highlight.set("done");
    graph.history.saveStep();
  }
};

export default graph => dfsStep(graph, [], graph.vertices[0]);
