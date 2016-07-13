import Graph, { Edge, Vertex } from "./graph";

export type Algorithm = {
  (g: Graph<Vertex, Edge>): any;
  requiredProperties?: string[];
  checkPreConditions?: (g: Graph<Vertex, Edge>) => boolean;
};

export default class AlgorithmRunner {
  private readonly algorithm: Algorithm;

  constructor(algorithm) {
    this.algorithm = algorithm;
  }
  run(graph: Graph<Vertex, Edge>) {
    const properties = graph.VertexType.propertyDescriptors.map(p => p.name);
    if(this.algorithm.requiredProperties != null) {
      const missing: string[] = [];
      for(const p of this.algorithm.requiredProperties)
        if(properties.indexOf(p) === -1)
          missing.push(p);
      if(missing.length > 0)
        throw Error(`Properties "${missing}" required by this algorithm do not exist in this graph.`);
    }
    graph.history.reset();
    if(this.algorithm.checkPreConditions != null)
      this.algorithm.checkPreConditions(graph);
    const result = this.algorithm(graph);
    graph.history.currentStep = 0;
    return result;
  }
}
