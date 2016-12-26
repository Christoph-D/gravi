import Graph, { Edge, Vertex } from "./graph";
import { Algorithm } from "./algorithm";
import BasicAlgorithmRunner from "./basic-algorithmrunner";

export default class AlgorithmRunner extends BasicAlgorithmRunner {
  private readonly algorithm: Algorithm;

  constructor(algorithm: Algorithm) {
    super();
    this.algorithm = algorithm;
  }

  protected getRequirements() {
    return this.algorithm;
  }

  protected runAlgorithm(graph: Graph<Vertex, Edge>) {
    return this.algorithm.run(graph);
  }
}
