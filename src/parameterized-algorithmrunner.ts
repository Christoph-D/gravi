import Graph, { Edge, Vertex } from "./graph";
import { ParameterizedAlgorithm } from "./algorithm";
import ManagedPropertiesListenable from "managed-property";
import BasicAlgorithmRunner from "basic-algorithmrunner";
import InfoColumn from "./info";

export default class ParameterizedAlgorithmRunner extends BasicAlgorithmRunner {
  private readonly params: ManagedPropertiesListenable;
  private readonly algorithm: ParameterizedAlgorithm;

  constructor(algorithm: ParameterizedAlgorithm, info: InfoColumn) {
    super();
    this.algorithm = algorithm;

    this.params = algorithm.makeParameters();
    info.addBox("parameters", this.params);
  }

  protected getRequirements() {
    return this.algorithm;
  }

  protected runAlgorithm(graph: Graph<Vertex, Edge>) {
    this.algorithm.run(graph, this.params);
  }
}
