import Graph, { Edge, Vertex } from "./graph";
import { Algorithm } from "./algorithm";

export default class AlgorithmRunner {
  private readonly algorithm: Algorithm;

  constructor(algorithm: Algorithm) {
    this.algorithm = algorithm;
  }
  public run(graph: Graph<Vertex, Edge>) {
    const properties = graph.vertexPropertyDescriptors().map(p => p.name);
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
    const result = this.algorithm.run(graph);
    graph.history.currentStep = 0;
    return result;
  }
}
